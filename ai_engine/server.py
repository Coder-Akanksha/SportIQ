import sys
import os

# Ensure both root directory and ai_engine directory are in python path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENGINE_DIR = os.path.abspath(os.path.dirname(__file__))

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

import io
import time
import base64
import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

# Flexible imports supporting both module and direct package execution
try:
    from ai_engine.pipeline.video_processor import VideoProcessor
    from ai_engine.core.kinematics import BiomechanicsCalculator, JointPoint3D
    from ai_engine.core.performance_indexer import PerformanceIndexer
except ModuleNotFoundError:
    from pipeline.video_processor import VideoProcessor
    from core.kinematics import BiomechanicsCalculator, JointPoint3D
    from core.performance_indexer import PerformanceIndexer

app = FastAPI(
    title="SportTrack Vision Analytics & Biomechanics API",
    version="1.0.0",
    description="High-speed 3D Markerless Pose Estimation, Elbow Extension (>15°) Detection, Shot Rule Engine, and Performance Indexing."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global processor instance for streaming sessions
streaming_processor = VideoProcessor(sport_type="basketball", dominant_side="right")


class FrameAnalysisRequest(BaseModel):
    image_base64: str
    frame_index: int = 0
    sport_type: str = "basketball"
    dominant_side: str = "right"
    render_overlays: bool = True


class DirectKinematicsRequest(BaseModel):
    shoulder: List[float]  # [x, y, z]
    elbow: List[float]     # [x, y, z]
    wrist: List[float]     # [x, y, z]
    hip: Optional[List[float]] = None
    knee: Optional[List[float]] = None
    ankle: Optional[List[float]] = None


@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "SportTrack Vision AI Engine",
        "version": "1.0.0",
        "supported_sports": ["basketball", "cricket_bowling", "tennis_serve", "football"],
        "timestamp": time.time()
    }


@app.post("/analyze-frame")
async def analyze_frame(payload: FrameAnalysisRequest):
    """
    Analyzes an individual video frame encoded in Base64 (from webcam / canvas).
    Returns real-time kinematic metrics, illegal extension flags, and annotated base64 overlay.
    """
    try:
        image_data = payload.image_base64
        if "," in image_data:
            image_data = image_data.split(",")[1]
        
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame_bgr is None:
            raise HTTPException(status_code=400, detail="Invalid image encoding")

        streaming_processor.sport_type = payload.sport_type
        streaming_processor.dominant_side = payload.dominant_side

        annotated_frame, telemetry = streaming_processor.process_single_frame(
            frame_bgr,
            frame_idx=payload.frame_index,
            fps=30.0,
            render_overlays=payload.render_overlays
        )

        _, buffer = cv2.imencode(".jpg", annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

        return {
            "success": True,
            "telemetry": telemetry,
            "annotated_image": annotated_b64 if payload.render_overlays else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-video")
async def analyze_video(
    file: UploadFile = File(...),
    sport_type: str = Form("basketball"),
    dominant_side: str = Form("right")
):
    """
    Uploads a video file, runs full batch computer vision pipeline,
    and returns comprehensive analytics report with shot breakdown and kinematic trends.
    """
    try:
        os.makedirs("temp_uploads", exist_ok=True)
        os.makedirs("temp_processed", exist_ok=True)

        input_path = os.path.join("temp_uploads", file.filename)
        output_path = os.path.join("temp_processed", f"annotated_{file.filename}")

        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)

        processor = VideoProcessor(sport_type=sport_type, dominant_side=dominant_side)
        summary = processor.process_video_file(input_path, output_path)

        return {
            "success": True,
            "filename": file.filename,
            "summary": summary,
            "annotated_video_url": f"/static/{os.path.basename(output_path)}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compute-kinematics")
async def compute_kinematics(req: DirectKinematicsRequest):
    """
    Lightweight endpoint to calculate 3D Elbow Flexion Angle using the exact vector formula:
    theta = arccos((V_SE . V_EW) / (||V_SE|| * ||V_EW||))
    """
    sh = JointPoint3D(req.shoulder[0], req.shoulder[1], req.shoulder[2])
    el = JointPoint3D(req.elbow[0], req.elbow[1], req.elbow[2])
    wr = JointPoint3D(req.wrist[0], req.wrist[1], req.wrist[2])

    elbow_angle = BiomechanicsCalculator.calculate_elbow_flexion_angle(sh, el, wr)
    
    knee_angle = None
    if req.hip and req.knee and req.ankle:
        p_hip = np.array(req.hip)
        p_knee = np.array(req.knee)
        p_ank = np.array(req.ankle)
        knee_angle = BiomechanicsCalculator.calculate_vector_angle_3d(p_hip, p_knee, p_ank)

    return {
        "elbow_flexion_angle_deg": round(elbow_angle, 2),
        "knee_flexion_angle_deg": round(knee_angle, 2) if knee_angle is not None else None,
        "is_illegal_straightening": elbow_angle > 15.0 if elbow_angle < 45.0 else False,
        "formula_used": "arccos((V_SE . V_EW) / (||V_SE|| * ||V_EW||))"
    }


@app.websocket("/ws/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    frame_count = 0
    
    try:
        while True:
            data = await websocket.receive_json()
            image_b64 = data.get("image_base64")
            sport = data.get("sport_type", "basketball")
            dominant = data.get("dominant_side", "right")

            if image_b64:
                if "," in image_b64:
                    image_b64 = image_b64.split(",")[1]
                img_bytes = base64.b64decode(image_b64)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is not None:
                    streaming_processor.sport_type = sport
                    streaming_processor.dominant_side = dominant

                    annotated, telemetry = streaming_processor.process_single_frame(
                        frame,
                        frame_idx=frame_count,
                        fps=30.0,
                        render_overlays=True
                    )
                    frame_count += 1

                    _, buf = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
                    ann_b64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")

                    await websocket.send_json({
                        "type": "telemetry_update",
                        "frame_index": frame_count,
                        "telemetry": telemetry,
                        "annotated_image": ann_b64
                    })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
