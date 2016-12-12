#! /bin/bash

. ./scripts/common.sh

# build new image
sudo docker build -t ${dockerRegistry}/chatserver .

# stop if running, then create private registry
sudo docker stop registry && sudo docker rm registry &> /dev/null

sleep 2

sudo docker run -d -p 7777:5000 --restart=always --name registry registry:2 &> /dev/null

sleep 2

sudo mkdir -p /etc/systemd/system/docker.service.d/

# copy custom settings
sudo tee /etc/systemd/system/docker.service.d/custom-opts.conf <<EOF
[Service]
# First line clears
ExecStart=
# Set insecure registry
ExecStart=/usr/bin/dockerd --insecure-registry ${dockerRegistry}
EOF

# restart docker daemon with insecure registry
sudo systemctl daemon-reload

sleep 1

sudo service docker restart

sleep 3

# upload to private registry
sudo docker push ${dockerRegistry}/chatserver

# pull down latest haproxy based flow-swarm-proxy and push to our private registry
sudo docker pull vfarcic/docker-flow-swarm-listener
sudo docker pull vfarcic/docker-flow-proxy
sudo docker tag vfarcic/docker-flow-swarm-listener ${dockerRegistry}/docker-flow-swarm-listener
sudo docker tag vfarcic/docker-flow-proxy ${dockerRegistry}/docker-flow-proxy
sudo docker push ${dockerRegistry}/docker-flow-swarm-listener
sudo docker push ${dockerRegistry}/docker-flow-proxy
