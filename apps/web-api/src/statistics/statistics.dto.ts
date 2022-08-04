import { Total } from '@entities/Total';
import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType('statistics')
export class StatisticsDTO implements Partial<Total> {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => Float, { nullable: true })
  count?: number;
}
