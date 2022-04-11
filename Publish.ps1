yarn install
gulp clean
gulp build

$app = "vfrmanualapi"
$version = Get-content .\app\sw.js | select-string "version = ""([0-9\.]+)"""  | % { $_.Matches } | % { $_.Groups[1].Value }

$id = "${app}:${version}"
$tar = "${app}_${version}.tar"
$gz = "${tar}.gz"

Write-Host "Building $id"

docker rmi $id
docker build -t $id  .
Write-Host "Saving..."
Remove-Item $tar -ErrorAction Ignore
docker image save -o $tar $id
Write-Host "Saved..."
Write-Host "Compressing..."
Remove-Item $gz -ErrorAction Ignore
& "${Env:ProgramFiles}\7-zip\7z.exe" a -tgzip $gz $tar
Remove-Item $tar -ErrorAction Ignore
Write-Host "Compressed..."

#docker run -d --name=vfrmanualapi -p 127.0.0.1:8003:80 --restart=always -v $pwd\data:/app/data -v $pwd\logs:/logs/ vfrmanualapi:1.0.9
