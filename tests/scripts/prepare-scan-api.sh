#!/bin/bash

ENV_FILE=${1}
export $(grep -v '^#' $ENV_FILE | xargs)

git clone $TESTS_CRAWLER_API_REPOSITORY ../application/crawler -b $TESTS_CRAWLER_BRANCH --depth 1
docker-compose -f ../application/crawler/docker/polkastats-backend/docker-compose.yml build
docker network create "market" || ECHO "network market already exists"
