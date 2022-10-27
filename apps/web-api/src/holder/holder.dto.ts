import { Tokens } from '@entities/Tokens';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('holder')
export class HolderDTO implements Partial<Tokens> {
  @Field(() => Int)
  count?: number;

  @Field(() => String)
  owner?: string;

  @Field(() => String)
  owner_normalized?: string;

  @Field(() => Int)
  collection_id?: number;
}
