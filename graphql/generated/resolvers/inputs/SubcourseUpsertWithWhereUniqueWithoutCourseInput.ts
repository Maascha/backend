import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../../scalars";
import { SubcourseCreateWithoutCourseInput } from "../inputs/SubcourseCreateWithoutCourseInput";
import { SubcourseUpdateWithoutCourseInput } from "../inputs/SubcourseUpdateWithoutCourseInput";
import { SubcourseWhereUniqueInput } from "../inputs/SubcourseWhereUniqueInput";

@TypeGraphQL.InputType({
  isAbstract: true
})
export class SubcourseUpsertWithWhereUniqueWithoutCourseInput {
  @TypeGraphQL.Field(_type => SubcourseWhereUniqueInput, {
    nullable: false
  })
  where!: SubcourseWhereUniqueInput;

  @TypeGraphQL.Field(_type => SubcourseUpdateWithoutCourseInput, {
    nullable: false
  })
  update!: SubcourseUpdateWithoutCourseInput;

  @TypeGraphQL.Field(_type => SubcourseCreateWithoutCourseInput, {
    nullable: false
  })
  create!: SubcourseCreateWithoutCourseInput;
}
