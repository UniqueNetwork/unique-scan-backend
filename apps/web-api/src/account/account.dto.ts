import { Account } from '@entities/Account';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('account')
export class AccountDTO implements Partial<Account> {
  @Field(() => String)
  account_id?: string;

  @Field(() => String)
  available_balance?: string;

  @Field(() => String)
  free_balance?: string;

  @Field(() => String)
  locked_balance?: string;

  @Field(() => Int)
  nonce?: string;

  @Field(() => Boolean)
  is_staking?: boolean;
}
