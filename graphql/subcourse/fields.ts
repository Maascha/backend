import { Prisma } from '@prisma/client';
import { canPublish } from '../../common/courses/states';
import { Arg, Authorized, Ctx, Field, FieldResolver, Int, ObjectType, Query, Resolver, Root } from 'type-graphql';
import { canJoinSubcourse, getCourseCapacity, isParticipant } from '../../common/courses/participants';
import { CourseState } from '../../common/entity/Course';
import { prisma } from '../../common/prisma';
import { getSessionPupil, getSessionStudent, isElevated, isSessionPupil, isSessionStudent } from '../authentication';
import { Role } from '../authorizations';
import { PublicCache } from '../cache';
import { LimitedQuery, LimitEstimated } from '../complexity';
import { GraphQLContext } from '../context';
import { Bbb_meeting as BBBMeeting, Course, Lecture, Pupil, pupil_schooltype_enum, Subcourse } from '../generated';
import { Decision } from '../types/reason';
import { Instructor } from '../types/instructor';
import { canContactInstructors } from '../../common/courses/contact';
import { getCourse } from '../util';

@ObjectType()
class Participant {
    @Field((_type) => Int)
    id: number;
    @Field((_type) => String)
    firstname: string;
    @Field((_type) => String)
    lastname: string;
    @Field((_type) => String)
    grade: string;
    @Field((_type) => pupil_schooltype_enum)
    schooltype: 'grundschule' | 'gesamtschule' | 'hauptschule' | 'realschule' | 'gymnasium' | 'f_rderschule' | 'berufsschule' | 'other';
    @Field((_type) => String)
    aboutMe: string;
}

@ObjectType()
class OtherParticipant {
    @Field((_type) => Int)
    id: number;
    @Field((_type) => String)
    firstname: string;
    @Field((_type) => String)
    grade: string;
    @Field((_type) => String)
    aboutMe: string;
}

function IS_PUBLIC_SUBCOURSE(): Prisma.subcourseWhereInput {
    return {
        published: { equals: true },
        cancelled: { equals: false },
        course: {
            is: {
                courseState: { equals: CourseState.ALLOWED },
            },
        },
        lecture: { some: { start: { gt: new Date() } } },
    };
}

@Resolver((of) => Subcourse)
export class ExtendedFieldsSubcourseResolver {
    @Query((returns) => [Subcourse])
    @Authorized(Role.UNAUTHENTICATED)
    @LimitedQuery()
    @PublicCache()
    async subcoursesPublic(
        @Ctx() context: GraphQLContext,
        @Arg('take', { nullable: true }) take?: number,
        @Arg('skip', { nullable: true }) skip?: number,
        @Arg('search', { nullable: true }) search?: string,
        @Arg('onlyJoinable', { nullable: true }) onlyJoinable?: boolean,
        @Arg('excludeKnown', { nullable: true }) excludeKnown?: boolean
    ) {
        // All filters need to match
        const filters = [IS_PUBLIC_SUBCOURSE()];

        if (search) {
            filters.push({
                course: { is: { OR: [{ outline: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }] } },
            });
        }

        if (onlyJoinable) {
            filters.push({
                OR: [
                    { joinAfterStart: { equals: false }, lecture: { every: { start: { gt: new Date() } } } },
                    { joinAfterStart: { equals: true }, lecture: { some: { start: { gt: new Date() } } } },
                ],
            });
        }

        if (excludeKnown) {
            if (isSessionStudent(context)) {
                filters.push({
                    subcourse_instructors_student: { none: { studentId: context.user!.studentId! } },
                });
            } else if (isSessionPupil(context)) {
                filters.push({
                    subcourse_participants_pupil: { none: { pupilId: context.user!.pupilId! } },
                    subcourse_waiting_list_pupil: { none: { pupilId: context.user!.pupilId! } },
                });
            } /* else ignore */
        }

        return await prisma.subcourse.findMany({
            where: { AND: filters },
            take,
            skip,
            orderBy: { updatedAt: 'desc' },
        });
    }

    @Query((returns) => Subcourse, { nullable: true })
    @Authorized(Role.UNAUTHENTICATED)
    async subcourse(@Ctx() context: GraphQLContext, @Arg('subcourseId', (type) => Int) subcourseId: number) {
        if (isElevated(context)) {
            // Admins and Screeners can see every subcourse:
            return await prisma.subcourse.findFirst({ where: { id: subcourseId } });
        }

        // Only one of the filters needs to match to grant the user access:
        const accessGrantFilters = [IS_PUBLIC_SUBCOURSE()];

        if (isSessionPupil(context)) {
            // A pupil has access to unpublished subcourses if they are a participant ...
            accessGrantFilters.push({
                subcourse_participants_pupil: {
                    some: { pupilId: context.user!.pupilId! },
                },
            });

            // ... or on the waiting list
            accessGrantFilters.push({
                subcourse_participants_pupil: {
                    some: { pupilId: context.user!.pupilId! },
                },
            });
        }

        if (isSessionStudent(context)) {
            // Students have access to all subcourses they own
            accessGrantFilters.push({
                subcourse_instructors_student: {
                    some: { studentId: context.user!.studentId },
                },
            });
        }

        // Returns null if the subcourse does not exist,
        //  or if the user does not have access
        return await prisma.subcourse.findFirst({
            where: {
                id: subcourseId,
                OR: accessGrantFilters,
            },
        });
    }

    @FieldResolver((returns) => [Instructor])
    @Authorized(Role.UNAUTHENTICATED)
    async instructors(@Root() subcourse: Subcourse): Promise<Instructor[]> {
        return await prisma.student.findMany({
            select: { firstname: true, lastname: true, id: true, aboutMe: true },
            where: { subcourse_instructors_student: { some: { subcourseId: subcourse.id } } },
        });
    }

    @FieldResolver((returns) => Course)
    @Authorized(Role.UNAUTHENTICATED)
    @LimitEstimated(1)
    @PublicCache()
    async course(@Root() subcourse: Subcourse) {
        return await prisma.course.findUnique({
            where: { id: subcourse.courseId },
        });
    }

    @FieldResolver((returns) => [Lecture])
    @Authorized(Role.UNAUTHENTICATED)
    @LimitEstimated(10)
    @PublicCache()
    async lectures(@Root() subcourse: Subcourse) {
        return await prisma.lecture.findMany({
            where: {
                subcourseId: subcourse.id,
            },
            orderBy: { start: 'asc' },
        });
    }

    @FieldResolver((returns) => Lecture, { nullable: true })
    @Authorized(Role.UNAUTHENTICATED)
    @LimitEstimated(1)
    async firstLecture(@Root() subcourse: Subcourse) {
        return await prisma.lecture.findFirst({
            where: {
                subcourseId: subcourse.id,
            },
            orderBy: { start: 'asc' },
        });
    }

    @FieldResolver((returns) => Lecture, { nullable: true })
    @Authorized(Role.UNAUTHENTICATED)
    @LimitEstimated(1)
    async nextLecture(@Root() subcourse: Subcourse) {
        return await prisma.lecture.findFirst({
            where: {
                subcourseId: subcourse.id,
                start: { gte: new Date() },
            },
            orderBy: { start: 'asc' },
        });
    }

    @FieldResolver((returns) => Lecture, { nullable: true })
    @Authorized(Role.UNAUTHENTICATED)
    @LimitEstimated(1)
    async ongoingLecture(@Root() subcourse: Subcourse) {
        // It is assumed that only one lecture can happen at a time

        // It might be desirable to show a lecture as ongoing right before it starts,
        // so that users can prepare:
        const SLACK = 10; /* minutes */

        const inNMinutes = new Date();
        inNMinutes.setMinutes(inNMinutes.getMinutes() + SLACK);

        // Get the lecture that started last, not necessarily still ongoing
        const firstStarted = await prisma.lecture.findFirst({
            where: {
                subcourseId: subcourse.id,
                start: { lte: inNMinutes },
            },
            orderBy: { start: 'asc' },
        });

        if (!firstStarted) {
            return null;
        }

        const endsAt = new Date(firstStarted.createdAt);
        endsAt.setMinutes(endsAt.getMinutes() + firstStarted.duration + SLACK);

        if (+endsAt < Date.now()) {
            // Lecture already ended
            return null;
        }

        return firstStarted;
    }

    @FieldResolver((returns) => [Participant])
    @Authorized(Role.OWNER)
    @LimitEstimated(100)
    async participants(@Root() subcourse: Subcourse) {
        return await prisma.pupil.findMany({
            where: {
                subcourse_participants_pupil: {
                    some: {
                        subcourseId: subcourse.id,
                    },
                },
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                grade: true,
                schooltype: true,
                aboutMe: true,
            },
        });
    }

    @FieldResolver((returns) => [OtherParticipant])
    @Authorized(Role.SUBCOURSE_PARTICIPANT)
    @LimitEstimated(100)
    async otherParticipants(@Ctx() context: GraphQLContext, @Root() subcourse: Subcourse) {
        return await prisma.pupil.findMany({
            where: {
                subcourse_participants_pupil: {
                    some: {
                        subcourseId: subcourse.id,
                        pupilId: { not: context.user.pupilId },
                    },
                },
            },
            select: {
                id: true,
                firstname: true,
                grade: true,
                aboutMe: true,
            },
        });
    }

    @FieldResolver((returns) => [Pupil])
    @Authorized(Role.ADMIN)
    @LimitEstimated(100)
    async participantsAsPupil(@Root() subcourse: Subcourse) {
        return await prisma.pupil.findMany({
            where: {
                subcourse_participants_pupil: {
                    some: {
                        subcourseId: subcourse.id,
                    },
                },
            },
        });
    }

    @FieldResolver((returns) => Number)
    @Authorized(Role.UNAUTHENTICATED)
    @PublicCache()
    async participantsCount(@Root() subcourse: Subcourse) {
        return await prisma.subcourse_participants_pupil.count({
            where: { subcourseId: subcourse.id },
        });
    }

    @FieldResolver((returns) => [Pupil])
    @Authorized(Role.ADMIN)
    @LimitEstimated(100)
    async pupilsWaiting(@Root() subcourse: Subcourse) {
        return await prisma.pupil.findMany({
            where: {
                subcourse_waiting_list_pupil: {
                    some: {
                        subcourseId: subcourse.id,
                    },
                },
            },
        });
    }

    @FieldResolver((returns) => Number)
    @Authorized(Role.UNAUTHENTICATED)
    @PublicCache()
    async pupilsWaitingCount(@Root() subcourse: Subcourse) {
        return await prisma.subcourse_waiting_list_pupil.count({
            where: { subcourseId: subcourse.id },
        });
    }

    @FieldResolver((returns) => Boolean)
    @Authorized(Role.UNAUTHENTICATED)
    async isParticipant(@Ctx() context: GraphQLContext, @Root() subcourse: Required<Subcourse>, @Arg('pupilId', { nullable: true }) pupilId: number) {
        if (!isElevated(context) && !isSessionPupil(context)) {
            return false;
        }

        const pupil = await getSessionPupil(context, pupilId);
        return isParticipant(subcourse, pupil);
    }

    @FieldResolver((returns) => Boolean)
    @Authorized(Role.UNAUTHENTICATED)
    async isInstructor(@Ctx() context: GraphQLContext, @Root() subcourse: Subcourse, @Arg('studentId', { nullable: true }) studentId: number) {
        if (!isElevated(context) && !isSessionStudent(context)) {
            return false;
        }

        const student = await getSessionStudent(context, studentId);
        return (await prisma.subcourse_instructors_student.count({ where: { subcourseId: subcourse.id, studentId: student.id } })) > 0;
    }

    @FieldResolver((returns) => Boolean)
    @Authorized(Role.UNAUTHENTICATED)
    async isOnWaitingList(@Ctx() context: GraphQLContext, @Root() subcourse: Subcourse, @Arg('pupilId', { nullable: true }) pupilId: number) {
        if (!isElevated(context) && !isSessionPupil(context)) {
            return false;
        }

        const pupil = await getSessionPupil(context, pupilId);
        return (await prisma.subcourse_waiting_list_pupil.count({ where: { subcourseId: subcourse.id, pupilId: pupil.id } })) > 0;
    }

    @FieldResolver((returns) => BBBMeeting, { nullable: true })
    @Authorized(Role.OWNER, Role.ADMIN)
    async meeting(@Root() subcourse: Subcourse) {
        return await prisma.bbb_meeting.findFirst({
            where: { meetingID: '' + subcourse.id },
        });
    }

    @FieldResolver((returns) => Decision)
    @Authorized(Role.ADMIN, Role.PUPIL)
    async canJoin(@Ctx() context: GraphQLContext, @Root() subcourse: Required<Subcourse>, @Arg('pupilId', { nullable: true }) pupilId: number) {
        const pupil = await getSessionPupil(context, pupilId);
        return await canJoinSubcourse(subcourse, pupil);
    }

    @FieldResolver((returns) => Decision)
    @Authorized(Role.ADMIN, Role.OWNER)
    async canPublish(@Root() subcourse: Required<Subcourse>) {
        return await canPublish(subcourse);
    }

    @FieldResolver((returns) => Decision)
    @Authorized(Role.PARTICIPANT, Role.INSTRUCTOR)
    async canContactInstructor(@Root() subcourse: Required<Subcourse>) {
        const course = await getCourse(subcourse.courseId);
        return await canContactInstructors(course, subcourse);
    }

    @FieldResolver((returns) => Number)
    @Authorized(Role.PARTICIPANT, Role.INSTRUCTOR)
    async capacity(@Root() subcourse: Required<Subcourse>) {
        return getCourseCapacity(subcourse);
    }
}
