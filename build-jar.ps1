$ErrorActionPreference = "Stop"
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
  Write-Error "PATH에서 java를 찾을 수 없습니다. JDK 17을 설치한 뒤 다시 시도하세요."
  exit 1
}
$bin = Split-Path $javaCmd.Source
$env:JAVA_HOME = Split-Path $bin
Set-Location $PSScriptRoot
& .\mvnw.cmd clean package -DskipTests @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host ""
Write-Host "JAR: $PSScriptRoot\target\honor-run-0.0.1-SNAPSHOT.jar"
