@echo off
chcp 65001 > nul
title SEED TO SUCCESS - Firebase Local Server

echo ========================================================
echo   SEED TO SUCCESS - มหาวิทยาลัยธรรมศาสตร์
echo   กำลังเปิดเซิร์ฟเวอร์จำลอง Firebase Frontend บนเครื่องของคุณ...
echo ========================================================
echo.

python serve_firebase.py

pause
