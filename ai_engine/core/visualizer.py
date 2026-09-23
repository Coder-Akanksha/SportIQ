import cv2
import numpy as np
from typing import Dict, Tuple, List, Optional, Any

from .kinematics import KinematicFrameMetrics, JointPoint3D


class OverlayVisualizer:
    """
    High-tech HUD and Biomechanical Skeleton Overlay Renderer for OpenCV frames.
    Renders color-coded keypoints, angle arcs, kinetic velocity lines, and telemetry HUD.
    """

    # Skeletal connection pairs
    CONNECTIONS = [
        ("left_shoulder", "right_shoulder"),
        ("left_shoulder", "left_elbow"),
        ("left_elbow", "left_wrist"),
        ("right_shoulder", "right_elbow"),
        ("right_elbow", "right_wrist"),
        ("left_shoulder", "left_hip"),
        ("right_shoulder", "right_hip"),
        ("left_hip", "right_hip"),
        ("left_hip", "left_knee"),
        ("left_knee", "left_ankle"),
        ("right_hip", "right_knee"),
        ("right_knee", "right_ankle"),
    ]

    # Futuristic Color Palette (BGR)
    COLOR_BG_DARK = (15, 23, 42)        # Slate 900
    COLOR_CYAN = (240, 215, 0)          # Tech Cyan
    COLOR_GREEN = (74, 222, 128)        # Optimal Green
    COLOR_AMBER = (45, 170, 250)        # Warning Amber
    COLOR_RED = (68, 68, 239)           # Violation Red
    COLOR_WHITE = (255, 255, 255)
    COLOR_PURPLE = (225, 70, 168)       # Neon Purple

    def __init__(self, dominant_side: str = "right"):
        self.dominant_side = dominant_side.lower()

    def draw_skeleton(
        self,
        frame: np.ndarray,
        landmarks_2d: Dict[str, Tuple[int, int]],
        metrics: Optional[KinematicFrameMetrics] = None
    ) -> np.ndarray:
        """
        Draws biomechanical stick figure with color-coded joints based on kinematics.
        """
        is_illegal = metrics.is_illegal_extension if metrics else False
        base_color = self.COLOR_RED if is_illegal else self.COLOR_GREEN

        # Draw bones / connections
        for p1_name, p2_name in self.CONNECTIONS:
            if p1_name in landmarks_2d and p2_name in landmarks_2d:
                pt1 = landmarks_2d[p1_name]
                pt2 = landmarks_2d[p2_name]
                
                # Check if this bone is the active bowling/shooting arm
                is_active_arm = (self.dominant_side in p1_name and self.dominant_side in p2_name)
                bone_color = base_color if is_active_arm else (180, 180, 180)
                thickness = 3 if is_active_arm else 2

                cv2.line(frame, pt1, pt2, bone_color, thickness, cv2.LINE_AA)

        # Draw joint nodes
        for name, pt in landmarks_2d.items():
            if name == "nose":
                continue
            
            is_active_joint = self.dominant_side in name
            joint_color = base_color if is_active_joint else self.COLOR_CYAN
            radius = 6 if is_active_joint else 4

            cv2.circle(frame, pt, radius + 2, (0, 0, 0), -1, cv2.LINE_AA)
            cv2.circle(frame, pt, radius, joint_color, -1, cv2.LINE_AA)

        # Draw angle callout next to the active elbow
        active_elbow_key = f"{self.dominant_side}_elbow"
        if active_elbow_key in landmarks_2d and metrics:
            elbow_pt = landmarks_2d[active_elbow_key]
            angle = metrics.elbow_angle_right if self.dominant_side == "right" else metrics.elbow_angle_left
            
            label = f"{int(angle)} deg"
            cv2.putText(
                frame,
                label,
                (elbow_pt[0] + 12, elbow_pt[1] - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 0, 0),
                3,
                cv2.LINE_AA
            )
            cv2.putText(
                frame,
                label,
                (elbow_pt[0] + 12, elbow_pt[1] - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                base_color,
                1,
                cv2.LINE_AA
            )

        return frame

    def draw_hud(
        self,
        frame: np.ndarray,
        fps: float,
        metrics: Optional[KinematicFrameMetrics],
        shot_stats: Optional[Dict[str, Any]] = None,
        performance_index: float = 85.0
    ) -> np.ndarray:
        """
        Renders sleek futuristic HUD overlay banner with performance telemetry.
        """
        h, w, _ = frame.shape

        # Top Banner Background (Semi-transparent dark bar)
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 68), self.COLOR_BG_DARK, -1)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
        cv2.line(frame, (0, 68), (w, 68), (40, 55, 75), 1, cv2.LINE_AA)

        # HUD Section 1: Title & FPS
        cv2.putText(frame, "SPORTTRACK VISION AI", (16, 26), cv2.FONT_HERSHEY_DUPLEX, 0.65, self.COLOR_CYAN, 1, cv2.LINE_AA)
        cv2.putText(frame, f"FPS: {fps:.1f} | 3D Markerless", (16, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 180, 200), 1, cv2.LINE_AA)

        # HUD Section 2: Biomechanics Telemetry
        if metrics:
            elbow_ang = metrics.elbow_angle_right if self.dominant_side == "right" else metrics.elbow_angle_left
            knee_ang = metrics.knee_angle_right if self.dominant_side == "right" else metrics.knee_angle_left
            
            # Elbow angle & delta
            cv2.putText(frame, "ELBOW ANGLE", (250, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (140, 160, 180), 1, cv2.LINE_AA)
            elbow_color = self.COLOR_RED if metrics.is_illegal_extension else self.COLOR_GREEN
            cv2.putText(frame, f"{elbow_ang:.1f} deg", (250, 52), cv2.FONT_HERSHEY_DUPLEX, 0.65, elbow_color, 1, cv2.LINE_AA)

            # Extension Delta / State
            cv2.putText(frame, "ARM EXTENSION", (400, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (140, 160, 180), 1, cv2.LINE_AA)
            delta_str = f"Δ {metrics.extension_delta:.1f} deg"
            delta_color = self.COLOR_RED if metrics.extension_delta > 15.0 else self.COLOR_GREEN
            cv2.putText(frame, delta_str, (400, 52), cv2.FONT_HERSHEY_DUPLEX, 0.65, delta_color, 1, cv2.LINE_AA)

            # Knee Angle
            cv2.putText(frame, "KNEE FLEX", (560, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (140, 160, 180), 1, cv2.LINE_AA)
            cv2.putText(frame, f"{knee_ang:.1f} deg", (560, 52), cv2.FONT_HERSHEY_DUPLEX, 0.65, self.COLOR_CYAN, 1, cv2.LINE_AA)

        # HUD Section 3: Shot Counts & Performance Index (Right aligned)
        if shot_stats:
            made = shot_stats.get("made_shots", 0)
            total = shot_stats.get("total_shots", 0)
            acc = shot_stats.get("accuracy_percentage", 0.0)

            x_shots = max(w - 360, 700)
            cv2.putText(frame, "SHOT ACCURACY", (x_shots, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (140, 160, 180), 1, cv2.LINE_AA)
            cv2.putText(frame, f"{made}/{total} ({acc:.0f}%)", (x_shots, 52), cv2.FONT_HERSHEY_DUPLEX, 0.65, self.COLOR_PURPLE, 1, cv2.LINE_AA)

        # PI Score Badge
        x_pi = max(w - 150, 880)
        cv2.putText(frame, "PERF. INDEX", (x_pi, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (140, 160, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, f"PI {performance_index:.0f}", (x_pi, 52), cv2.FONT_HERSHEY_DUPLEX, 0.75, self.COLOR_GREEN, 2, cv2.LINE_AA)

        # Bottom Banner Alert for Illegal Extension (> 15 deg)
        if metrics and metrics.is_illegal_extension:
            bot_overlay = frame.copy()
            cv2.rectangle(bot_overlay, (0, h - 50), (w, h), (0, 0, 180), -1)
            cv2.addWeighted(bot_overlay, 0.8, frame, 0.2, 0, frame)
            
            alert_text = f"⚠️ ILLEGAL EXTENSION FLAGGED: Arm Straightening Exceeded 15.0 deg (Current: {metrics.extension_delta:.1f} deg)"
            cv2.putText(frame, alert_text, (max(20, int(w * 0.1)), h - 18), cv2.FONT_HERSHEY_DUPLEX, 0.65, self.COLOR_WHITE, 1, cv2.LINE_AA)

        return frame

    def draw_target_and_trajectory(
        self,
        frame: np.ndarray,
        target_box: Tuple[float, float, float, float],
        trajectory_pts: List[Tuple[int, int]],
        recent_outcome: Optional[str] = None
    ) -> np.ndarray:
        """
        Renders target hoop / wicket zone and glowing flight trajectory trail.
        """
        h, w, _ = frame.shape
        xmin, ymin, xmax, ymax = target_box
        x1, y1 = int(xmin * w), int(ymin * h)
        x2, y2 = int(xmax * w), int(ymax * h)

        # Draw Target Box (e.g. Hoop / Target Area)
        cv2.rectangle(frame, (x1, y1), (x2, y2), self.COLOR_PURPLE, 2, cv2.LINE_AA)
        cv2.putText(frame, "TARGET ZONE", (x1 + 6, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.45, self.COLOR_PURPLE, 1, cv2.LINE_AA)

        # Draw Trajectory Arc Trail
        if len(trajectory_pts) > 1:
            for i in range(1, len(trajectory_pts)):
                thickness = int(np.sqrt(24 / float(len(trajectory_pts) - i + 1))) * 2
                cv2.line(frame, trajectory_pts[i - 1], trajectory_pts[i], self.COLOR_CYAN, max(1, thickness), cv2.LINE_AA)

        # Draw Made/Missed Outcome Splash
        if recent_outcome:
            splash_color = self.COLOR_GREEN if recent_outcome == "Made" else self.COLOR_RED
            text = f"SHOT {recent_outcome.upper()}!"
            cv2.putText(frame, text, (int(w * 0.42), int(h * 0.35)), cv2.FONT_HERSHEY_DUPLEX, 1.2, (0, 0, 0), 4, cv2.LINE_AA)
            cv2.putText(frame, text, (int(w * 0.42), int(h * 0.35)), cv2.FONT_HERSHEY_DUPLEX, 1.2, splash_color, 2, cv2.LINE_AA)

        return frame

