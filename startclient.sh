#!/bin/sh
if [ -d /usr/share/nginx/html/libs ] ; then
  rm -rf /usr/share/nginx/html/libs
fi
cp -a /built/libs /usr/share/nginx/html/
cp /build/sw/service-worker.js /usr/share/nginx/html/
nginx -g "daemon off;"