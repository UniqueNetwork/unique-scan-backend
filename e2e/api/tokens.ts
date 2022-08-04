import { tokensQuery } from '../queries';
import axios from 'axios';
import 'dotenv/config';
import { handleResponse } from './responseHandlers';

const scanApi = axios.create({
  baseURL: process.env.TESTS_GRAPHQL_URL,
  headers: { 'Content-Type': 'application/json' },
});

const getById = async (
  tokenId: number | string,
  collectionId: number | string,
) => {
  const graphql_query = tokensQuery({
    where: {
      token_id: { _eq: tokenId },
      collection_id: { _eq: collectionId },
    },
  });

  const response = await scanApi.post('/', { query: graphql_query });
  return handleResponse(response).data.tokens.data[0];
};

export const tokensApi = { getById };
