$mongoPath = "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe"
$dbPath = "C:\Users\admin\.gemini\antigravity\scratch\mongodb_data"

# Clean up port 5000 if occupied
$p5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($p5000) {
    Stop-Process -Id $p5000.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "Starting MongoDB process..."
$mongoProc = Start-Process -FilePath $mongoPath -ArgumentList "--dbpath `"$dbPath`" --port 27017 --bind_ip 127.0.0.1" -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3

try {
    Write-Host "Running test suite against Express server and MongoDB..."
    Set-Location "C:\Users\admin\.gemini\antigravity\scratch\url-shortener\server"
    node test/runTests.js
    $exitCode = $LASTEXITCODE
}
finally {
    Write-Host "Stopping MongoDB process..."
    if ($mongoProc -and -not $mongoProc.HasExited) {
        Stop-Process -Id $mongoProc.Id -Force
    }
    $p5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($p5000) {
        Stop-Process -Id $p5000.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

exit $exitCode
