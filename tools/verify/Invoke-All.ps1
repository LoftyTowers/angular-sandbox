$ErrorActionPreference = 'Stop'

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string[]]$Command
    )

    Write-Host "==> $Name"
    $executable = $Command[0]
    $arguments = @()
    if ($Command.Length -gt 1) {
        $arguments = $Command[1..($Command.Length - 1)]
    }

    & $executable @arguments
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

Invoke-Step -Name 'Lint' -Command @('docker', 'compose', 'run', '--rm', 'app', 'npm', 'run', 'lint')
Invoke-Step -Name 'Unit tests (headless)' -Command @('docker', 'compose', 'run', '--rm', 'app', 'npm', 'test')
Invoke-Step -Name 'Build' -Command @('docker', 'compose', 'run', '--rm', 'app', 'npm', 'run', 'build')
