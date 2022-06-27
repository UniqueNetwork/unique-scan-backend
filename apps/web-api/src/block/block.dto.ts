import { Block } from '@entities/Block';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('block')
export class BlockDto implements Partial<Block> {
  @Field(() => Int, { nullable: true })
  block_number?: number;

  @Field(() => String, { nullable: true })
  block_hash?: string;

  @Field(() => String, { nullable: true })
  parent_hash?: string;

  @Field(() => String, { nullable: true })
  extrinsics_root?: string;

  @Field(() => String, { nullable: true })
  state_root?: string | null;

  @Field(() => Int, { nullable: true })
  session_length?: string | null;

  @Field(() => String, { nullable: true })
  spec_name?: string;

  @Field(() => Int, { nullable: true })
  spec_version?: number;

  @Field(() => Int, { nullable: true })
  total_events?: number;

  @Field(() => Int, { nullable: true })
  num_transfers?: number;

  @Field(() => Int, { nullable: true })
  new_accounts?: number;

  @Field(() => String, { nullable: true })
  total_issuance?: string;

  @Field(() => Int, { nullable: true })
  timestamp?: string;

  @Field(() => Boolean, { nullable: true })
  need_rescan?: boolean;

  @Field(() => Int, { nullable: true })
  total_extrinsics?: number;
}
