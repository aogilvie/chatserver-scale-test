#! /bin/bash

. ./scripts/common.sh

managers=${CONF_nodes_managers}
workers=${CONF_nodes_workers}

# start manager machines
echo "======> Starting $managers manager machines ...";
for node in $(seq 1 $managers);
do
	echo "======> Starting manager$node machine ...";
	docker-machine start manager$node;
done

# start worker machines
echo "======> Starting $workers worker machines ...";
for node in $(seq 1 $workers);
do
	echo "======> Starting worker$node machine ...";
	docker-machine start worker$node;
done
