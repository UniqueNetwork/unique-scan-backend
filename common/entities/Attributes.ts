import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Tokens } from './Tokens';
import { Collections } from './Collections';
import { TokenByIdResultV2 } from '@unique-nft/substrate-client/tokens';

type IV2Attribute = TokenByIdResultV2['attributes'][0];

@Index('attributes_token_collection', ['token_id', 'collection_id'])
@Entity('attributes', { schema: 'public' })
export class Attribute implements IV2Attribute {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @Column('integer', { name: 'token_id' })
  token_id: number;

  @Column('bigint', { name: 'collection_id' })
  collection_id: number;

  @Column('text', { name: 'trait_type' })
  trait_type: string;

  @Column('text', { name: 'display_type', nullable: true })
  display_type: string | null;

  @Column('text', { name: 'value_string', nullable: true })
  value_string: string | null;

  @Column('integer', { name: 'value_number', nullable: true })
  value_number: number | null;

  get value(): string | number | null {
    if (this.value_string !== null) {
      return this.value_string;
    } else if (this.value_number !== null) {
      return this.value_number;
    }

    return null;
  }

  set value(val: string | number | null) {
    if (typeof val === 'number') {
      this.value_number = val;
      this.value_string = null;
    } else if (typeof val === 'string') {
      this.value_string = val;
      this.value_number = null;
    }
  }

  @ManyToOne(() => Tokens, (token) => token.attributesV2)
  @JoinColumn([
    { name: 'token_id', referencedColumnName: 'token_id' },
    { name: 'collection_id', referencedColumnName: 'collection_id' },
  ])
  token: Tokens;

  @ManyToOne(() => Collections, (collection) => collection.attributesV2)
  @JoinColumn([
    { name: 'collection_id', referencedColumnName: 'collection_id' },
  ])
  collection: Collections;

  static fromIV2Attribute(
    attr: IV2Attribute,
    ids: { collectionId: number; tokenId: number }
  ): Attribute {
    const a = new Attribute();
    a.collection_id = ids.collectionId;
    a.token_id = ids.tokenId;
    a.trait_type = attr.trait_type;
    a.display_type = attr.display_type;
    a.value = attr.value;

    return a;
  }
}
