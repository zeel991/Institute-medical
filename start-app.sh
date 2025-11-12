#!/bin/bash

echo "🛑 Forcing shutdown of any process on port 3000..."

# Kill any existing process on port 3000
PID=$(sudo lsof -t -i :3000)
if [ ! -z "$PID" ]; then
    kill -9 "$PID" 2>/dev/null
    echo "Killed old backend process $PID."
else
    echo "✅ Port 3000 is clear."
fi

# --- START BACKEND SERVER ---
echo "🚀 Starting Backend Server..."
cd backend
npm run dev