import { getUser } from '../common/user';
import { Directive } from 'type-graphql';
import { prisma } from '../common/prisma';

/* Helpers to get Entities by their primary key */
export const getPupil = (pupilId: number) => prisma.pupil.findUnique({ where: { id: pupilId }, rejectOnNotFound: true });
export const getSubcourse = (subcourseId: number) => prisma.subcourse.findUnique({ where: { id: subcourseId }, rejectOnNotFound: true });
export const getMatch = (matchId: number) => prisma.match.findUnique({ where: { id: matchId }, rejectOnNotFound: true });
export const getStudent = (studentId: number) => prisma.student.findUnique({ where: { id: studentId }, rejectOnNotFound: true });
export const getScreener = (screenerId: number) => prisma.screener.findUnique({ where: { id: screenerId }, rejectOnNotFound: true });
export const getCourse = (courseId: number) => prisma.course.findUnique({ where: { id: courseId }, rejectOnNotFound: true });
export const getLecture = (lectureId: number) => prisma.lecture.findUnique({ where: { id: lectureId }, rejectOnNotFound: true });

export const getUsers = (userIds: string[]) => Promise.all(userIds.map(userId => getUser(userId)));

export function Deprecated(reason: string) {
    return Directive(`@deprecated(reason: "${reason}")`);
}


/* GraphQL only has 'null values' whereas Prisma has dedicated semantics:
   - null means 'set to NULL'
   - undefined means 'do not change'
   Thus in a lot of cases we want to make sure that undefined is passed to Prisma
   (and never null) */
   export function ensureNoNull<T>(value: T | null | undefined): T | undefined {
    if (value === null) {
        return undefined;
    }
    return value;
}