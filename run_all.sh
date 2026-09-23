#!/bin/bash

echo "======================================================================"
echo " STARTING SPORTTRACK: VISION ANALYTICS FULL-STACK ECOSYSTEM"
echo "======================================================================"

# Start AI Engine
echo "[1/3] Starting Python AI Engine on http://localhost:8000..."
python3 ai_engine/server.py &
PID_AI=$!

sleep 2

# Start Backend Gateway
echo "[2/3] Starting Node.js Express Backend on http://localhost:5000..."
cd backend && npm start &
PID_BACKEND=$!
cd ..

sleep 2

# Start Frontend
echo "[3/3] Starting React Frontend on http://localhost:3000..."
cd frontend && npm run dev &
PID_FRONTEND=$!
cd ..

echo ""
echo "All services running:"
echo "- Frontend:  http://localhost:3000"
echo "- Backend:   http://localhost:5000/api"
echo "- AI Engine: http://localhost:8000/docs"
echo "Press Ctrl+C to terminate all services."

trap "kill $PID_AI $PID_BACKEND $PID_FRONTEND" EXIT
wait

