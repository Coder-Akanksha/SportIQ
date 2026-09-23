import os
import cv2
import numpy as np
import math


def generate_sample_sports_video(output_path: str = "sample_data/sample_sports_clip.mp4", duration_sec: int = 8, fps: int = 30):
    """
    Generates a high-quality synthetic sports video clip showing a player
    performing shooting and bowling biomechanics with ball physics and target hoop.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    width, height = 1280, 720
    total_frames = duration_sec * fps
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, float(fps), (width, height))

    # Hoop position
    hoop_x, hoop_y = int(width * 0.82), int(height * 0.28)

    for i in range(total_frames):
        # Create athletic court background
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Floor gradient (hardwood gym court)
        for y in range(height):
            ratio = y / height
            if y > height * 0.55:
                # Polished wood floor
                b = int(35 + ratio * 20)
                g = int(75 + ratio * 40)
                r = int(140 + ratio * 60)
            else:
                # Arena background
                b = int(25 - ratio * 10)
                g = int(20 - ratio * 8)
                r = int(15 - ratio * 5)
            frame[y, :] = (b, g, r)

        # Draw Court Lines
        cv2.line(frame, (0, int(height * 0.55)), (width, int(height * 0.55)), (180, 180, 180), 2)
        cv2.ellipse(frame, (hoop_x, int(height * 0.55)), (260, 120), 0, 0, 180, (200, 200, 200), 2)

        # Draw Basketball Hoop / Backboard
        cv2.rectangle(frame, (hoop_x - 10, hoop_y - 80), (hoop_x + 10, hoop_y + 40), (220, 220, 220), -1)
        cv2.line(frame, (hoop_x - 45, hoop_y), (hoop_x + 10, hoop_y), (30, 80, 230), 4)  # Rim (Orange)
        cv2.circle(frame, (hoop_x - 20, hoop_y), 24, (30, 80, 230), 3)

        # Player Animation Kinematics (Shooter positioned at x: 380)
        phase = (i % 90) / 90.0  # 3-second repeated shooting cycle
        
        # Base player root position
        px = int(width * 0.30)
        
        # Knee Dip & Jump (Kinetic Chain timing)
        if phase < 0.35:
            # Preparation / Knee Dip
            knee_flex = math.sin(phase / 0.35 * math.pi) * 35
            jump_offset = -knee_flex * 0.6
            arm_elevation = phase / 0.35 * 60.0
            elbow_flex = 90.0 + (phase / 0.35 * 30.0)
            ball_held = True
        elif phase < 0.50:
            # Upward Drive & Release
            jump_ratio = (phase - 0.35) / 0.15
            jump_offset = -30 - (jump_ratio * 45)
            arm_elevation = 60.0 + (jump_ratio * 70.0)
            elbow_flex = 120.0 + (jump_ratio * 40.0)  # Straightening to ~160 deg
            ball_held = jump_ratio < 0.8
        else:
            # Landing & Follow-Through
            land_ratio = (phase - 0.50) / 0.50
            jump_offset = -75 + (land_ratio * 75)
            arm_elevation = 130.0 - (land_ratio * 70.0)
            elbow_flex = 160.0 - (land_ratio * 70.0)
            ball_held = False

        py = int(height * 0.52 + jump_offset)

        # Body Keypoints
        head_pos = (px, py - 180)
        sh_pos = (px, py - 140)
        hip_pos = (px, py - 70)
        knee_pos = (px - 15, py)
        ankle_pos = (px - 10, py + 70)

        # Shooting Arm (Right)
        arm_rad = math.radians(arm_elevation)
        el_pos = (int(sh_pos[0] + 35 * math.cos(arm_rad - 0.5)), int(sh_pos[1] - 45 * math.sin(arm_rad)))
        wr_pos = (int(el_pos[0] + 40 * math.cos(arm_rad)), int(el_pos[1] - 40 * math.sin(arm_rad)))

        # Draw Player Silhouette / Stick Figure
        # Head
        cv2.circle(frame, head_pos, 22, (200, 180, 160), -1)
        # Torso
        cv2.line(frame, sh_pos, hip_pos, (50, 120, 220), 16)
        # Legs
        cv2.line(frame, hip_pos, knee_pos, (40, 40, 40), 10)
        cv2.line(frame, knee_pos, ankle_pos, (40, 40, 40), 8)
        # Non-dominant Arm
        cv2.line(frame, sh_pos, (sh_pos[0] - 25, sh_pos[1] + 30), (50, 120, 220), 8)
        # Dominant Shooting Arm
        cv2.line(frame, sh_pos, el_pos, (200, 180, 160), 10)
        cv2.line(frame, el_pos, wr_pos, (200, 180, 160), 8)

        # Ball Flight & Physics
        if ball_held:
            ball_x = wr_pos[0] + 12
            ball_y = wr_pos[1] - 12
        else:
            # Parabolic trajectory from release point to hoop
            flight_t = (phase - 0.47) / 0.38
            if 0.0 <= flight_t <= 1.0:
                ball_x = int(px + 45 + flight_t * (hoop_x - px - 65))
                # Parabola y = 4 * H * t * (1 - t)
                apex_height = 220
                ball_y = int(py - 180 + (flight_t * (hoop_y - (py - 180))) - (4 * apex_height * flight_t * (1 - flight_t)))
            else:
                ball_x = hoop_x - 20
                ball_y = hoop_y + int((phase - 0.85) * 400) if phase > 0.85 else hoop_y

        # Draw Basketball
        cv2.circle(frame, (ball_x, ball_y), 16, (20, 110, 235), -1)  # Orange ball
        cv2.circle(frame, (ball_x, ball_y), 16, (0, 0, 0), 2)
        cv2.line(frame, (ball_x - 14, ball_y), (ball_x + 14, ball_y), (0, 0, 0), 1)

        writer.write(frame)

    writer.release()
    print(f"Generated sample sports clip: {output_path} ({total_frames} frames, {width}x{height})")
    return output_path


if __name__ == "__main__":
    generate_sample_sports_video()

