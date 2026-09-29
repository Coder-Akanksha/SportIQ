# SportIQ

SportIQ is a full-stack sports analytics platform for video-based performance analysis, posture tracking, and biomechanical coaching feedback. It combines computer-vision-powered pose estimation with a React dashboard and an Express API, enabling users to analyze athlete movement, detect technical faults, and review sessions with measurable performance metrics.

## Overview

The system is built as three connected services:

- AI Engine: Python + FastAPI + OpenCV + MediaPipe-based processing for pose analysis, telemetry extraction, and annotated video generation
- Backend: Node.js + Express service for session management, analytics APIs, file upload handling, and socket-based telemetry relay
- Frontend: React + Vite dashboard for live analysis, video upload, session history, and coaching insights

## Key Features

- Markerless pose estimation and motion tracking from sport footage or webcam input
- Joint angle computation and biomechanical kinematic analysis
- Illegal elbow extension detection and shot-rule evaluation
- Performance index scoring and shot outcome classification
- Annotated sports video output with overlays and movement insights
- Real-time telemetry stream for live coaching feedback
- Session history, dashboards, and athlete analytics views
- Support for basketball, cricket bowling, tennis serve, and football analysis flows

## Architecture

```text
SportIQ/
├── ai_engine/          # Python AI service for pose analysis and video processing
├── backend/            # Express API gateway and socket server
├── frontend/           # React + Vite app
├── sample_data/        # Example sports clip(s)
├── output/             # Processed output videos and reports
├── run_all.sh          # Starts all services on Unix-like systems
├── run_all.bat         # Starts all services on Windows
├── README.md
└── ...
```

## Tech Stack

### AI Engine
- Python
- FastAPI
- OpenCV
- MediaPipe
- NumPy
- Uvicorn

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB (optional fallback in-memory datastore)
- Multer for uploads

### Frontend
- React
- Vite
- Tailwind CSS
- Recharts
- Lucide React

## Prerequisites

Before running the project, make sure you have:

- Python 3.10+
- Node.js 18+
- npm
- Optional: MongoDB running locally if you want to use the database-backed mode

## Quick Start

### 1) Install Python dependencies

```bash
pip install -r ai_engine/requirements.txt
```

### 2) Install backend dependencies

```bash
cd backend
npm install
```

### 3) Install frontend dependencies

```bash
cd frontend
npm install
```

### 4) Start the services

You can start each service separately or use the provided launcher:

#### Option A: Run everything together

On macOS/Linux:

```bash
./run_all.sh
```

On Windows:

```bat
run_all.bat
```

#### Option B: Start manually

Terminal 1:

```bash
python3 ai_engine/server.py
```

Terminal 2:

```bash
cd backend
npm start
```

Terminal 3:

```bash
cd frontend
npm run dev
```

## Default Local URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- AI Engine: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Example Workflow

1. Upload a sports video from the frontend or use the sample video.
2. The backend forwards the file to the AI engine.
3. The Python engine analyzes motion and detects key biomechanical events.
4. The system computes telemetry such as joint angles, shot outcomes, and performance scores.
5. Results are shown in the dashboard with coaching feedback and annotated video output.

## Sample Data

The repo includes a sample clip under `sample_data/` and processed output under `output/` to help validate the pipeline quickly.

## Notes

- If MongoDB is not available, the backend runs in a resilient in-memory fallback mode.
- The application is designed for analytics and coaching workflows in field sports and swing-based motion analysis.
- The AI engine exposes endpoints such as `/analyze-frame`, `/analyze-video`, `/compute-kinematics`, and `/ws/stream`.

## Project Status

This project is intended as a functional sports AI analytics prototype and demo platform for motion tracking, kinematic analysis, and coaching decision support.

## Contributing

Contributions, feature suggestions, and improvements are welcome. If you are extending the analysis logic or UI, keep the service boundaries clear between:

- AI processing in `ai_engine/`
- API logic in `backend/src/`
- UI and dashboard logic in `frontend/src/`
