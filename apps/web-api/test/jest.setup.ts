import { random } from 'lodash';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({});

const { env } = process;
env.POSTGRES_DATABASE =
  env.POSTGRES_DATABASE + '_test' + Date.now() + random(1, 10000);
env.LOGGING = '0';
env.GRAPHQL_URL = '/v1/graphql';
