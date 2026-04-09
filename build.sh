#!/bin/bash
node scripts/buildlibs.js

docker build --push --target client -t docker.chandlerfamily.org.uk/moneyclient .
docker build --push --target server -t docker.chandlerfamily.org.uk/moneyserver .
docker build --push --target timer -t docker.chandlerfamily.org.uk/moneytimer .