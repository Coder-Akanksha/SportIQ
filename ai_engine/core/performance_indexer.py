import numpy as np
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class PerformanceIndexResult:
    """Comprehensive Performance Index score breakdown with coaching feedback."""
    overall_pi: float
    grade: str
    accuracy_score: float
    elbow_stability_score: float
    knee_timing_score: float
    illegal_extension_penalty: float
    coaching_insights: List[str]
    biomechanical_rating: Dict[str, str]


class PerformanceIndexer:
    """
    Multi-Factor Performance Index (PI) Engine.
    Synthesizes Shot Accuracy, Elbow Angle Kinematics, and Kinetic Chain Timing
    into an industry-standard performance rating with actionable coaching tips.
    """

    def __init__(
        self,
        weight_accuracy: float = 0.40,
        weight_elbow: float = 0.35,
        weight_knee: float = 0.25,
        target_elbow_angle: float = 160.0
    ):
        self.w_acc = weight_accuracy
        self.w_elbow = weight_elbow
        self.w_knee = weight_knee
        self.target_elbow_angle = target_elbow_angle

    def compute_index(
        self,
        accuracy_percentage: float,
        elbow_angles_at_release: List[float],
        extension_deltas: List[float],
        knee_timing_sync_scores: List[float],
        illegal_extension_count: int = 0
    ) -> PerformanceIndexResult:
        acc_score = float(np.clip(accuracy_percentage, 0.0, 100.0))

        if len(elbow_angles_at_release) > 1:
            angle_variance = float(np.var(elbow_angles_at_release))
            mean_angle = float(np.mean(elbow_angles_at_release))
            angle_error = abs(mean_angle - self.target_elbow_angle)
            
            consistency_penalty = min(35.0, angle_variance * 0.4)
            deviation_penalty = min(35.0, angle_error * 0.8)
            elbow_score = max(20.0, 100.0 - (consistency_penalty + deviation_penalty))
        elif len(elbow_angles_at_release) == 1:
            angle_error = abs(elbow_angles_at_release[0] - self.target_elbow_angle)
            elbow_score = max(30.0, 100.0 - (angle_error * 1.2))
        else:
            elbow_score = 75.0

        if len(knee_timing_sync_scores) > 0:
            knee_score = float(np.clip(np.mean(knee_timing_sync_scores), 20.0, 100.0))
        else:
            knee_score = 80.0

        penalty = min(30.0, illegal_extension_count * 10.0)

        raw_pi = (self.w_acc * acc_score) + (self.w_elbow * elbow_score) + (self.w_knee * knee_score) - penalty
        final_pi = round(float(np.clip(raw_pi, 0.0, 100.0)), 1)

        if final_pi >= 90.0:
            grade = "ELITE"
        elif final_pi >= 80.0:
            grade = "PRO"
        elif final_pi >= 70.0:
            grade = "COMPETENT"
        elif final_pi >= 55.0:
            grade = "DEVELOPING"
        else:
            grade = "NEEDS_REFINEMENT"

        insights = []
        if illegal_extension_count > 0:
            insights.append(
                f"[VIOLATION] Flagged {illegal_extension_count} action(s) with arm extension exceeding 15.0 deg. Maintain a fluid follow-through to comply with sport regulations."
            )
        
        if elbow_score < 70.0:
            insights.append(
                "[MECHANICS] Elbow Release Inconsistency: Your release angle is fluctuating. Focus on establishing a repeatable high set-point."
            )
        else:
            insights.append(
                "[SUCCESS] Excellent Elbow Mechanics: Arm extension stability is within optimal kinetic corridors."
            )

        if knee_score < 75.0:
            insights.append(
                "[TIMING] Kinetic Timing Delay: Initiate lower-body knee extension earlier to smoothly transfer ground reaction force upward."
            )
        else:
            insights.append(
                "[SYNC] Fluid Kinetic Chain: Ground force transfer through hips and shoulders is well-synchronized."
            )

        if acc_score < 60.0:
            insights.append(
                "[ACCURACY] Target Alignment: Align your shooting plane directly through your dominant eye and target center."
            )

        rating_breakdown = {
            "accuracy": "Optimal" if acc_score >= 75 else ("Fair" if acc_score >= 50 else "Suboptimal"),
            "elbow_stability": "Optimal" if elbow_score >= 80 else ("Moderate" if elbow_score >= 65 else "Unstable"),
            "kinetic_sync": "Synchronized" if knee_score >= 80 else ("Slight Lag" if knee_score >= 65 else "Desynchronized"),
            "legality": "Compliant" if illegal_extension_count == 0 else "Violations Detected"
        }

        return PerformanceIndexResult(
            overall_pi=final_pi,
            grade=grade,
            accuracy_score=round(acc_score, 1),
            elbow_stability_score=round(elbow_score, 1),
            knee_timing_score=round(knee_score, 1),
            illegal_extension_penalty=round(penalty, 1),
            coaching_insights=insights,
            biomechanical_rating=rating_breakdown
        )

