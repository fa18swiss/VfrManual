yarn install
gulp clean
gulp build

$app = "vfrmanualapi"
$version = (Get-Content -Raw -Path  .\package.json | ConvertFrom-Json).Version
Write-Host "Version : $version"

$id = "${app}:${version}"
$tar = "${app}_${version}.tar"
$gz = "${tar}.gz"

Write-Host "Building $id"

docker rmi $id
docker build --no-cache -t $id .
docker tag $id $app

Write-Host "Saving..."
Remove-Item $tar -ErrorAction Ignore
docker image save -o $tar $id
Write-Host "Saved..."
Write-Host "Compressing..."
Remove-Item $gz -ErrorAction Ignore
& "${Env:ProgramFiles}\7-zip\7z.exe" a -tgzip $gz $tar
Remove-Item $tar -ErrorAction Ignore
Write-Host "Compressed..."
