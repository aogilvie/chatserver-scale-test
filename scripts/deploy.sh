#! /bin/bash

. ./scripts/common.sh

# Execute commands on machine manager1

# Create network if not existing
networkId=$(docker-machine ssh manager1 "docker network ls --quiet --filter NAME=swarm_bridge")
if [ "$networkId" == "" ]; then
  docker-machine ssh manager1 "docker network create -d overlay swarm_bridge"
fi

# Start an nginx server to forward the callback to one of the machines in the swarm
docker-machine ssh manager1 "docker pull ${dockerRegistry}/chatserver"
docker-machine ssh manager1 "docker pull ${dockerRegistry}/docker-flow-swarm-listener"
docker-machine ssh manager1 "docker pull ${dockerRegistry}/docker-flow-proxy"

docker-machine ssh manager1 "docker service rm chatserver" &> /dev/null
docker-machine ssh manager1 "docker service rm proxy" &> /dev/null
docker-machine ssh manager1 "docker service rm swarm-listener" &> /dev/null

sleep 2

docker-machine ssh manager1 "docker service create --name swarm-listener \
  --network swarm_bridge \
  --mount 'type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock' \
  -e DF_NOTIF_CREATE_SERVICE_URL=http://proxy:8080/v1/docker-flow-proxy/reconfigure \
  -e DF_NOTIF_REMOVE_SERVICE_URL=http://proxy:8080/v1/docker-flow-proxy/remove \
  --constraint 'node.role==manager' \
  ${dockerRegistry}/docker-flow-swarm-listener"

# we can remotely configure the proxy on 8080
docker-machine ssh manager1 "docker service create --name proxy \
  -p 80:80 \
  -p 8080:8080 \
  --network swarm_bridge \
  -e MODE=swarm \
  -e LISTENER_ADDRESS=swarm-listener \
  ${dockerRegistry}/docker-flow-proxy"

# wait for proxy and listener to be ready to receive new services
sleep 2

docker-machine ssh manager1 "docker service create --name chatserver \
  --network swarm_bridge \
  --replicas=${CONF_replicas} \
  ${dockerRegistry}/chatserver"

sleep 5

# Reconfigure haproxy to point to our app
curl "$(docker-machine ip manager1):8080/v1/docker-flow-proxy/reconfigure?serviceName=chatserver&servicePath=/&port=18081&distribute=true&notify=true" &> /dev/null

echo -e "\n\nApplication now running on $(docker-machine ip manager1) web port 80."
echo -e "You must now configure your Google App callback address"
echo -e "$(docker-machine ip manager1)/auth/callback at"
echo -e "https://console.developers.google.com/ (credentials > edit > Authorised redirect URIs)\n"
