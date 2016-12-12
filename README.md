# Chatserver Scale Test

### Requirements

Building:

Running `make install` will install the folling on your system:

- docker 1.12.3
- docker-machine 0.9.0-rc2
- nodejs 6.9.2
- npm 3.10.9
- virtualbox 5.1
- update your linux kernel

Running:

- It is recommended when using swarm to use virtualbox, if you wish to use a different docker-nachine driver modify the `conf/config-dev.yaml` driver setting. (not tested!)

Configuration:

- Set your current host ip in `conf/config-dev.yaml`, this will be used to run a local docker registry to store images (port should remain 7777). eg. in AWS something like `ip-172-31-28-202` and `ip-172-31-28-202:7777`
- Create a google application https://console.developers.google.com/, add credentials (OAuth client ID). Copy and paste credentials to `conf/config-dev.yaml`. We will use this to authenticate users to the application with their Google account.
- Add your callback URL to the google application (still on developer console), for example `http://ec2-35-163-250-250.us-west-2.compute.amazonaws.com/auth/callback`

### Build & Deploy

For extremely fast development testing run `node .`

To install deps (docker, virtualbox, docker-machine)

`make install`

To build the application run:

`make build`

To run locally for testing run the docker image with:

`make run-local`

To create a swarm of virtual machines run:

`make machines`

To deploy the application on the cluster

`make deploy`

All configutation is stored in `conf/config-dev.yaml`
