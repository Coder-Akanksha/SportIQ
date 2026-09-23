import argparse
import json
import sys
import os

# Ensure root directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from ai_engine.pipeline.video_processor import VideoProcessor
from ai_engine.sample_generator import generate_sample_sports_video


def main():
    parser = argparse.ArgumentParser(description="SportTrack Biomechanics & Vision Analytics CLI")
    parser.add_argument("--input", "-i", type=str, default=None, help="Path to input video file")
    parser.add_argument("--output", "-o", type=str, default=None, help="Path to save annotated video")
    parser.add_argument("--sport", "-s", type=str, default="basketball", choices=["basketball", "cricket_bowling", "tennis_serve"])
    parser.add_argument("--side", type=str, default="right", choices=["right", "left"], help="Dominant player side")
    parser.add_argument("--generate-sample", action="store_true", help="Generate and analyze a synthetic sample sports video")

    args = parser.parse_args()

    input_path = args.input
    if args.generate_sample or not input_path:
        print("Creating synthetic sports video for analysis...")
        sample_path = "sample_data/sample_sports_clip.mp4"
        generate_sample_sports_video(sample_path)
        input_path = sample_path

    if not args.output:
        args.output = f"output/annotated_{os.path.basename(input_path)}"

    print(f"\n=======================================================")
    print(f" SPORTTRACK VISION ANALYTICS - PROCESSING VIDEO")
    print(f" Input Video:    {input_path}")
    print(f" Output Video:   {args.output}")
    print(f" Sport:          {args.sport}")
    print(f" Dominant Arm:   {args.side}")
    print(f"=======================================================\n")

    processor = VideoProcessor(sport_type=args.sport, dominant_side=args.side)
    
    def progress_cb(current, total):
        pct = (current / total) * 100
        sys.stdout.write(f"\rProcessing frame {current}/{total} ({pct:.1f}%) ...")
        sys.stdout.flush()

    summary = processor.process_video_file(input_path, args.output, progress_callback=progress_cb)
    print("\n\nAnalysis Complete!")
    print("\n--- Session Performance Summary ---")
    print(f"Total Frames Processed: {summary['total_frames']} (Avg FPS: {summary['processing_fps']})")
    print(f"Total Shots Detected:   {summary['shot_summary']['total_shots']}")
    print(f"Shots Made / Missed:    {summary['shot_summary']['made_shots']} Made / {summary['shot_summary']['missed_shots']} Missed")
    print(f"Shot Accuracy Ratio:    {summary['shot_summary']['accuracy_percentage']}%")
    
    if summary['final_performance_index']:
        pi = summary['final_performance_index']
        print(f"\n[PERFORMANCE INDEX (PI)]: {pi['overall_pi']} / 100 ({pi['grade']})")
        print(f" - Accuracy Score:         {pi['accuracy_score']}/100")
        print(f" - Elbow Stability Score:  {pi['elbow_stability_score']}/100")
        print(f" - Knee Timing Sync Score: {pi['knee_timing_score']}/100")
        print(f" - Illegal Extensions:     {summary['illegal_extensions_detected']} flagged")
        print("\n[AI Coaching Insights]:")
        for insight in pi['coaching_insights']:
            print(f"   * {insight}")

    json_report_path = args.output.rsplit(".", 1)[0] + "_report.json"
    with open(json_report_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"\nSaved full JSON analytics report to: {json_report_path}")


if __name__ == "__main__":
    main()

