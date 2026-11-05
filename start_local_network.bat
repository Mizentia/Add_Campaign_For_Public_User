@echo off
title Add Campaign (Public User) - Local Network Host
color 0a
cd /d "%~dp0"

echo ================================================================
echo     ADD CAMPAIGN (PUBLIC USER) - LOCAL NETWORK HOST (WIFI)
echo ================================================================
echo.
echo [1/3] Detecting Local Network IP Address...

for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias '*Wi-Fi*', '*Ethernet*', '*Local Area Connection*' -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress"`) do set LOCAL_IP=%%i

if "%LOCAL_IP%"=="" (
  for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress"`) do set LOCAL_IP=%%i
)

if "%LOCAL_IP%"=="" set LOCAL_IP=localhost

echo [2/3] Local IP Detected: %LOCAL_IP%
echo [3/3] Launching Public Campaign Portal on Port 8088...
echo.

start http://%LOCAL_IP%:8088/

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  node server.js
) else (
  echo [Notice] Node.js not in PATH, launching using PowerShell HTTP Server...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=8088; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://*:' + $port + '/'); $listener.Start(); Write-Host 'Running on http://%LOCAL_IP%:' $port; while($listener.IsListening){ $ctx = $listener.GetContext(); $req = $ctx.Request; $res = $ctx.Response; $url = $req.RawUrl.Split('?')[0]; if($url -eq '/') { $url = '/index.html' }; $file = Join-Path (Get-Location) $url.TrimStart('/'); if(Test-Path $file -PathType Leaf){ $bytes = [System.IO.File]::ReadAllBytes($file); $ext = [System.IO.Path]::GetExtension($file).ToLower(); if($ext -eq '.html'){$res.ContentType='text/html'}elseif($ext -eq '.js'){$res.ContentType='application/javascript'}elseif($ext -eq '.css'){$res.ContentType='text/css'}else{$res.ContentType='application/octet-stream'}; $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length); } else { $res.StatusCode = 404 }; $res.Close(); }"
)

pause
