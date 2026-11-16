@echo off
chcp 65001 >nul
title Graphix - Puente MATLAB
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 puente_matlab.py %*
) else (
  python puente_matlab.py %*
)
pause
