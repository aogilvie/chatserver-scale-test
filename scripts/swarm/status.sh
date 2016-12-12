#! /bin/bash

. ./scripts/common.sh

# build new image
docker-machine ssh manager1 "docker service ls"
