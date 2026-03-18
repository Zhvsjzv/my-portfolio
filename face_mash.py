import os
import time
import urllib.request

import cv2
import mediapipe as mp
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import (
    FaceLandmarker,
    FaceLandmarkerOptions,
    FaceLandmarksConnections,
    drawing_utils,
    drawing_styles,
)

# Download face landmarker model if not already present
MODEL_PATH = os.path.join(os.path.dirname(__file__), "face_landmarker.task")
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "face_landmarker/face_landmarker/float16/1/face_landmarker.task"
)
if not os.path.exists(MODEL_PATH):
    print("Downloading face landmarker model (one-time only)...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("Model downloaded successfully.")

# Configure the face landmarker for video (sequential frames)
base_options = mp.tasks.BaseOptions(model_asset_path=MODEL_PATH)
options = FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    num_faces=2,
)

# Open the default webcam
camera = cv2.VideoCapture(0)
start_time = time.time()

with FaceLandmarker.create_from_options(options) as landmarker:
    while True:
        success, frame = camera.read()
        if not success:
            break

        # Convert BGR frame to RGB for mediapipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        # Detect facial landmarks in the current video frame
        timestamp_ms = int((time.time() - start_time) * 1000)
        result = landmarker.detect_for_video(mp_image, timestamp_ms)

        # Draw mesh and contours for each detected face
        for face_landmarks in result.face_landmarks:
            drawing_utils.draw_landmarks(
                image=frame,
                landmark_list=face_landmarks,
                connections=FaceLandmarksConnections.FACE_LANDMARKS_TESSELATION,
                landmark_drawing_spec=None,
                connection_drawing_spec=drawing_styles.get_default_face_mesh_tesselation_style(),
            )
            drawing_utils.draw_landmarks(
                image=frame,
                landmark_list=face_landmarks,
                connections=FaceLandmarksConnections.FACE_LANDMARKS_CONTOURS,
                landmark_drawing_spec=None,
                connection_drawing_spec=drawing_styles.get_default_face_mesh_contours_style(),
            )

            # Get the y-coordinate of the upper lip (landmark index 13)
            upper_lip_y = face_landmarks[13].y
            # Get the y-coordinate of the lower lip (landmark index 14)
            lower_lip_y = face_landmarks[14].y
            # Calculate the distance between the upper and lower lip
            mouth_distance = abs(lower_lip_y - upper_lip_y)

            # If the distance is greater than 0.03:
            if mouth_distance > 0.03:
                # Draw a text on the frame saying "LIVENESS VERIFIED: MOUTH OPEN" in green color
                cv2.putText(
                    frame,
                    "LIVENESS VERIFIED: MOUTH OPEN",
                    (50, 100),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2,
                )
            else:
                # Draw a text on the frame saying "MOUTH CLOSED" in red color
                cv2.putText(
                    frame,
                    "MOUTH CLOSED",
                    (50, 100),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 0, 255),
                    2,
                )

            # Get the y-coordinate of the right eye top (index 159) and bottom (index 145)
            right_eye_top_y = face_landmarks[159].y
            right_eye_bottom_y = face_landmarks[145].y
            # Calculate the distance for the right eye
            right_eye_distance = abs(right_eye_bottom_y - right_eye_top_y)

            # Get the y-coordinate of the left eye top (index 386) and bottom (index 374)
            left_eye_top_y = face_landmarks[386].y
            left_eye_bottom_y = face_landmarks[374].y
            # Calculate the distance for the left eye
            left_eye_distance = abs(left_eye_bottom_y - left_eye_top_y)

            # If both eye distances are very small (less than 0.015), it means eyes are closed:
            if right_eye_distance < 0.015 and left_eye_distance < 0.015:
                # Draw a text on the frame saying "LIVENESS VERIFIED: BLINK DETECTED" in blue color
                cv2.putText(
                    frame,
                    "LIVENESS VERIFIED: BLINK DETECTED",
                    (50, 150),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (255, 0, 0),
                    2,
                )

        cv2.imshow("Face Mesh AI", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

camera.release()
cv2.destroyAllWindows()
