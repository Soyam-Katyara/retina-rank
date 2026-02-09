import cv2
import numpy as np
from collections import deque
import time
import urllib.request
import os

# Download the face landmarker model if not present
MODEL_PATH = "face_landmarker.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

if not os.path.exists(MODEL_PATH):
    print("Downloading face landmarker model...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("Download complete!")

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Eye landmark indices for MediaPipe Face Landmarker
# Left eye
LEFT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
LEFT_IRIS = [474, 475, 476, 477]

# Right eye
RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
RIGHT_IRIS = [469, 470, 471, 472]

# Eye corners
LEFT_EYE_INNER = 362
LEFT_EYE_OUTER = 263
RIGHT_EYE_INNER = 133
RIGHT_EYE_OUTER = 33


class FocusTracker:
    def __init__(self, history_size=30):
        self.gaze_history = deque(maxlen=history_size)
        self.focus_history = deque(maxlen=history_size)
        self.last_focus_time = time.time()
        self.total_focused_time = 0
        self.session_start = time.time()

    def get_landmark_point(self, landmarks, idx, img_w, img_h):
        """Get a landmark point as numpy array."""
        return np.array([
            int(landmarks[idx].x * img_w),
            int(landmarks[idx].y * img_h)
        ])

    def get_iris_center(self, landmarks, iris_indices, img_w, img_h):
        """Calculate the center of the iris."""
        iris_points = []
        for idx in iris_indices:
            point = self.get_landmark_point(landmarks, idx, img_w, img_h)
            iris_points.append(point)
        iris_points = np.array(iris_points)
        center = iris_points.mean(axis=0).astype(int)
        return center

    def calculate_gaze_ratio(self, iris_center, inner_corner, outer_corner):
        """Calculate gaze ratio (0-1)."""
        eye_width = np.linalg.norm(outer_corner - inner_corner)
        if eye_width == 0:
            return 0.5
        iris_to_inner = np.linalg.norm(iris_center - inner_corner)
        ratio = iris_to_inner / eye_width
        return np.clip(ratio, 0, 1)

    def calculate_focus_level(self, left_ratio, right_ratio):
        """Calculate focus level based on gaze ratios."""
        ideal_ratio = 0.5
        left_deviation = abs(left_ratio - ideal_ratio)
        right_deviation = abs(right_ratio - ideal_ratio)
        avg_deviation = (left_deviation + right_deviation) / 2
        focus = max(0, 1 - (avg_deviation * 2.5)) * 100
        return focus

    def get_focus_status(self, focus_level):
        """Return focus status based on focus level."""
        if focus_level >= 80:
            return "HIGHLY FOCUSED", (0, 255, 0)
        elif focus_level >= 60:
            return "FOCUSED", (0, 200, 100)
        elif focus_level >= 40:
            return "PARTIALLY FOCUSED", (0, 255, 255)
        elif focus_level >= 20:
            return "DISTRACTED", (0, 165, 255)
        else:
            return "NOT FOCUSED", (0, 0, 255)

    def update(self, focus_level):
        """Update focus tracking history."""
        current_time = time.time()
        self.focus_history.append(focus_level)
        if focus_level >= 60:
            self.total_focused_time += current_time - self.last_focus_time
        self.last_focus_time = current_time

    def get_average_focus(self):
        """Get average focus over recent history."""
        if len(self.focus_history) == 0:
            return 0
        return sum(self.focus_history) / len(self.focus_history)

    def get_session_stats(self):
        """Get session statistics."""
        session_duration = time.time() - self.session_start
        focus_percentage = (self.total_focused_time / session_duration * 100) if session_duration > 0 else 0
        return session_duration, focus_percentage


def draw_eye_landmarks(frame, landmarks, eye_indices, iris_indices, img_w, img_h, color=(0, 255, 0)):
    """Draw eye contour and iris."""
    eye_points = []
    for idx in eye_indices:
        x = int(landmarks[idx].x * img_w)
        y = int(landmarks[idx].y * img_h)
        eye_points.append([x, y])
    eye_points = np.array(eye_points, dtype=np.int32)
    cv2.polylines(frame, [eye_points], True, color, 1)

    iris_points = []
    for idx in iris_indices:
        x = int(landmarks[idx].x * img_w)
        y = int(landmarks[idx].y * img_h)
        iris_points.append([x, y])
    iris_points = np.array(iris_points, dtype=np.int32)

    iris_center = iris_points.mean(axis=0).astype(int)
    iris_radius = int(np.linalg.norm(iris_points[0] - iris_points[2]) / 2)

    cv2.circle(frame, tuple(iris_center), iris_radius, (255, 0, 255), 1)
    cv2.circle(frame, tuple(iris_center), 2, (255, 0, 255), -1)

    return iris_center


def draw_focus_bar(frame, focus_level, x, y, width, height):
    """Draw a focus level bar."""
    cv2.rectangle(frame, (x, y), (x + width, y + height), (50, 50, 50), -1)
    cv2.rectangle(frame, (x, y), (x + width, y + height), (100, 100, 100), 2)

    fill_width = int((focus_level / 100) * width)

    if focus_level >= 80:
        color = (0, 255, 0)
    elif focus_level >= 60:
        color = (0, 200, 100)
    elif focus_level >= 40:
        color = (0, 255, 255)
    elif focus_level >= 20:
        color = (0, 165, 255)
    else:
        color = (0, 0, 255)

    if fill_width > 0:
        cv2.rectangle(frame, (x, y), (x + fill_width, y + height), color, -1)


def main():
    # Create face landmarker
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
        num_faces=1
    )
    detector = vision.FaceLandmarker.create_from_options(options)

    # Initialize webcam
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    if not cap.isOpened():
        print("Error: Could not open webcam")
        return

    tracker = FocusTracker()

    print("Eye Focus Tracker Started")
    print("Press 'q' to quit")
    print("-" * 40)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame")
            break

        frame = cv2.flip(frame, 1)
        img_h, img_w = frame.shape[:2]

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        results = detector.detect(mp_image)

        focus_level = 0
        status = "NO FACE DETECTED"
        status_color = (128, 128, 128)

        if results.face_landmarks and len(results.face_landmarks) > 0:
            landmarks = results.face_landmarks[0]

            # Check if we have enough landmarks (need iris landmarks)
            if len(landmarks) > max(LEFT_IRIS + RIGHT_IRIS):
                left_iris_center = tracker.get_iris_center(landmarks, LEFT_IRIS, img_w, img_h)
                right_iris_center = tracker.get_iris_center(landmarks, RIGHT_IRIS, img_w, img_h)

                left_inner = tracker.get_landmark_point(landmarks, LEFT_EYE_INNER, img_w, img_h)
                left_outer = tracker.get_landmark_point(landmarks, LEFT_EYE_OUTER, img_w, img_h)
                right_inner = tracker.get_landmark_point(landmarks, RIGHT_EYE_INNER, img_w, img_h)
                right_outer = tracker.get_landmark_point(landmarks, RIGHT_EYE_OUTER, img_w, img_h)

                left_ratio = tracker.calculate_gaze_ratio(left_iris_center, left_inner, left_outer)
                right_ratio = tracker.calculate_gaze_ratio(right_iris_center, right_inner, right_outer)

                focus_level = tracker.calculate_focus_level(left_ratio, right_ratio)
                tracker.update(focus_level)

                smoothed_focus = tracker.get_average_focus()
                status, status_color = tracker.get_focus_status(smoothed_focus)

                draw_eye_landmarks(frame, landmarks, LEFT_EYE, LEFT_IRIS, img_w, img_h)
                draw_eye_landmarks(frame, landmarks, RIGHT_EYE, RIGHT_IRIS, img_w, img_h)

                cv2.line(frame, tuple(left_inner), tuple(left_outer), (255, 255, 0), 1)
                cv2.line(frame, tuple(right_inner), tuple(right_outer), (255, 255, 0), 1)

        # Create overlay panel
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (300, 160), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.7, frame, 0.3, 0)

        cv2.putText(frame, "EYE FOCUS TRACKER", (20, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        avg_focus = tracker.get_average_focus()
        cv2.putText(frame, f"Focus Level: {avg_focus:.1f}%", (20, 65),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        draw_focus_bar(frame, avg_focus, 20, 75, 260, 20)

        cv2.putText(frame, f"Status: {status}", (20, 115),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, status_color, 2)

        session_duration, session_focus = tracker.get_session_stats()
        cv2.putText(frame, f"Session: {session_duration:.0f}s | Focused: {session_focus:.1f}%",
                    (20, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)

        cv2.putText(frame, "Press 'q' to quit", (img_w - 150, img_h - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

        cv2.imshow("Eye Focus Tracker", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    session_duration, session_focus = tracker.get_session_stats()
    print("\n" + "=" * 40)
    print("SESSION SUMMARY")
    print("=" * 40)
    print(f"Total Duration: {session_duration:.1f} seconds")
    print(f"Time Focused: {tracker.total_focused_time:.1f} seconds")
    print(f"Focus Percentage: {session_focus:.1f}%")
    print("=" * 40)


if __name__ == "__main__":
    main()


#source venv/bin/activate && python focus-level.py
