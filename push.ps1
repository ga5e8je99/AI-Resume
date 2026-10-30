param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

if ($Message) {
    node scripts/git-push.mjs "$Message"
} else {
    node scripts/git-push.mjs
}

