#!/bin/bash

node scripts/swupdate.js


rsync compose.yaml kanga:/volume1/docker/money/compose.yaml
rsync -aq --delete appinfo/ kanga:/volume1/docker/money/appinfo/
rsync -aq --delete client/ kanga:/volume1/money/client/
rsync -aq --delete server/ kanga:/volume1/money/server/
rsync -aq --delete timer/ kanga:/volume1/money/timer/
rsync -aq --delete common.env kanga:/volume1/docker/money/common.env
#tell server to restart
ssh kanga "cd /volume1/docker/money; /usr/local/bin/docker container restart moneyserver"

#make a git tag if it doesn't already exist
if GIT_DIR=.git git rev-parse $(cat appinfo/version) >/dev/null 2>&1 ; then echo "tag already in use";
else 
 git tag $(cat appinfo/version)
fi

