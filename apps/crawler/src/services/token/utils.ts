import { IV2Attribute } from '@entities/Attribute';
import {
  AttributeType,
  DecodedAttributes,
} from '@unique-nft/substrate-client/tokens';

export const encodeV2AttributesAsV1 = (
  attributes: IV2Attribute[]
): DecodedAttributes => {
  const groups = attributes.reduce((acc, attribute) => {
    if (!acc[attribute.trait_type]) {
      acc[attribute.trait_type] = [];
    }
    acc[attribute.trait_type].push(attribute.value);
    return acc;
  }, {} as Record<string, Array<string | number>>);

  const result: DecodedAttributes = {};
  let index = 0;

  for (const [trait_type, values] of Object.entries(groups)) {
    const isArray = values.length > 1;

    const processedValues = values.map((value) => ({ _: value as string }));

    result[index++] = {
      name: { _: trait_type },
      type: (typeof values[0] === 'number'
        ? 'number'
        : 'string') as AttributeType,
      value: isArray ? processedValues : processedValues[0],
      isEnum: false,
      isArray,
      rawValue: isArray ? processedValues : processedValues[0],
    };
  }

  return result;
};
