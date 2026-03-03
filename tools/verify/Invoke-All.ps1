$ErrorActionPreference = 'Stop'

function Invoke-Step {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    Write-Host "==> $Name"
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

Invoke-Step -Name 'Lint' -Command 'docker compose run --rm app npm run lint'
Invoke-Step -Name 'Unit Tests' -Command 'docker compose run --rm app npm test'
Invoke-Step -Name 'Build' -Command 'docker compose run --rm app npm run build'
