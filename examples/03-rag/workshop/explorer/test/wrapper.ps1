# Run with pwsh -NoProfile -File workshop/explorer/test/wrapper.ps1.
# Docker is mocked; this verifies PowerShell argument handling, not Windows Docker Desktop.
$ErrorActionPreference='Stop'
$temp=Join-Path ([IO.Path]::GetTempPath()) ('rag-powershell-'+[guid]::NewGuid())
$fixture=Join-Path $temp 'workshop'
New-Item -ItemType Directory -Path $fixture | Out-Null
$wrapper=Join-Path $fixture 'chunk-pdf.ps1'
Copy-Item -LiteralPath (Join-Path $PSScriptRoot '../../chunk-pdf.ps1') -Destination $wrapper
$pdf=Join-Path $temp 'Cooling manual, test.pdf'
Set-Content -LiteralPath $pdf -Value 'Placeholder: parser tested separately'
$global:RagWrapperTestState=@{Captured=@(); FakeExit=0}
function docker {
  $global:RagWrapperTestState.Captured=@($args | ForEach-Object { [string]$_ })
  $global:LASTEXITCODE=$global:RagWrapperTestState.FakeExit
}
Push-Location -LiteralPath $temp
try {
  & $wrapper -Pdf $pdf -Size 450 -Overlap 50 -Out output/small.json
  if ($global:RagWrapperTestState.Captured -notcontains "${pdf}:/input/document.pdf:ro") { throw 'PDF mount argument was split or changed.' }
  foreach ($expected in @('--no-deps','/input/document.pdf','Cooling manual, test.pdf','450','50','/result/small.json',((Join-Path $temp 'output')+':/result'))) {
    if ($global:RagWrapperTestState.Captured -notcontains $expected) { throw "Missing argument: $expected" }
  }
  foreach ($output in @('optyma.json', (Join-Path $temp 'absolute file.json'))) {
    & $wrapper -Pdf $pdf -Out $output
    if ($global:RagWrapperTestState.Captured -notcontains "${temp}:/result") { throw 'Output did not resolve against caller directory.' }
    if ($global:RagWrapperTestState.Captured -notcontains ('/result/'+[IO.Path]::GetFileName($output))) { throw 'Output filename changed.' }
  }
  foreach ($strategy in @('paragraph','structure')) {
    & $wrapper -Pdf $pdf -Strategy $strategy
    $captured=$global:RagWrapperTestState.Captured
    $overlapIndex=[array]::IndexOf($captured,'--overlap')
    if ($captured[$overlapIndex+1] -ne '0') { throw 'Whole-paragraph strategies must default to zero overlap.' }
    if ($captured -notcontains $strategy) { throw 'Strategy was not passed to Docker.' }
  }
  $global:RagWrapperTestState.FakeExit=7
  try { & $wrapper -Pdf $pdf; throw 'Expected Docker failure was not propagated.' }
  catch { if ($_.Exception.Message -notlike 'Chunking failed*') { throw } }
  Write-Host 'PowerShell wrapper checks passed.'
} finally {
  Pop-Location
  Remove-Item -LiteralPath $temp -Recurse -Force
  Remove-Variable -Name RagWrapperTestState -Scope Global
}
