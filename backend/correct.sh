#!/bin/bash

echo "🔄 Updating backend file upload limit to 10MB..."

# Define the file path
FILE="src/routes/complaints.routes.ts"

# Use sed to replace the 5MB limit with a 10MB limit
# The original line is: limits: { fileSize: 5 * 1024 * 1024 },
# We are changing '5' to '10'.
sed -i 's/fileSize: 5 \* 1024 \* 1024/fileSize: 10 \* 1024 \* 1024/' "$FILE"

echo "✅ File upload limit successfully updated to 10MB in $FILE."

# --- Kill the currently running backend process on port 3000 ---
echo "🛑 Killing old server process on port 3000..."

# Find the PID of the process listening on port 3000
PID=$(sudo lsof -t -i :3000)

if [ ! -z "$PID" ]; then
    kill -9 "$PID" 2>/dev/null
    echo "Killed PID $PID."
else
    echo "No process found on port 3000."
fi

# --- Restart the Backend Server ---
echo "🚀 Restarting backend server..."

# Assuming you are in the backend directory, run npm dev
npm run dev