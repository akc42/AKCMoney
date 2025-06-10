#!/bin/bash
rsync compose.yaml kanga:/volume1/docker/money/compose.yaml
rsync -aq --delete appinfo/ kanga:/volume1/docker/money/appinfo/
rsync -aq --delete client/ kanga:/volume1/money/client/
rsync -aq --delete server/ kanga:/volume1/money/server/

#tell server to restart
ssh kanga "cd /volume1/docker/money; /usr/local/bin/docker container restart moneyserver"
