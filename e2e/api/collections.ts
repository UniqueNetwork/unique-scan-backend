import { collectionsQuery } from '../queries';
import axios from 'axios';
import 'dotenv/config';
import { handleResponse } from './responseHandlers';

const scanApi = axios.create({
  baseURL: process.env.TESTS_GRAPHQL_URL,
  headers: { 'Content-Type': 'application/json' },
});

const getAll = async () => {
  const response = await scanApi.post('/', { query: collectionsQuery() });
  return handleResponse(response);
};

const getById = async (collectionId: number | string) => {
  const graphql_query = collectionsQuery({
    where: {
      collection_id: {
        _eq: collectionId,
      },
    },
  });

  const response = await scanApi.post('/', { query: graphql_query });
  return handleResponse(response).data.collections.data[0];
};

export const collectionApi = { getAll, getById };
