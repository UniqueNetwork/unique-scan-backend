// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({});

const { env } = process;
env.POSTGRES_DATABASE = env.POSTGRES_DATABASE + '_test';
env.LOGGING = '0';
env.GRAPHQL_URL = '/v1/graphql';
