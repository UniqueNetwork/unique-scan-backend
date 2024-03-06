import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TokenWithInfoV2 } from '@unique-nft/substrate-client/tokens';

export type IV2Attribute = TokenWithInfoV2['attributes'][0];

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

  static fromIV2Attribute(
    attr: IV2Attribute,
    ids: { collectionId: number; tokenId: number }
  ): Attribute {
    const attribute = new Attribute();
    attribute.collection_id = ids.collectionId;
    attribute.token_id = ids.tokenId;
    attribute.trait_type = attr.trait_type;
    attribute.display_type = attr.display_type;
    attribute.value = attr.value;

    return attribute;
  }
}
