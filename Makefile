##
# Makefile
#
##

# Set default shell
SHELL = /bin/bash

# Function for help
define helpText

make install                            Install dependencies
make build                              Build Docker image

make deploy                             Run docker image across swarm
make run-local                          Run docker image on local host

make machines                           Creates and starts machines from config
make machines-start                     Start machines
make machines-stop                      Stop machines
make machines-destroy                   Destroy machines

make test-lint                          Lint codebase

endef
export helpText

.PHONY: install build run-local deploy machines machines-destroy machines-start machines-stop machines-destroy test-lint

# Default make target
%::
	@echo "$$helpText"
default:
	@echo "$$helpText"

install:
	./scripts/install.sh

build:
	npm install
	./scripts/build.sh

run-local: build
	./scripts/run.sh

deploy:
	./scripts/deploy.sh

swarm-status:
	./scripts/swarm/status.sh

machines:
	./scripts/machine/launch.sh

machines-start:
	./scripts/machine/start.sh

machines-stop:
	./scripts/machine/stop.sh

machines-destroy:
	./scripts/machine/rm.sh

test-lint:
	@cd ./scripts/linter && npm install
	node scripts/linter/index.js ./config.js
