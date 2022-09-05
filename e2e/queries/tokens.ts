import { jsonToGraphQLQuery } from 'json-to-graphql-query';

export const tokensQuery = (args = {}) => {
  const token = {
    query: {
      __name: 'getTokens',
      tokens: {
        __args: args,
        data: {
          collection_cover: true,
          collection_description: true,
          collection_id: true,
          collection_name: true,
          date_of_creation: true,
          owner: true,
          owner_normalized: true,
          token_id: true,
          token_prefix: true,
          attributes: true,
          image: true,
        },
      },
    },
  };
  return jsonToGraphQLQuery(token);
};
