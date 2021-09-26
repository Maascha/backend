import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Certificate_of_conductCreateInput } from "../../../inputs/Certificate_of_conductCreateInput";
import { Certificate_of_conductUpdateInput } from "../../../inputs/Certificate_of_conductUpdateInput";
import { Certificate_of_conductWhereUniqueInput } from "../../../inputs/Certificate_of_conductWhereUniqueInput";

@TypeGraphQL.ArgsType()
export class UpsertCertificate_of_conductArgs {
  @TypeGraphQL.Field(_type => Certificate_of_conductWhereUniqueInput, {
    nullable: false
  })
  where!: Certificate_of_conductWhereUniqueInput;

  @TypeGraphQL.Field(_type => Certificate_of_conductCreateInput, {
    nullable: false
  })
  create!: Certificate_of_conductCreateInput;

  @TypeGraphQL.Field(_type => Certificate_of_conductUpdateInput, {
    nullable: false
  })
  update!: Certificate_of_conductUpdateInput;
}
