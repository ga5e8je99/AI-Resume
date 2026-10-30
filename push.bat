@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"
node scripts/git-push.mjs %*

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Push failed with exit code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)

if "%~1"=="" (
    timeout /t 3 >nul
)
