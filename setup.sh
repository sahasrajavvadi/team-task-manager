#!/bin/bash

# TaskFlow Setup Script for Local Development

echo "🚀 TaskFlow Setup Script"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Backend Setup
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your MySQL credentials"
fi

npm install

echo "✅ Backend setup complete"

# Frontend Setup
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend

if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
fi

npm install

echo "✅ Frontend setup complete"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm start"
echo ""
echo "Backend will run on http://localhost:5000"
echo "Frontend will run on http://localhost:3000"
