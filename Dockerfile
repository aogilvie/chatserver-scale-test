FROM node

MAINTAINER Ally Ogilvie

EXPOSE 18081

COPY conf /home/node/conf
COPY lib /home/node/lib
COPY node_modules /home/node/node_modules
COPY www /home/node/www
COPY index.js /home/node/index.js

CMD [ "node", "/home/node/index.js" ]
