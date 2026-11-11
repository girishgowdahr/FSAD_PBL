@echo off
title Automated URL Shortener with Analytics
echo =======================================================
echo Starting Automated URL Shortener with Analytics
echo =======================================================

echo Checking/Starting MongoDB...
start "MongoDB Server" /min "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe" --dbpath "C:\Users\admin\.gemini\antigravity\scratch\mongodb_data" --port 27017 --bind_ip 127.0.0.1

echo Waiting for database initialization...
timeout /t 2 /nobreak > nul

echo Starting Backend and Frontend with concurrently...
npm run dev
