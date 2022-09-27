import { Contract } from '@entities/Contract';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('contract')
export class ContractDTO implements Partial<Contract> {
  @Field(() => String)
  contract_id?: string;

  @Field(() => String)
  abi?: string;
}
