@echo off
REM TaskFlow Setup Script for Windows

echo.
echo =========================================
echo   TaskFlow Setup Script (Windows)
echo =========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found

REM Backend Setup
echo.
echo Installing Backend Dependencies...
cd backend

if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo WARNING: Please edit backend\.env with your MySQL credentials
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Backend npm install failed
    pause
    exit /b 1
)

echo ✓ Backend setup complete

REM Frontend Setup
echo.
echo Installing Frontend Dependencies...
cd ..\frontend

if not exist .env (
    echo Creating .env file...
    echo REACT_APP_API_URL=http://localhost:5000/api > .env
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Frontend npm install failed
    pause
    exit /b 1
)

echo ✓ Frontend setup complete

echo.
echo =========================================
echo   Setup Complete!
echo =========================================
echo.
echo To start development:
echo.
echo   Option 1 - Two Terminals:
echo   Terminal 1: cd backend && npm run dev
echo   Terminal 2: cd frontend && npm start
echo.
echo   Option 2 - Docker (if installed):
echo   docker-compose up --build
echo.
echo Backend runs on http://localhost:5000
echo Frontend runs on http://localhost:3000
echo.
echo Make sure MySQL is running on localhost:3306
echo Default credentials in backend\.env: root/password
echo.
pause
