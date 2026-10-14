[CmdletBinding()]
param(
  [Parameter(Mandatory=$true, Position=0)][string]$Pdf,
  [ValidateRange(100,10000)][int]$Size=900,
  [ValidateRange(0,9999)][int]$Overlap=100,
  [ValidateSet('section','fixed','paragraph','structure')][string]$Strategy='section',
  [string]$Out
)
$ErrorActionPreference='Stop'
if (-not $PSBoundParameters.ContainsKey('Overlap') -and $Strategy -in @('paragraph','structure')) { $Overlap=0 }
if ($Overlap -ge $Size) { throw 'Overlap must be smaller than Size.' }
$source=(Resolve-Path -LiteralPath $Pdf).ProviderPath
if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "PDF file not found: $Pdf" }
$repo=Split-Path -Parent $PSScriptRoot
$compose=Join-Path $PSScriptRoot 'compose.yaml'
# Resolve explicit paths against the caller's location before Push-Location.
if ($PSBoundParameters.ContainsKey('Out')) {
  if ([string]::IsNullOrWhiteSpace($Out)) { throw 'Out must be a filename.' }
  $outputPath=$ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Out)
} else { $outputPath=Join-Path $PSScriptRoot 'output/chunks.json' }
if (Test-Path -LiteralPath $outputPath -PathType Container) { throw "Output path is a directory: $outputPath" }
$outputFolder=Split-Path -Parent $outputPath
$outputName=[IO.Path]::GetFileName($outputPath)
New-Item -ItemType Directory -Force -Path $outputFolder | Out-Null
$mount="${source}:/input/document.pdf:ro"
Push-Location -LiteralPath $repo
try {
  & docker compose -f $compose run --rm --no-deps --volume $mount --volume "${outputFolder}:/result" lab chunk `
    --pdf /input/document.pdf --source-name ([IO.Path]::GetFileName($source)) `
    --size $Size --overlap $Overlap --strategy $Strategy --out "/result/$outputName"
  if ($LASTEXITCODE -ne 0) { throw "Chunking failed (Docker exit code $LASTEXITCODE)." }
  Write-Host "Saved JSON: $outputPath"
} finally { Pop-Location }
