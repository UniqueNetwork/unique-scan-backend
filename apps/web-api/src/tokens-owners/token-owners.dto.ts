import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TokensOwners } from '@entities/TokensOwners';

export enum TokenOwnersDistinctFieldsEnum {
  token_id = 'token_id',
  collection_id = 'collection_id',

  amount = 'amount',
  owner = 'owner',
  owner_normalized = 'owner_normalized',

  date_created = 'date_created',
}

@ObjectType('tokens_owners')
export class TokenOwnersDTO implements Partial<TokensOwners> {
  @Field(() => String)
  id?: string;

  @Field(() => Int)
  collection_id?: number;

  @Field(() => Int)
  token_id?: number;

  @Field(() => Int)
  amount?: number;

  @Field(() => String)
  owner?: string;

  @Field(() => String)
  owner_normalized?: string;

  @Field(() => String, { nullable: true })
  date_created?: string;
}
