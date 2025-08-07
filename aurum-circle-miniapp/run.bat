@echo off
REM 🚀 Aurum Circle Miniapp - Easy Run Script (Windows)
REM This script sets up and runs the miniapp with one command

echo 🌟 Starting Aurum Circle Miniapp Setup...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first:
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
) else (
    echo ✅ Dependencies already installed
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local file not found!
    echo.
    echo 🔧 Creating .env.local with template...
    (
        echo # ===== REQUIRED CONFIGURATION =====
        echo # Get these from https://developer.worldcoin.org/
        echo.
        echo # World ID Configuration ^(REQUIRED^)
        echo # 1. Create app at https://developer.worldcoin.org/
        echo # 2. Set App Type to "Miniapp" 
        echo # 3. Copy App ID and App Secret below
        echo NEXT_PUBLIC_WORLDCOIN_APP_ID=app_staging_your_actual_app_id_here
        echo WORLDCOIN_APP_SECRET=sk_your_actual_app_secret_here
        echo.
        echo # JWT Configuration ^(REQUIRED^)
        echo # Generate a secure random string for session management
        echo # Use: openssl rand -base64 32
        echo JWT_SECRET=dev-jwt-secret-change-in-production-12345
        echo.
        echo # ===== OPTIONAL CONFIGURATION =====
        echo.
        echo # Wallet Connect Configuration ^(for future features^)
        echo NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
        echo.
        echo # Blockchain Configuration ^(for NFT verification^)
        echo ALCHEMY_API_KEY=your_alchemy_api_key
        echo NEXT_PUBLIC_CHAIN_ID=1
        echo.
        echo # NFT Contract Configuration ^(Bangkok University NFTs^)
        echo NFT_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
        echo.
        echo # Environment
        echo NODE_ENV=development
    ) > .env.local
    echo ✅ Created .env.local template
    echo.
    echo ⚠️  IMPORTANT: You need to update .env.local with your World ID credentials!
    echo    1. Visit: https://developer.worldcoin.org/
    echo    2. Create a new app with type 'Miniapp'
    echo    3. Copy App ID and App Secret to .env.local
    echo.
    pause
)

REM Validate environment variables
echo 🔍 Checking environment configuration...

findstr "your_actual_app_id_here" .env.local >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Please update NEXT_PUBLIC_WORLDCOIN_APP_ID in .env.local
    echo    Visit: https://developer.worldcoin.org/ to get your App ID
    pause
    exit /b 1
)

findstr "your_actual_app_secret_here" .env.local >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Please update WORLDCOIN_APP_SECRET in .env.local
    echo    Visit: https://developer.worldcoin.org/ to get your App Secret
    pause
    exit /b 1
)

echo ✅ Environment configuration looks good

REM Get local IP address for mobile testing
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    set LOCAL_IP=!LOCAL_IP: =!
    goto :found_ip
)
:found_ip

echo.
echo 🎉 Starting Aurum Circle Miniapp...
echo.
echo 📱 Access URLs:
echo    Local:    http://localhost:3000
if defined LOCAL_IP (
    echo    Mobile:   http://%LOCAL_IP%:3000
)
echo.
echo 🔧 For World App testing:
echo    1. Install World App on your phone
echo    2. Complete World ID verification ^(Orb required^)
echo    3. Open the mobile URL above in World App browser
echo.
echo 📖 Need help? Check DEV_SETUP.md or WORLD_ID_SETUP.md
echo.
echo 🚀 Starting development server...

REM Start the development server
call npm run dev