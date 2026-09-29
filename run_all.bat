@echo off
setlocal

REM Switch to root script directory
cd /d "%~dp0"

echo ======================================================================
echo  SPORTTRACK: VISION ANALYTICS FOR FIELD SPORTS
echo  Starting Full-Stack System (AI Engine + Backend + Frontend)
echo ======================================================================
echo.

REM 1. Start Python AI and Computer Vision Engine
echo [1/3] Starting Python Computer Vision and Biomechanics Engine (Port 8000)...
start "SportTrack-AI-Engine-8000" /D "%~dp0" cmd /k "python ai_engine/server.py"

REM Wait 2 seconds for Python service initialization
timeout /t 2 /nobreak >nul

REM 2. Start Node.js Express Gateway
echo [2/3] Starting Express and Socket.IO Backend Gateway (Port 5000)...
start "SportTrack-Backend-5000" /D "%~dp0backend" cmd /k "npm start"

REM Wait 2 seconds for Express server initialization
timeout /t 2 /nobreak >nul

REM 3. Start React Frontend Dashboard
echo [3/3] Starting React.js Frontend Dashboard (Port 3000)...
start "SportTrack-Frontend-3000" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo ======================================================================
echo  ALL SERVICES LAUNCHED SUCCESSFULLY!
echo ======================================================================
echo.
echo  * Web Dashboard:       http://localhost:3000
echo  * REST API Gateway:    http://localhost:5000/api
echo  * AI Engine Swagger:   http://localhost:8000/docs
echo.
echo  (Keep the terminal windows open while running the application)
echo ======================================================================
