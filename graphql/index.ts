import { FindManyCourseResolver, applyResolversEnhanceMap, applyModelsEnhanceMap, FindManyStudentResolver } from './generated';
import { buildSchemaSync } from 'type-graphql';
import {
    FindManyMatchResolver,
    FindManyPupilResolver,
    FindManyProject_matchResolver,
    FindManySubcourseResolver,
    FindManyLectureResolver,
    FindManyConcrete_notificationResolver,
    FindManyNotificationResolver,
    FindManySchoolResolver,
    FindManyScreenerResolver,
    FindManyCourse_tagResolver,
} from './generated/resolvers/crud';
import { authChecker, authorizationEnhanceMap, authorizationModelEnhanceMap } from './authorizations';
import { MutatePupilResolver } from './pupil/mutations';
import injectContext from './context';
import { ApolloServer } from 'apollo-server-express';
import { GraphQLLogger } from './logging';
import { PluginDefinition } from 'apollo-server-core';
import { ExtendFieldsPupilResolver } from './pupil/fields';
import { ExtendedFieldsSubcourseResolver } from './subcourse/fields';
import { ExtendedFieldsCourseResolver } from './course/fields';
import { ExtendedFieldsMatchResolver } from './match/fields';
import { ExtendedFieldsProjectMatchResolver } from './project_match/fields';
import { MutateNotificationResolver } from './notification/mutations';
import { complexityEnhanceMap } from './complexity';
import { AuthenticationResolver } from './authentication';
import { FieldMeResolver } from './me/fields';
import { MutateMatchResolver } from './match/mutations';
import { MutateTutoringInterestConfirmationResolver } from './tutoring_interest_confirmation/mutations';
import { MutateParticipationCertificateResolver } from './certificate/mutations';
import { ExtendedFieldsParticipationCertificateResolver } from './certificate/fields';
import { ExtendFieldsStudentResolver } from './student/fields';
import { ExtendedFieldsLectureResolver } from './lecture/fields';
import { MutateMeResolver } from './me/mutation';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { cacheModelEnhancementMap } from './cache';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ExtendedFieldsSchoolResolver } from './school/fields';
import { MutateStudentResolver } from './student/mutations';
import { MutateCertificateOfConductResolver } from './certificate_of_conduct/mutations';
import { ExtendedFieldsCertificateOfConductResolver } from './certificate_of_conduct/fields';
import { isDev } from '../common/util/environment';
import { formatError } from './error';
import { NotificationBulkRunResolver, NotificationExtendedFieldsResolver } from './notification/fields';
import { FieldsMatchPoolResolver } from './match_pool/fields';
import { MutateMatchPoolResolver } from './match_pool/mutations';
import { MutateSecretResolver } from './secret/mutation';
import { MutateCourseResolver } from './course/mutations';
import { MutateConcreteNotificationsResolver } from './concrete_notification/mutations';
import { ExtendedFieldsConcreteNotificationResolver } from './concrete_notification/fields';
import { MutateSubcourseResolver } from './subcourse/mutations';
import { UserFieldsResolver } from './user/fields';
import { MutateUserResolver } from './user/mutations';
import { StatisticsResolver } from './statistics/fields';
import { MutateMentorResolver } from './mentor/mutations';
import { AdminMutationsResolver } from './admin';
import { ExtendedFieldsTutorScreeningResolver } from './tutor_screening/fields';
import { ExtendedFieldsInstructorScreeningResolver } from './instructor_screening/fields';
import { MutateScreenerResolver } from './screener/mutations';
import { validate } from './validators';
import { ExtendedFieldsMessageTranslationResolver } from './message_translation/fields';

applyResolversEnhanceMap(authorizationEnhanceMap);
applyResolversEnhanceMap(complexityEnhanceMap);
applyModelsEnhanceMap(authorizationModelEnhanceMap);
applyModelsEnhanceMap(cacheModelEnhancementMap);

const schema = buildSchemaSync({
    validate,
    resolvers: [
        /* User Authentication & Information */
        AuthenticationResolver,
        UserFieldsResolver,
        MutateUserResolver,
        FieldMeResolver,
        MutateMeResolver,

        /* Course */
        FindManyCourseResolver,
        ExtendedFieldsCourseResolver,
        FindManyCourse_tagResolver,

        FindManySubcourseResolver,
        ExtendedFieldsSubcourseResolver,
        MutateSubcourseResolver,

        ExtendedFieldsLectureResolver,
        FindManyLectureResolver,
        MutateCourseResolver,

        /* Pupil */
        FindManyPupilResolver,
        ExtendFieldsPupilResolver,
        MutatePupilResolver,

        /* Student */
        FindManyStudentResolver,
        ExtendFieldsStudentResolver,
        MutateStudentResolver,

        /* Match */
        FindManyMatchResolver,
        ExtendedFieldsMatchResolver,
        MutateMatchResolver,

        /* Projects */
        FindManyProject_matchResolver,
        ExtendedFieldsProjectMatchResolver,

        /* Notifications */
        FindManyNotificationResolver,
        MutateNotificationResolver,
        NotificationBulkRunResolver,
        NotificationExtendedFieldsResolver,
        FindManyConcrete_notificationResolver,
        ExtendedFieldsConcreteNotificationResolver,
        MutateConcreteNotificationsResolver,
        ExtendedFieldsMessageTranslationResolver,

        /* TutoringInterestConfirmation */
        MutateTutoringInterestConfirmationResolver,

        /* ParticipationCertificate */
        ExtendedFieldsParticipationCertificateResolver,
        MutateParticipationCertificateResolver,

        /* Schools */
        FindManySchoolResolver,
        ExtendedFieldsSchoolResolver,

        /* Certificate of Conduct */
        MutateCertificateOfConductResolver,
        ExtendedFieldsCertificateOfConductResolver,

        /* MatchPool */
        FieldsMatchPoolResolver,
        MutateMatchPoolResolver,

        /* Secret */
        MutateSecretResolver,

        /* Statistics */
        StatisticsResolver,

        /* Mentor */
        MutateMentorResolver,

        /* Tutor Screenings */
        ExtendedFieldsTutorScreeningResolver,

        /* Instructor Screenings */
        ExtendedFieldsInstructorScreeningResolver,

        /* Screeners */
        FindManyScreenerResolver,
        MutateScreenerResolver,

        AdminMutationsResolver,
    ],
    authChecker,
});

const plugins: PluginDefinition[] = [responseCachePlugin() as any, GraphQLLogger as any, ApolloServerPluginLandingPageGraphQLPlayground()];

export const apolloServer = new ApolloServer({
    schema,
    context: injectContext,
    plugins,
    // As this repository is open source anyways, there is no sense in keeping our graph private ("security by obscurity" doesn't work anyways)
    introspection: true,
    debug: isDev,
    formatError,
});
