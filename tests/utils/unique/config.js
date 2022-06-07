/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const config = {
  // eslint-disable-next-line no-undef
  wsEndpoint: process.env.TEST_UNIQUE_WS_ENDPOINT,
  silentLogger: true,
};

module.exports = config;
