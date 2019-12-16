#!/bin/bash

app=vfrmanualapi
ver=1.1

docker build -t $app:$ver .
docker stop $app
docker rm $app
docker run -d -p 127.0.0.1:8003:80 --name=$app --restart=always -v `pwd`:/app $app:$ver
