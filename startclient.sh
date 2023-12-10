#!/bin/sh
cp /build/sw/service-worker.js /usr/share/nginx/html/
nginx -g "daemon off;"