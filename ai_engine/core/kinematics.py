import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field


@dataclass
class JointPoint3D:
    """Represents a 3D joint coordinate with visibility confidence."""
    x: float
    y: float
    z: float
    visibility: float = 1.0

    def to_numpy(self) -> np.ndarray:
        return np.array([self.x, self.y, self.z], dtype=np.float64)


@dataclass
class KinematicFrameMetrics:
    """Instantaneous kinematic metrics for a single video frame."""
    frame_index: int
    timestamp_ms: float
    elbow_angle_right: float
    elbow_angle_left: float
    knee_angle_right: float
    knee_angle_left: float
    shoulder_angle_right: float
    is_illegal_extension: bool
    extension_delta: float
    arm_state: str  # "FLEXED", "EXTENDING", "RELEASE", "FOLLOW_THROUGH"
    kinetic_velocity_knee: float = 0.0
    kinetic_velocity_elbow: float = 0.0
    kinetic_velocity_wrist: float = 0.0
    landmark_confidence: float = 0.0


class BiomechanicsCalculator:
    """
    Precision Biomechanics Engine for markerless 3D joint angle calculation,
    kinetic chain velocity tracking, and illegal extension verification.
    """

    ILLEGAL_EXTENSION_THRESHOLD_DEG = 15.0  # ICC / Standard Field Sports threshold

    def __init__(self, dominant_side: str = "right"):
        self.dominant_side = dominant_side.lower()
        self.history: List[KinematicFrameMetrics] = []
        self.min_elbow_angle_in_action: float = 180.0
        self.max_elbow_angle_in_action: float = 0.0
        self.is_in_delivery_action: bool = False
        self.current_extension_delta: float = 0.0
        self.action_history: List[float] = []

    @staticmethod
    def calculate_vector_angle_3d(p_a: np.ndarray, p_vertex: np.ndarray, p_c: np.ndarray) -> float:
        """
        Calculates 3D interior angle formed by vertex:
        theta = arccos((V_BA . V_BC) / (||V_BA|| * ||V_BC||))

        Args:
            p_a: Coordinate of first point (e.g., Shoulder)
            p_vertex: Coordinate of vertex (e.g., Elbow)
            p_c: Coordinate of third point (e.g., Wrist)

        Returns:
            Angle in degrees [0.0, 180.0]
        """
        v_ba = p_a - p_vertex
        v_bc = p_c - p_vertex

        norm_ba = np.linalg.norm(v_ba)
        norm_bc = np.linalg.norm(v_bc)

        if norm_ba < 1e-6 or norm_bc < 1e-6:
            return 0.0

        dot_product = np.dot(v_ba, v_bc)
        cosine_similarity = dot_product / (norm_ba * norm_bc)
        cosine_similarity = np.clip(cosine_similarity, -1.0, 1.0)
        
        angle_rad = np.arccos(cosine_similarity)
        return float(np.degrees(angle_rad))

    @staticmethod
    def calculate_elbow_flexion_angle(shoulder: JointPoint3D, elbow: JointPoint3D, wrist: JointPoint3D) -> float:
        """
        Computes Elbow Flexion Angle using the exact formula:
        theta_elbow = arccos((V_SE . V_EW) / (||V_SE|| * ||V_EW||))
        where V_SE = Shoulder - Elbow, V_EW = Wrist - Elbow.
        """
        v_se = shoulder.to_numpy() - elbow.to_numpy()
        v_ew = wrist.to_numpy() - elbow.to_numpy()

        norm_se = np.linalg.norm(v_se)
        norm_ew = np.linalg.norm(v_ew)

        if norm_se < 1e-6 or norm_ew < 1e-6:
            return 0.0

        dot_prod = np.dot(v_se, v_ew)
        cos_theta = np.clip(dot_prod / (norm_se * norm_ew), -1.0, 1.0)
        return float(np.degrees(np.arccos(cos_theta)))

    def evaluate_frame(
        self,
        landmarks_3d: Dict[str, JointPoint3D],
        frame_idx: int,
        fps: float = 30.0
    ) -> KinematicFrameMetrics:
        """
        Evaluates a single frame's 3D landmarks and computes complete kinematics.
        """
        timestamp_ms = (frame_idx / max(fps, 1.0)) * 1000.0
        
        side = self.dominant_side
        sh_key = f"{side}_shoulder"
        el_key = f"{side}_elbow"
        wr_key = f"{side}_wrist"
        hip_key = f"{side}_hip"
        knee_key = f"{side}_knee"
        ank_key = f"{side}_ankle"

        opp_side = "left" if side == "right" else "right"
        opp_sh_key = f"{opp_side}_shoulder"
        opp_el_key = f"{opp_side}_elbow"
        opp_wr_key = f"{opp_side}_wrist"
        opp_hip_key = f"{opp_side}_hip"
        opp_knee_key = f"{opp_side}_knee"
        opp_ank_key = f"{opp_side}_ankle"

        def get_pt(name: str) -> JointPoint3D:
            return landmarks_3d.get(name, JointPoint3D(0, 0, 0, 0.0))

        sh = get_pt(sh_key)
        el = get_pt(el_key)
        wr = get_pt(wr_key)
        hip = get_pt(hip_key)
        knee = get_pt(knee_key)
        ank = get_pt(ank_key)

        opp_sh = get_pt(opp_sh_key)
        opp_el = get_pt(opp_el_key)
        opp_wr = get_pt(opp_wr_key)
        opp_hip = get_pt(opp_hip_key)
        opp_knee = get_pt(opp_knee_key)
        opp_ank = get_pt(opp_ank_key)

        # 1. Elbow flexion angles
        elbow_angle_dom = self.calculate_elbow_flexion_angle(sh, el, wr)
        elbow_angle_opp = self.calculate_elbow_flexion_angle(opp_sh, opp_el, opp_wr)

        # 2. Knee flexion angles
        knee_angle_dom = self.calculate_vector_angle_3d(hip.to_numpy(), knee.to_numpy(), ank.to_numpy())
        knee_angle_opp = self.calculate_vector_angle_3d(opp_hip.to_numpy(), opp_knee.to_numpy(), opp_ank.to_numpy())

        # 3. Shoulder elevation angle
        shoulder_angle_dom = self.calculate_vector_angle_3d(hip.to_numpy(), sh.to_numpy(), el.to_numpy())

        # 4. Action State & Illegal Extension Detection (> 15 degrees straightening)
        is_arm_elevated = (sh.y - el.y) > -0.15 or shoulder_angle_dom > 70.0
        
        arm_state = "REST"
        is_illegal = False
        extension_delta = 0.0

        if is_arm_elevated:
            if not self.is_in_delivery_action:
                self.is_in_delivery_action = True
                self.min_elbow_angle_in_action = elbow_angle_dom
                self.max_elbow_angle_in_action = elbow_angle_dom
                self.action_history = []
                arm_state = "FLEXED"
            else:
                self.min_elbow_angle_in_action = min(self.min_elbow_angle_in_action, elbow_angle_dom)
                self.max_elbow_angle_in_action = max(self.max_elbow_angle_in_action, elbow_angle_dom)
                self.action_history.append(elbow_angle_dom)
                
                extension_delta = max(0.0, self.max_elbow_angle_in_action - self.min_elbow_angle_in_action)
                self.current_extension_delta = extension_delta

                if extension_delta > self.ILLEGAL_EXTENSION_THRESHOLD_DEG:
                    is_illegal = True
                    arm_state = "ILLEGAL_EXTENSION"
                elif elbow_angle_dom > 150.0:
                    arm_state = "RELEASE"
                else:
                    arm_state = "EXTENDING"
        else:
            if self.is_in_delivery_action and len(self.action_history) > 3:
                arm_state = "FOLLOW_THROUGH"
                extension_delta = self.current_extension_delta
                is_illegal = extension_delta > self.ILLEGAL_EXTENSION_THRESHOLD_DEG
            self.is_in_delivery_action = False

        # 5. Angular velocities (deg/s)
        dt = 1.0 / max(fps, 1.0)
        v_knee = 0.0
        v_elbow = 0.0
        v_wrist = 0.0

        if len(self.history) > 0:
            prev = self.history[-1]
            v_knee = abs(knee_angle_dom - (prev.knee_angle_right if side == "right" else prev.knee_angle_left)) / dt
            v_elbow = abs(elbow_angle_dom - (prev.elbow_angle_right if side == "right" else prev.elbow_angle_left)) / dt
            v_wrist = np.linalg.norm(wr.to_numpy() - get_pt(wr_key).to_numpy()) / dt

        avg_conf = float(np.mean([sh.visibility, el.visibility, wr.visibility, knee.visibility, hip.visibility]))

        metrics = KinematicFrameMetrics(
            frame_index=frame_idx,
            timestamp_ms=timestamp_ms,
            elbow_angle_right=elbow_angle_dom if side == "right" else elbow_angle_opp,
            elbow_angle_left=elbow_angle_opp if side == "right" else elbow_angle_dom,
            knee_angle_right=knee_angle_dom if side == "right" else knee_angle_opp,
            knee_angle_left=knee_angle_opp if side == "right" else knee_angle_dom,
            shoulder_angle_right=shoulder_angle_dom,
            is_illegal_extension=is_illegal,
            extension_delta=round(extension_delta, 2),
            arm_state=arm_state,
            kinetic_velocity_knee=round(v_knee, 2),
            kinetic_velocity_elbow=round(v_elbow, 2),
            kinetic_velocity_wrist=round(v_wrist, 2),
            landmark_confidence=round(avg_conf, 3),
        )

        self.history.append(metrics)
        return metrics

    def reset_session(self):
        self.history = []
        self.min_elbow_angle_in_action = 180.0
        self.max_elbow_angle_in_action = 0.0
        self.is_in_delivery_action = False
        self.current_extension_delta = 0.0
        self.action_history = []

