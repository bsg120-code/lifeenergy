@echo off
chcp 65001 > nul
title Life Energy Cloud - 라이프 에너지 관리 앱 실행기

set "TARGET_URL=file:///%~dp0index.html"
set "TARGET_URL=%TARGET_URL:\=/%"

echo ========================================================
echo   ⚡ Life Energy Cloud - 라이프 에너지 자율 관리 시스템
echo   독립 앱 모드로 실행 중입니다...
echo ========================================================

:: 1. Chrome 앱 모드로 실행 시도 (주소창 없는 단독 앱 창)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%"
    exit /b
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%"
    exit /b
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%"
    exit /b
)

:: 2. Microsoft Edge 앱 모드로 실행 시도 (Windows 10/11 기본 탑재)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%TARGET_URL%"
    exit /b
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%TARGET_URL%"
    exit /b
)

:: 3. 기타 기본 브라우저 실행
start "" "%TARGET_URL%"
exit /b
