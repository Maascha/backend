import { Student, Pupil, Screener, Match_pool_run as MatchPoolRun } from "../generated";
import { Arg, Authorized, Ctx, Field, FieldResolver, ObjectType, Query, Resolver, Root, Int } from "type-graphql";
import { getStudents, getPupils, getStudentCount, getPupilCount, MatchPool as MatchPoolType, pools, getPoolRuns } from "../../common/match/pool";
import { Role } from "../authorizations";

@ObjectType()
class MatchPoolAutomatic {
    @Field()
    minStudents: number;
    @Field()
    minPupils: number;
}

@ObjectType()
class MatchPool {
    @Field()
    name: string;
    @Field({ nullable: true })
    automatic?: MatchPoolAutomatic;
    @Field(type => [String])
    toggles: string[];
}

@Resolver(of => MatchPool)
export class FieldsMatchPoolResolver {
    @Query(returns => [MatchPool])
    @Authorized(Role.ADMIN)
    match_pools() {
        return pools;
    }

    @Query(returns => MatchPool)
    @Authorized(Role.ADMIN)
    match_pool(@Arg("name") name: string) {
        return pools.find(it => it.name === name);
    }

    @FieldResolver(returns => [Student])
    @Authorized(Role.ADMIN)
    async studentsToMatch(@Root() matchPool: MatchPoolType, @Arg("toggles", _type => [String], { nullable: true }) toggles?: string[], @Arg("skip", { nullable: true }) skip?: number, @Arg("take", { nullable: true }) take?: number) {
        return await getStudents(matchPool, toggles ?? [], take, skip);
    }

    @FieldResolver(returns => [Pupil])
    @Authorized(Role.ADMIN)
    async pupilsToMatch(@Root() matchPool: MatchPoolType, @Arg("toggles", _type => [String], { nullable: true }) toggles?: string[], @Arg("skip", { nullable: true }) skip?: number, @Arg("take", { nullable: true }) take?: number) {
        return await getPupils(matchPool, toggles ?? [], take, skip);
    }

    @FieldResolver(returns => Int)
    @Authorized(Role.ADMIN)
    async studentsToMatchCount(@Root() matchPool: MatchPoolType, @Arg("toggles", _type => [String], { nullable: true }) toggles?: string[]) {
        return await getStudentCount(matchPool, toggles ?? []);
    }

    @FieldResolver(returns => Int)
    @Authorized(Role.ADMIN)
    async pupilsToMatchCount(@Root() matchPool: MatchPoolType, @Arg("toggles", _type => [String], { nullable: true }) toggles?: string[]) {
        return await getPupilCount(matchPool, toggles ?? []);
    }

    @FieldResolver(returns => [MatchPoolRun])
    @Authorized(Role.ADMIN)
    async runs(@Root() matchPool: MatchPoolType) {
        return await getPoolRuns(matchPool);
    }
}