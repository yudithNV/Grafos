@echo off
chcp 65001 >nul
title Graphix - Simulador de logica difusa (Python)
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 simulador_fuzzy.py %*
) else (
  python simulador_fuzzy.py %*
)
pause
