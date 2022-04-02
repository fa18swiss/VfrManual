yarn install
gulp clean
gulp build

$app = "vfrmanualapi"
$version = Get-content .\app\sw.js | select-string "version = ""([0-9\.]+)"""  | % { $_.Matches } | % { $_.Groups[1].Value }

$id = "${app}:${version}"

Write-Host "Building $id"

docker rmi $id
docker build -t $id  .
Write-Host "Saving..."
docker image save -o "${app}_${version}.tar" $id
Write-Host "Saved..."

#docker run -d --name=vfrmanualapi -p 127.0.0.1:8003:80 --restart=always -v $pwd\data:/app/data -v $pwd\logs:/logs/ vfrmanualapi:1.0.7
