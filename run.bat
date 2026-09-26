@echo off
chcp 65001 > nul
title LINE LIFF Member System
echo ========================================================
echo   LINE LIFF Membership System - กำลังเริ่มระบบ...
echo ========================================================
echo.

python -m pip install -r requirements.txt
echo.
echo เริ่มต้นรันเซิร์ฟเวอร์...
python app.py
pause
