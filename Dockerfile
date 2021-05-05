FROM trufflesuite/ganache-cli

WORKDIR /usr/src/app

RUN npm i && npm update
