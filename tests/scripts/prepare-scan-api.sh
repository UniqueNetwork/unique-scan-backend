#!/bin/bash

ENV_FILE=${1}
export $(grep -v '^#' $ENV_FILE | xargs)

(
    git clone $SCAN_API_REPOSITORY $SCAN_API_DIRECTORY -b $CRAWLER_BRANCH
    docker-compose -f ${SCAN_API_DIRECTORY}/docker/polkastats-backend/docker-compose.yml build
    git -C $SCAN_API_DIRECTORY checkout $NESTJS_BRANCH
    docker network create "market"
)
