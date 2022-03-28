import { Extrinsic } from '@entities/Extrinsic';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('extrinsic')
export class ExtrinsicDTO implements Partial<Extrinsic> {
  @Field(() => String)
  block_index?: string;

  @Field(() => String)
  block_number?: string;

  @Field(() => String)
  from_owner?: string;

  @Field(() => String)
  to_owner?: string;

  @Field(() => String)
  hash?: string;

  @Field(() => Boolean)
  success?: boolean;

  @Field(() => Int)
  timestamp?: string;

  @Field(() => String)
  method?: string;

  @Field(() => String)
  section?: string;

  @Field(() => Float, { nullable: true })
  amount?: string;

  @Field(() => Float, { nullable: true })
  fee?: string;
}
