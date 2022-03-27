#!/bin/bash

app=vfrmanualapi
ver=1.0.5

docker stop $app
docker rm $app
docker run \
	-d \
	--name=$app \
	-p 127.0.0.1:8003:80 \
	--restart=always \
	-v $(pwd)/data:/app/data \
	-v $(pwd)/logs:/logs/ \
	$app:$ver
