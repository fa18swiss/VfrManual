#!/bin/bash

app=vfrmanualapi
ver=$(curl --silent  https://api.github.com/repos/fa18swiss/VfrManual/releases/latest | awk -F'"' '/tag_name/{gsub(/^./,"",$4); print $4}')
img="${app}:${ver}"
tar="${app}_${ver}.tar"
gz="${tar}.gz"

echo "Image : ${img}"

if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${img}$"; then
	echo "Docker image ${img} found locally"
else
	echo "Docker image ${img} not found locally, downloading"
	wget "https://github.com/fa18swiss/VfrManual/releases/download/v${ver}/vfrmanualapi_${ver}.tar.gz"
	echo "Download done, unzip ${gz}"
	gzip -d $gz
	echo "Unzip done, loading"
	docker load -i $tar
	rm "${tar}"
	echo "Loaded ${tar}"
fi


docker stop $app
echo "Stopped ${app}"
docker rm $app
echo "Deleted ${app}"
docker run \
	-d \
	--name=$app \
	-p 127.0.0.1:8003:80 \
	--restart=always \
	-v $(pwd)/data:/app/data \
	-v $(pwd)/logs:/logs/ \
	$img
echo "Started ${img}"
