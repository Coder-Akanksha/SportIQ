import unittest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ai_engine.core.kinematics import BiomechanicsCalculator, JointPoint3D
from ai_engine.core.shot_detector import ShotDetector
from ai_engine.core.performance_indexer import PerformanceIndexer


class TestSportTrackKinematics(unittest.TestCase):

    def test_vector_angle_calculation_orthogonal(self):
        """Test 90-degree orthogonal vector angle."""
        p_a = np.array([0.0, 1.0, 0.0])      # Shoulder
        p_vertex = np.array([0.0, 0.0, 0.0]) # Elbow
        p_c = np.array([1.0, 0.0, 0.0])      # Wrist

        angle = BiomechanicsCalculator.calculate_vector_angle_3d(p_a, p_vertex, p_c)
        self.assertAlmostEqual(angle, 90.0, places=2)

    def test_elbow_flexion_formula(self):
        """
        Test theta_elbow = arccos((V_SE . V_EW) / (||V_SE|| * ||V_EW||))
        Straight arm test: Shoulder at (0, 2, 0), Elbow at (0, 1, 0), Wrist at (0, 0, 0)
        V_SE = (0, 1, 0), V_EW = (0, -1, 0) -> Angle = 180 degrees
        """
        sh = JointPoint3D(0.0, 2.0, 0.0)
        el = JointPoint3D(0.0, 1.0, 0.0)
        wr = JointPoint3D(0.0, 0.0, 0.0)

        angle = BiomechanicsCalculator.calculate_elbow_flexion_angle(sh, el, wr)
        self.assertAlmostEqual(angle, 180.0, places=2)

    def test_elbow_flexion_45_degrees(self):
        """Test 45-degree arm flexion."""
        sh = JointPoint3D(0.0, 1.0, 0.0)
        el = JointPoint3D(0.0, 0.0, 0.0)
        wr = JointPoint3D(1.0, 1.0, 0.0)

        angle = BiomechanicsCalculator.calculate_elbow_flexion_angle(sh, el, wr)
        self.assertAlmostEqual(angle, 45.0, places=2)

    def test_illegal_extension_rule(self):
        """Test that arm straightening delta > 15 degrees is flagged."""
        calc = BiomechanicsCalculator(dominant_side="right")
        
        # Frame 1: Arm flexed at shoulder height
        lms_1 = {
            "right_shoulder": JointPoint3D(0.0, 1.0, 0.0),
            "right_elbow": JointPoint3D(0.5, 1.0, 0.0),
            "right_wrist": JointPoint3D(0.5, 0.5, 0.0),
            "right_hip": JointPoint3D(0.0, 0.0, 0.0),
            "right_knee": JointPoint3D(0.0, -0.5, 0.0),
            "right_ankle": JointPoint3D(0.0, -1.0, 0.0),
        }
        m1 = calc.evaluate_frame(lms_1, frame_idx=0)
        self.assertFalse(m1.is_illegal_extension)

        # Frame 2: Arm straightens by 25 degrees (from 90 to 115) -> Should trigger violation
        lms_2 = {
            "right_shoulder": JointPoint3D(0.0, 1.0, 0.0),
            "right_elbow": JointPoint3D(0.5, 1.0, 0.0),
            "right_wrist": JointPoint3D(0.85, 0.7, 0.0),
            "right_hip": JointPoint3D(0.0, 0.0, 0.0),
            "right_knee": JointPoint3D(0.0, -0.5, 0.0),
            "right_ankle": JointPoint3D(0.0, -1.0, 0.0),
        }
        m2 = calc.evaluate_frame(lms_2, frame_idx=1)
        self.assertTrue(m2.is_illegal_extension or m2.extension_delta > 15.0)

    def test_performance_index_weights(self):
        """Test PI = w_acc * Acc + w_elbow * Elbow + w_knee * Knee"""
        indexer = PerformanceIndexer(weight_accuracy=0.40, weight_elbow=0.35, weight_knee=0.25)
        
        # Perfect 100% accuracy, stable 160 deg release, 90 knee timing score
        res = indexer.compute_index(
            accuracy_percentage=100.0,
            elbow_angles_at_release=[160.0, 160.0, 160.0],
            extension_deltas=[8.0, 9.0, 7.5],
            knee_timing_sync_scores=[90.0, 92.0, 88.0],
            illegal_extension_count=0
        )
        self.assertGreaterEqual(res.overall_pi, 90.0)
        self.assertEqual(res.grade, "ELITE")

    def test_shot_counter_statistics(self):
        """Test shot tracking summary calculations."""
        detector = ShotDetector(sport_type="basketball")
        detector.total_shots = 10
        detector.made_shots = 7
        detector.missed_shots = 3
        
        self.assertEqual(detector.accuracy_percentage, 70.0)


if __name__ == "__main__":
    unittest.main()

