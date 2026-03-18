# syntax=docker/dockerfile:1.0-experimental
#
#   Copyright (c) 2025 Alan Chandler, all rights reserved
#
#   This file is part of AKCMoney.
#
#   AKCMoney is free software: you can redistribute it and/or modify
#   it under the terms of the GNU General Public License as published by
#   the Free Software Foundation, either version 3 of the License, or
#   (at your option) any later version.
#
#   AKCMoney is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU General Public License for more details.
#
#   You should have received a copy of the GNU General Public License
#   along with AKCMoney.  If not, see <http://www.gnu.org/licenses/>.
#

FROM nginx:mainline-alpine-slim AS Client
LABEL uk.org.chandlerfamily.maintainer="Alan Chandler <alan@chandlerfamily.org.uk>"
RUN --mount=type=cache,target=/var/cache/apk apk add tzdata
ENV TZ=Europe/London
COPY nginx/default.conf /etc/nginx/conf.d/

FROM node:lts-alpine AS build
WORKDIR /build
COPY package.json ./
RUN --mount=type=cache,target=/var/cache/apk apk add tzdata vim
RUN --mount=type=cache,target=~.npm npm install --omit=dev

FROM node:lts-alpine AS ServerBase
LABEL uk.org.chandlerfamily.maintainer="Alan Chandler <alan@chandlerfamily.org.uk>"
RUN --mount=type=cache,target=/var/cache/apk apk add tzdata
ENV TZ Europe/London
RUN mkdir /db
WORKDIR /app
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/package.json .
RUN mkdir -p appinfo
## Allows for coloured output (https://stackoverflow.com/questions/33493456/docker-bash-prompt-does-not-display-color-output)
ENV TERM xterm-256color

FROM ServerBase AS Server
WORKDIR /app
RUN mkdir -p server
EXPOSE 2010
CMD ["node", "server/server.js"]

FROM ServerBase AS Timer
RUN mkdir -p /db-backup
WORKDIR /etc/crontabs
COPY crontab-root ./root
WORKDIR /app
RUN mkdir -p timer

USER 0:0
CMD ["/usr/sbin/crond", "-f"]

