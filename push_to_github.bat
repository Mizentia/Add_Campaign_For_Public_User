@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

title Add Campaign (Public User) - Auto Git Push

echo ===================================================
echo   Add Campaign (Public User) Git Push Automation
echo ===================================================
echo.

where git >nul 2>nul
if !errorlevel! neq 0 (
    echo [ERROR] Git is not installed on this system!
    goto end
)

if not exist .git (
    echo [INFO] Initializing Git repository...
    git init
    git branch -M main
    git remote add origin https://github.com/Mizentia/Add_Campaign_For_Public_User.git
)

git config core.askyesno false

echo Checking Project Rules (Syntax ^& 100-Line Limit)...
where node >nul 2>nul
if !errorlevel! equ 0 (
    node scripts/verify-syntax.js && node scripts/audit-line-counts.js
    if !errorlevel! neq 0 (
        echo [ERROR] Rule verification failed! Fix issues before pushing.
        goto end
    )
)

echo.
echo Checking Git status...
git status --short
echo.

git status --short | findstr /R "^" >nul
if !errorlevel! neq 0 (
    echo [INFO] No changes detected to commit. Checking push...
    goto push_stage
)

echo Staging changes (git add .)...
git add .
if !errorlevel! neq 0 (
    echo [ERROR] Failed to stage files.
    goto end
)

echo.
set /p commit_msg="Enter commit message (Press Enter for auto-message): "
if "!commit_msg!"=="" set "commit_msg=Auto-update: %date% %time%"

echo Committing changes: "!commit_msg!"
git commit -m "!commit_msg!"
if !errorlevel! neq 0 (
    echo [ERROR] Commit failed.
    goto end
)

:push_stage
git remote get-url origin >nul 2>nul
if !errorlevel! neq 0 (
    git remote add origin https://github.com/Mizentia/Add_Campaign_For_Public_User.git
)

for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i
if "!current_branch!"=="" set current_branch=main

echo.
echo Pushing changes to GitHub (Branch: !current_branch!)...
git push -u origin !current_branch!
if !errorlevel! equ 0 (
    echo [SUCCESS] Project successfully pushed to GitHub!
) else (
    echo [ERROR] Git push failed! Check credentials or run 'git pull origin !current_branch!' first.
)

:end
echo.
echo Press any key to close this terminal...
pause >nul
