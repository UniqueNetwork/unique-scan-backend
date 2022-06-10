#!/bin/bash

ENV_FILE=${1}
export $(grep -v '^#' $ENV_FILE | xargs)

docker-compose -f ../../docker-compose.yml up -d --build
