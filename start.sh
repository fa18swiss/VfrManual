#!/bin/bash


gulpVer=1.1

docker build -t gulp:$gulpVer gulp

docker run \
	-it \
	--rm \
	-u $(id -u):$(id -g) \
	-v $(pwd):/app \
	-w /app \
	gulp:$gulpVer \
	/bin/sh -c "yarn install ; gulp"

rm -rf node_modules

app=vfrmanualapi
ver=1.0.5

docker build -t $app:$ver .
docker stop $app
docker rm $app
docker run \
	-d \
	--name=$app \
	-p 127.0.0.1:8003:80 \
	--restart=always \
	-v $(pwd):/app \
	$app:$ver
