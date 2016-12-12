#! /bin/bash

. ./scripts/common.sh

managers=${CONF_nodes_managers}
workers=${CONF_nodes_workers}

# stop manager machines
echo "======> Stopping $managers manager machines ...";
for node in $(seq 1 $managers);
do
	echo "======> Stopping manager$node machine ...";
	docker-machine stop manager$node;
done

# stop worker machines
echo "======> Stopping $workers worker machines ...";
for node in $(seq 1 $workers);
do
	echo "======> Stopping worker$node machine ...";
	docker-machine stop worker$node;
done
