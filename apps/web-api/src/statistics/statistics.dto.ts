import { Total } from '@entities/Total';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('statistics')
export class StatisticsDTO implements Partial<Total> {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => Int, { nullable: true })
  count?: number;
}
