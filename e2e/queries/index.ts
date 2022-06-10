import { jsonToGraphQLQuery } from 'json-to-graphql-query';

export const collectionsQuery = (args = {}) => {
  const collection = {
    query: {
      collections: {
        data: {
          __args: args,
          collection_id: true,
          const_chain_schema: true,
          date_of_creation: true,
          description: true,
          // limits_accout_ownership: true,
          limits_sponsore_data_rate: true,
          limits_sponsore_data_size: true,
          mint_mode: true,
          // mode: true,
          name: true,
          offchain_schema: true,
          owner: true,
          owner_can_destroy: true,
          // owner_can_trasfer: true,
          schema_version: true,
          token_limit: true,
          // sponsorship_confirmed: true,
          token_prefix: true,
          // variable_on_chain_schema: true,
        },
      },
    },
  };
  return jsonToGraphQLQuery(collection);
};
