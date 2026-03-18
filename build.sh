#!/bin/bash
node scripts/buildlibs.js

docker build --push --target Client -t docker.chandlerfamily.org.uk/moneyclient .
docker build --push --target Server -t docker.chandlerfamily.org.uk/moneyserver .
docker build --push --target Timer -t docker.chandlerfamily.org.uk/moneytimer .