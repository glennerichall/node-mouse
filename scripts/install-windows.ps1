[CmdletBinding()]
param(
  [Alias('y')]
  [switch]$Yes,

  [string]$PackageName = $env:REMOTE_MOUSE_NPM_PACKAGE,

  [string]$ConfigDir = $env:REMOTE_MOUSE_CONFIG_DIR,

  [int]$Port = $(if ($env:REMOTE_MOUSE_PORT) { [int]$env:REMOTE_MOUSE_PORT } else { 3000 })
)

$ErrorActionPreference = 'Stop'

function Get-DefaultPackageName {
  $fallback = '@velor/remote-mouse'
  if ([string]::IsNullOrWhiteSpace($PSCommandPath)) {
    return $fallback
  }

  $scriptDir = Split-Path -Parent $PSCommandPath
  $projectRoot = Split-Path -Parent $scriptDir
  $packageJsonPath = Join-Path $projectRoot 'package.json'

  if (Test-Path -LiteralPath $packageJsonPath) {
    try {
      $packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
      if ($packageJson.name) {
        return [string]$packageJson.name
      }
    } catch {
      return $fallback
    }
  }

  return $fallback
}

if ([string]::IsNullOrWhiteSpace($PackageName)) {
  $PackageName = Get-DefaultPackageName
}

if ([string]::IsNullOrWhiteSpace($ConfigDir)) {
  $ConfigDir = Join-Path $env:APPDATA 'remote-mouse'
}

function Write-Step {
  param([string]$Message)
  Write-Host ''
  Write-Host $Message
}

function Confirm-Step {
  param([string]$Prompt)

  if ($Yes) {
    Write-Host "$Prompt [Y/n] y"
    return $true
  }

  $answer = Read-Host "$Prompt [y/N]"
  return $answer -match '^(y|yes)$'
}

function Read-Value {
  param(
    [string]$Prompt,
    [string]$DefaultValue = ''
  )

  if ($Yes) {
    Write-Host "$Prompt [$DefaultValue] $DefaultValue"
    return $DefaultValue
  }

  if ($DefaultValue) {
    $value = Read-Host "$Prompt [$DefaultValue]"
    if ([string]::IsNullOrWhiteSpace($value)) {
      return $DefaultValue
    }
    return $value
  }

  return Read-Host $Prompt
}

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-WithWinget {
  param(
    [string]$PackageId,
    [string]$Label
  )

  if (-not (Test-Command 'winget')) {
    throw "Missing $Label and winget is not available. Install $Label manually, then rerun this script."
  }

  if (Confirm-Step "Install $Label with winget?") {
    winget install --id $PackageId --exact --accept-package-agreements --accept-source-agreements
  } else {
    throw "Cannot continue without $Label."
  }
}

function Ensure-Node {
  $missingNode = -not (Test-Command 'node')
  $missingNpm = -not (Test-Command 'npm')

  if (-not $missingNode -and -not $missingNpm) {
    Write-Step "Node: $(node --version)"
    Write-Step "npm: $(npm --version)"
    return
  }

  if ($missingNode) {
    Write-Warning 'node was not found in PATH.'
  }
  if ($missingNpm) {
    Write-Warning 'npm was not found in PATH.'
  }

  Install-WithWinget -PackageId 'OpenJS.NodeJS.LTS' -Label 'Node.js LTS'

  if (-not (Test-Command 'node') -or -not (Test-Command 'npm')) {
    throw 'Node.js was installed, but node/npm are still not available in this terminal. Open a new terminal and rerun this script.'
  }
}

function Ensure-BuildTools {
  if (Test-Command 'cl') {
    return
  }

  Write-Warning 'Microsoft C++ build tools were not found in PATH.'
  if (Test-Command 'winget') {
    if (Confirm-Step 'Install Microsoft Visual Studio Build Tools with winget?') {
      winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --accept-package-agreements --accept-source-agreements --override '--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended'
      return
    }
  }

  Write-Warning 'Native npm modules may require Microsoft C++ Build Tools. Install them manually if npm install fails.'
}

function Ensure-Python {
  if (Test-Command 'python') {
    return
  }

  if (Test-Command 'py') {
    return
  }

  Write-Warning 'Python was not found in PATH.'
  if (Test-Command 'winget') {
    if (Confirm-Step 'Install Python with winget?') {
      winget install --id Python.Python.3.12 --exact --accept-package-agreements --accept-source-agreements
      return
    }
  }

  Write-Warning 'Native npm modules may require Python. Install it manually if npm install fails.'
}

function Ensure-PowerShell {
  if ($PSVersionTable.PSVersion.Major -lt 5) {
    throw 'PowerShell 5 or newer is required.'
  }
}

function Install-NpmPackage {
  Write-Step "Installing npm package: $PackageName"
  npm install -g $PackageName

  if (-not (Test-Command 'remote-mouse')) {
    throw 'remote-mouse CLI was not found in PATH after npm installation. Open a new terminal or check npm global bin path with: npm prefix -g'
  }
}

function New-CookieSecret {
  $bytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
    return -join ($bytes | ForEach-Object { $_.ToString('x2') })
  } finally {
    $rng.Dispose()
  }
}

function Configure-Https {
  $config = @{
    Https = 'false'
    KeyPath = ''
    CertPath = ''
  }

  if (-not (Confirm-Step 'Serve Remote Mouse over HTTPS?')) {
    return $config
  }

  $config.Https = 'true'
  $certDir = Join-Path $ConfigDir 'certs'

  if (Confirm-Step 'Generate a local self-signed certificate?') {
    New-Item -ItemType Directory -Force -Path $certDir | Out-Null
    $cert = New-SelfSignedCertificate `
      -DnsName @('localhost', 'remote-mouse.local') `
      -CertStoreLocation 'Cert:\CurrentUser\My' `
      -KeyAlgorithm RSA `
      -KeyLength 2048 `
      -KeyExportPolicy Exportable `
      -NotAfter (Get-Date).AddYears(1)

    $pfxPath = Join-Path $certDir 'remote-mouse.pfx'
    $password = ConvertTo-SecureString -String (New-CookieSecret) -AsPlainText -Force
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null

    if (-not (Test-Command 'openssl')) {
      Install-WithWinget -PackageId 'ShiningLight.OpenSSL' -Label 'OpenSSL'
    }

    $keyPath = Join-Path $certDir 'remote-mouse.key'
    $certPath = Join-Path $certDir 'remote-mouse.crt'
    $plainPassword = (New-Object System.Net.NetworkCredential('', $password)).Password
    openssl pkcs12 -in $pfxPath -nocerts -nodes -out $keyPath -passin "pass:$plainPassword"
    openssl pkcs12 -in $pfxPath -clcerts -nokeys -out $certPath -passin "pass:$plainPassword"

    $config.KeyPath = $keyPath
    $config.CertPath = $certPath
    return $config
  }

  $keyPathInput = Read-Value 'Path to the existing PEM private key'
  $certPathInput = Read-Value 'Path to the existing PEM certificate'

  if (-not (Test-Path -LiteralPath $keyPathInput)) {
    throw "Private key not found: $keyPathInput"
  }
  if (-not (Test-Path -LiteralPath $certPathInput)) {
    throw "Certificate not found: $certPathInput"
  }

  $config.KeyPath = $keyPathInput
  $config.CertPath = $certPathInput
  return $config
}

function Write-EnvFile {
  param([hashtable]$HttpsConfig)

  New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
  $envFile = Join-Path $ConfigDir '.env'

  if (Test-Path -LiteralPath $envFile) {
    if (-not (Confirm-Step "Overwrite existing $envFile?")) {
      Write-Step "Keeping existing $envFile."
      return
    }
  }

  $cookieSecret = New-CookieSecret
  $dbPath = Join-Path $ConfigDir 'remote-mouse.sqlite3'
  $content = @"
PORT=$Port
SERVER_HOST=
CONFIG_DIR=$ConfigDir
PERSISTENCE_DB_PATH=$dbPath
ENV_FILE_PATH=$envFile

HTTPS=$($HttpsConfig.Https)
SSL_KEY_PATH=$($HttpsConfig.KeyPath)
SSL_CERT_PATH=$($HttpsConfig.CertPath)

ENTRY_PATH_ENABLED=true
ENTRY_PATH_FIXED=
ENTRY_PATH_TOKEN_LENGTH=24
ENTRY_PATH_ROTATE_INTERVAL_MIN=60
ENTRY_PATH_GRACE_MIN=120

SESSION_COOKIE_NAME=remote_mouse_session
SESSION_COOKIE_SECRET=$cookieSecret
SESSION_COOKIE_MAX_AGE_DAYS=7
SOCKET_EVENT_MAX_AGE_MS=1200

LOG_LEVEL=info
LOG_FORMAT=json
ADMIN_ACTIONS_ENABLED=true
SERVICE_NAME=remote-mouse
SERVICE_RESTART_COMMAND=
"@

  Set-Content -LiteralPath $envFile -Value $content -Encoding UTF8
  Write-Step "Wrote $envFile"
}

function Install-Service {
  if (-not (Confirm-Step 'Install the user service?')) {
    return $false
  }

  remote-mouse service install
  remote-mouse service restart
  return $true
}

function Main {
  Write-Step 'Remote Mouse Windows installer'
  Write-Step "Package: $PackageName"
  Write-Step "Config directory: $ConfigDir"

  Ensure-PowerShell
  Ensure-Node
  Ensure-BuildTools
  Ensure-Python
  Install-NpmPackage
  $httpsConfig = Configure-Https
  Write-EnvFile -HttpsConfig $httpsConfig
  $serviceInstalled = Install-Service

  Write-Step 'Installation complete.'
  if ($serviceInstalled) {
    Write-Host 'Service installed. Use Task Scheduler or remote-mouse service restart to manage it.'
  } else {
    Write-Host 'Start Remote Mouse with: remote-mouse'
  }

  if ($httpsConfig.Https -eq 'true') {
    Write-Host 'Browsers will warn about the self-signed certificate until it is trusted locally.'
    Write-Host 'Use the browser advanced/details option to continue to the site.'
  }
}

Main
