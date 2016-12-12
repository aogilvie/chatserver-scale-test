#! /bin/bash

. ./scripts/common.sh

managers=${CONF_nodes_managers}
workers=${CONF_nodes_workers}

# create manager machines
echo "======> Creating $managers manager machines ...";
for node in $(seq 1 $managers);
do
	echo "======> Creating manager$node machine ...";
	docker-machine create -d ${CONF_dockerDriver} --engine-insecure-registry=${dockerRegistry} manager$node;
done

# create worker machines
echo "======> Creating $workers worker machines ...";
for node in $(seq 1 $workers);
do
	echo "======> Creating worker$node machine ...";
	docker-machine create -d ${CONF_dockerDriver} --engine-insecure-registry=${dockerRegistry} worker$node;
done

# list all machines
docker-machine ls

# initialize swarm mode and create a manager
echo "======> Initializing first swarm manager ..."
docker-machine ssh manager1 "docker swarm init --listen-addr $(docker-machine ip manager1) --advertise-addr $(docker-machine ip manager1)"

# get manager and worker tokens
export managerToken=`docker-machine ssh manager1 "docker swarm join-token manager -q"`
export workerToken=`docker-machine ssh manager1 "docker swarm join-token worker -q"`

echo "manager token: $managerToken"
echo "worker token: $workerToken"

# other masters join swarm
for node in $(seq 2 $managers);
do
	echo "======> manager$node joining swarm as manager ..."
	docker-machine ssh manager$node \
		"docker swarm join \
		--token $managerToken \
		--listen-addr $(docker-machine ip manager$node) \
		--advertise-addr $(docker-machine ip manager$node) \
		$(docker-machine ip manager1)"
done

# show members of swarm
docker-machine ssh manager1 "docker node ls"

# workers join swarm
for node in $(seq 1 $workers);
do
	echo "======> worker$node joining swarm as worker ..."
	docker-machine ssh worker$node \
	"docker swarm join \
	--token $workerToken \
	--listen-addr $(docker-machine ip worker$node) \
	--advertise-addr $(docker-machine ip worker$node) \
	$(docker-machine ip manager1):2377"
done

# show members of swarm
docker-machine ssh manager1 "docker node ls"
