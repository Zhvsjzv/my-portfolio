import cv2


def main() -> None:
	face_cascade = cv2.CascadeClassifier(
		cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
	)

	camera = cv2.VideoCapture(0)

	if not camera.isOpened():
		raise RuntimeError("Could not open the default webcam.")

	while True:
		success, frame = camera.read()
		if not success:
			break

		gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
		faces = face_cascade.detectMultiScale(
			gray_frame,
			scaleFactor=1.1,
			minNeighbors=5,
			minSize=(30, 30),
		)

		for x, y, width, height in faces:
			face_region = frame[y : y + height, x : x + width]
			blurred_face = cv2.GaussianBlur(face_region, (99, 99), 30)
			frame[y : y + height, x : x + width] = blurred_face

		cv2.imshow("Face Blur", frame)

		if cv2.waitKey(1) & 0xFF == ord("q"):
			break

	camera.release()
	cv2.destroyAllWindows()


if __name__ == "__main__":
	main()
