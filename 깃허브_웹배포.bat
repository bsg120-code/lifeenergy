@echo off
chcp 65001 > nul
title Life Energy Cloud - GitHub Pages 웹 배포기
echo ========================================================
echo   ⚡ Life Energy Cloud - GitHub Pages 영구 무료 웹 배포
echo ========================================================
echo.
echo  GitHub(https://github.com/new)에서 생성한 저장소 주소를 입력하세요.
echo  (예: https://github.com/내아이디/life-energy-cloud.git)
echo.
set /p REPO_URL="👉 GitHub 저장소 주소(URL) 입력: "

if "%REPO_URL%"=="" (
    echo.
    echo ❌ 주소가 입력되지 않았습니다. 다시 실행해 주세요.
    pause
    exit /b
)

echo.
echo 🚀 GitHub으로 앱을 업로드(Push)하고 있습니다...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ❌ 업로드 중 오류가 발생했습니다.
    echo    GitHub 로그인 또는 저장소 권한/주소를 확인해 주세요.
    pause
    exit /b
)

echo.
echo ========================================================
echo   🎉 GitHub에 앱 업로드가 성공적으로 완료되었습니다!
echo ========================================================
echo.
echo  [마지막 설정 1분]
echo  1. GitHub 저장소 페이지의 상단 [Settings] 메뉴 클릭
echo  2. 왼쪽 사이드바에서 [Pages] 메뉴 클릭
echo  3. Branch를 [None] -> [main] 으로 변경 후 [Save] 클릭
echo.
echo  잠시 후 전 세계 어디서든 열리는 영구 무료 주소가 생성됩니다!
echo  👉 주소 형식: https://내아이디.github.io/저장소이름/
echo ========================================================
echo.
pause
