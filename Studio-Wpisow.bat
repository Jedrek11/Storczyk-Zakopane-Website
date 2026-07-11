@echo off
chcp 65001 >nul
title Studio wpisow - Willa Storczyk
cd /d "%~dp0"
echo.
echo   Uruchamiam Studio wpisow...
echo   (za chwile otworzy sie w przegladarce)
echo.
node scripts\studio.js
echo.
echo   Studio zostalo zamkniete. Mozesz zamknac to okno.
pause >nul
