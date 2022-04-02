#!/bin/bash

app=vfrmanualapi
ver=1.0.8
tar="${app}_${ver}.tar"
if test -f "$tar"; then
    echo "Loading $tar"
    docker load -i $tar
    echo "Loaded $tar"
fi


docker stop $app
echo "Stopped $app"
docker rm $app
echo "Deleted $app"
docker run \
	-d \
	--name=$app \
	-p 127.0.0.1:8003:80 \
	--restart=always \
	-v $(pwd)/data:/app/data \
	-v $(pwd)/logs:/logs/ \
	$app:$ver
echo "Started $app:$ver"
