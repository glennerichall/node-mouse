$ErrorActionPreference = 'Stop'

$PackagePath = 'C:\Windows\Temp\remote-mouse.tgz'
$ConfigDirectory = Join-Path $env:APPDATA 'remote-mouse'
$Installer = 'C:\Windows\Temp\install-remote-mouse.ps1'

if (-not (Test-Path -LiteralPath $PackagePath)) {
  throw 'Missing current npm artifact. Run npm run vm:pack:windows before provisioning windows-11.'
}

& $Installer -Yes -PackageName $PackagePath -ConfigDir $ConfigDirectory -Port 3987 -NoHttps -InstallService

$Version = remote-mouse version
if ([string]::IsNullOrWhiteSpace($Version)) {
  throw 'The installed Remote Mouse CLI did not return a version.'
}
