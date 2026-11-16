@echo off
chcp 65001 >nul
title Graphix - Instalar librerias de Python
cd /d "%~dp0"
echo Instalando scikit-fuzzy, numpy, scipy, networkx y matplotlib...
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 -m pip install --upgrade -r requirements.txt
) else (
  python -m pip install --upgrade -r requirements.txt
)
if %errorlevel%==0 (
  echo.
  echo Listo. Ahora abre iniciar_simulador.bat
) else (
  echo.
  echo No se pudo instalar. Revisa que Python este instalado y en el PATH.
)
pause
