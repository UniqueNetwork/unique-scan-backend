// @ts-nocheck
const fs = require('fs');
const typesBundleForPolkadot = require('@unique-nft/quartz-mainnet-types/definitions');
fs.writeFileSync('typesBundle.json', JSON.stringify(typesBundleForPolkadot, null, 2));
