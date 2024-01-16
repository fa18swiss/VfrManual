yarn install
gulp clean
gulp build

$app = "vfrmanualapi"
$version = Get-content .\package.json `
    | Select-String """version"": ""([0-9\.]+)""" `
    | ForEach-Object { $_.Matches } `
    | ForEach-Object { $_.Groups[1].Value }

Write-Host "Version : $version"

$root = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($MyInvocation.MyCommand.Path, ".."))

$start = [System.IO.Path]::Combine($root, "start.sh")
$txt = [System.IO.File]::ReadAllText($start).Replace("`r`n", "`n")
$txt = [System.Text.RegularExpressions.Regex]::Replace($txt, "ver=([0-9\.]+)", "ver=$version")
[System.IO.File]::WriteAllText($start, $txt)

$sw = [System.IO.Path]::Combine($root, "app", "sw.js")
$txt = [System.IO.File]::ReadAllText($sw)
$txt = [System.Text.RegularExpressions.Regex]::Replace($txt, "version = ""([0-9\.]+)""", "version = ""$version""")
[System.IO.File]::WriteAllText($sw, $txt)

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

#docker run -d --name=vfrmanualapi -p 127.0.0.1:8003:80 --restart=always -v $pwd\data:/app/data -v $pwd\logs:/logs/ vfrmanualapi
