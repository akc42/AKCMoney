#!/bin/bash
node scripts/swupdate.js

rsync compose-prod.yaml kanga:/volume1/docker/money/compose.yaml
rsync -axAHX --delete appinfo/ kanga:/volume1/docker/money/appinfo/
rsync -axAHX --delete client/ kanga:/volume1/money/client/
rsync -axAHX --delete server/ kanga:/volume1/money/server/
