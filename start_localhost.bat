@echo off
title Add Campaign (Public User) - Localhost (Port 8088)
color 0b
cd /d "%~dp0"

echo ================================================================
echo       ADD CAMPAIGN (PUBLIC USER) - LOCALHOST LAUNCHER
echo ================================================================
echo.
echo [1/2] Starting Public Campaign Portal on http://localhost:8088/ ...
echo [2/2] Opening Default Browser...
echo.

start http://localhost:8088/

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  node server.js --local-only
) else (
  echo [Notice] Node.js not in PATH, launching using PowerShell HTTP Server...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=8088; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:' + $port + '/'); $listener.Start(); Write-Host 'Running on port 8088'; while($listener.IsListening){ $ctx = $listener.GetContext(); $req = $ctx.Request; $res = $ctx.Response; $url = $req.RawUrl.Split('?')[0]; if($url -eq '/') { $url = '/index.html' }; $file = Join-Path (Get-Location) $url.TrimStart('/'); if(Test-Path $file -PathType Leaf){ $bytes = [System.IO.File]::ReadAllBytes($file); $ext = [System.IO.Path]::GetExtension($file).ToLower(); if($ext -eq '.html'){$res.ContentType='text/html'}elseif($ext -eq '.js'){$res.ContentType='application/javascript'}elseif($ext -eq '.css'){$res.ContentType='text/css'}else{$res.ContentType='application/octet-stream'}; $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length); } else { $res.StatusCode = 404 }; $res.Close(); }"
)

pause
