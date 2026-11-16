@echo off
chcp 65001 >nul
title Graphix - Instalar MATLAB Engine
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 instalar_engine.py %*
) else (
  python instalar_engine.py %*
)
pause
