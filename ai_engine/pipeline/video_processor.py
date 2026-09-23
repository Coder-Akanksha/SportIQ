import os
import time
import cv2
import json
import numpy as np
from typing import Dict, List, Any, Optional, Tuple

from ai_engine.core.pose_detector import PoseDetector
from ai_engine.core.kinematics import BiomechanicsCalculator, KinematicFrameMetrics
from ai_engine.core.shot_detector import ShotDetector, ShotEvent
from ai_engine.core.performance_indexer import PerformanceIndexer, PerformanceIndexResult
from ai_engine.core.visualizer import OverlayVisualizer


class VideoProcessor:
    """
    Complete End-to-End Pipeline for 30+ FPS Video and Webcam Stream Analysis.
    Coordinates Pose Estimation, Kinematic Math, Shot Rule Verification,
    Performance Index Rating, and Color-Coded Visual Overlays.
    """

    def __init__(
        self,
        sport_type: str = "basketball",
        dominant_side: str = "right",
        min_detection_confidence: float = 0.5,
        target_fps: float = 30.0
    ):
        self.sport_type = sport_type
        self.dominant_side = dominant_side
        self.target_fps = target_fps

        self.pose_detector = PoseDetector(min_detection_confidence=min_detection_confidence)
        self.kinematics = BiomechanicsCalculator(dominant_side=dominant_side)
        self.shot_detector = ShotDetector(sport_type=sport_type)
        self.performance_indexer = PerformanceIndexer()
        self.visualizer = OverlayVisualizer(dominant_side=dominant_side)

        self.recent_outcome: Optional[str] = None
        self.recent_outcome_counter: int = 0
        self.latest_pi_result: Optional[PerformanceIndexResult] = None

    def process_single_frame(
        self,
        frame_bgr: np.ndarray,
        frame_idx: int,
        fps: float = 30.0,
        render_overlays: bool = True
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Processes an individual video frame in real-time.
        Targeting sub-30ms latency for 30+ FPS operation.
        """
        start_time = time.perf_counter()

        # 1. Pose Estimation
        landmarks_3d, landmarks_2d, _ = self.pose_detector.process_frame(frame_bgr)

        # 2. Kinematic & Biomechanical Evaluation
        metrics = self.kinematics.evaluate_frame(landmarks_3d, frame_idx, fps=fps)

        # 3. Wrist position for trajectory tracking
        wrist_key = f"{self.dominant_side}_wrist"
        wrist_pos = landmarks_2d.get(wrist_key, None)

        # 4. Shot Rule Engine
        active_elbow_angle = metrics.elbow_angle_right if self.dominant_side == "right" else metrics.elbow_angle_left
        shot_event = self.shot_detector.update(
            frame_idx=frame_idx,
            timestamp_ms=metrics.timestamp_ms,
            frame_bgr=frame_bgr,
            kinematic_state=metrics.arm_state,
            current_elbow_angle=active_elbow_angle,
            wrist_pos=wrist_pos,
            extension_delta=metrics.extension_delta,
            knee_timing_sync=88.0
        )

        if shot_event:
            self.recent_outcome = shot_event.outcome
            self.recent_outcome_counter = int(fps * 1.5)  # Display outcome splash for 1.5 seconds

        if self.recent_outcome_counter > 0:
            self.recent_outcome_counter -= 1
        else:
            self.recent_outcome = None

        # 5. Compute Dynamic Performance Index
        shot_stats = self.shot_detector.get_summary()
        illegal_count = sum(1 for m in self.kinematics.history if m.is_illegal_extension)
        release_angles = [s.release_angle for s in self.shot_detector.shot_history]
        deltas = [s.elbow_extension_delta for s in self.shot_detector.shot_history]
        sync_scores = [s.knee_timing_sync for s in self.shot_detector.shot_history]

        pi_result = self.performance_indexer.compute_index(
            accuracy_percentage=shot_stats["accuracy_percentage"],
            elbow_angles_at_release=release_angles,
            extension_deltas=deltas,
            knee_timing_sync_scores=sync_scores,
            illegal_extension_count=illegal_count
        )
        self.latest_pi_result = pi_result

        # 6. Render Overlays
        annotated_frame = frame_bgr.copy()
        if render_overlays:
            annotated_frame = self.visualizer.draw_target_and_trajectory(
                annotated_frame,
                self.shot_detector.target_box,
                self.shot_detector.current_trajectory,
                recent_outcome=self.recent_outcome
            )
            annotated_frame = self.visualizer.draw_skeleton(annotated_frame, landmarks_2d, metrics)
            annotated_frame = self.visualizer.draw_hud(
                annotated_frame,
                fps=fps,
                metrics=metrics,
                shot_stats=shot_stats,
                performance_index=pi_result.overall_pi
            )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        telemetry = {
            "frame_index": frame_idx,
            "timestamp_ms": metrics.timestamp_ms,
            "processing_latency_ms": round(elapsed_ms, 2),
            "dominant_side": self.dominant_side,
            "elbow_angle": round(active_elbow_angle, 1),
            "knee_angle": round(metrics.knee_angle_right if self.dominant_side == "right" else metrics.knee_angle_left, 1),
            "extension_delta": metrics.extension_delta,
            "is_illegal_extension": metrics.is_illegal_extension,
            "arm_state": metrics.arm_state,
            "landmark_confidence": metrics.landmark_confidence,
            "shot_summary": shot_stats,
            "performance_index": {
                "overall_pi": pi_result.overall_pi,
                "grade": pi_result.grade,
                "accuracy_score": pi_result.accuracy_score,
                "elbow_stability_score": pi_result.elbow_stability_score,
                "knee_timing_score": pi_result.knee_timing_score,
                "coaching_insights": pi_result.coaching_insights,
            },
            "new_shot_event": {
                "shot_id": shot_event.shot_id,
                "outcome": shot_event.outcome,
                "release_angle": shot_event.release_angle,
                "extension_delta": shot_event.elbow_extension_delta,
                "confidence": shot_event.confidence,
                "timestamp_ms": shot_event.timestamp_ms,
            } if shot_event else None
        }

        return annotated_frame, telemetry

    def process_video_file(
        self,
        input_video_path: str,
        output_video_path: Optional[str] = None,
        progress_callback: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Batch processes a recorded video file, generates an annotated video and JSON analytics report.
        """
        if not os.path.exists(input_video_path):
            raise FileNotFoundError(f"Input video not found: {input_video_path}")

        cap = cv2.VideoCapture(input_video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        writer = None
        if output_video_path:
            os.makedirs(os.path.dirname(os.path.abspath(output_video_path)), exist_ok=True)
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        self.reset()
        frame_telemetries = []
        frame_idx = 0
        start_process_time = time.time()

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            annotated_frame, telemetry = self.process_single_frame(frame, frame_idx, fps=fps)
            frame_telemetries.append(telemetry)

            if writer:
                writer.write(annotated_frame)

            frame_idx += 1
            if progress_callback and frame_idx % 10 == 0:
                progress_callback(frame_idx, total_frames)

        cap.release()
        if writer:
            writer.release()

        total_processing_time = time.time() - start_process_time
        avg_fps = frame_idx / max(total_processing_time, 0.001)

        summary_report = {
            "input_file": input_video_path,
            "output_file": output_video_path,
            "total_frames": frame_idx,
            "fps": fps,
            "processing_fps": round(avg_fps, 1),
            "duration_seconds": round(frame_idx / max(fps, 1.0), 2),
            "shot_summary": self.shot_detector.get_summary(),
            "final_performance_index": self.latest_pi_result.__dict__ if self.latest_pi_result else None,
            "illegal_extensions_detected": sum(1 for m in self.kinematics.history if m.is_illegal_extension),
            "frame_telemetry_sample": frame_telemetries[::max(1, len(frame_telemetries) // 100)]  # Sampled 100 points
        }

        return summary_report

    def reset(self):
        """Resets state for new session or video."""
        self.kinematics.reset_session()
        self.shot_detector = ShotDetector(sport_type=self.sport_type)
        self.recent_outcome = None
        self.recent_outcome_counter = 0

    def close(self):
        """Releases underlying resources."""
        self.pose_detector.close()

