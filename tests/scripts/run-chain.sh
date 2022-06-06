#!/bin/bash

ENV_FILE=${1}
export $(grep -v '^#' $ENV_FILE | xargs)

git clone -b $CHAIN_VERSION git@gitlab.uniquenetwork.dev:qa-team/run-quartz.git ./application/chain
docker-compose -f application/chain/docker-compose.yml up -d --build