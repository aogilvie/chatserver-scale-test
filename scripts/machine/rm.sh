#! /bin/bash

. ./scripts/common.sh

managers=${CONF_nodes_managers}
workers=${CONF_nodes_workers}

# delete manager machines
echo "======> Deleting $managers manager machines ...";
for node in $(seq 1 $managers);
do
	echo "======> Deleting manager$node machine ...";
	docker-machine rm -y manager$node;
done

# delete worker machines
echo "======> Deleting $workers worker machines ...";
for node in $(seq 1 $workers);
do
	echo "======> Deleting worker$node machine ...";
	docker-machine rm -y worker$node;
done
