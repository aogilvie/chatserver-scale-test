#! /bin/bash

. ./scripts/common.sh

sudo docker stop chatserver && sudo docker rm chatserver &> /dev/null
sudo docker run -d --name chatserver --net host ${dockerRegistry}/chatserver
