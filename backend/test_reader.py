import cv2
from main import ScaleReader
from preprocessing import full_pipeline, locate_digits_band
from digit_segment import DigitSegmenter

img = cv2.imread('debug_warped.jpg')
if img is None:
    print("No image")
    exit(1)

reader = ScaleReader()
# simulate API override
reader._block_size = 35
reader._c_value = 15
reader._clahe_clip = 3.0
reader.shear_angle = 0.0

binary = reader.preprocess(img)
tokens = reader.segment_digits(binary)
print("Tokens:", [(t.kind, t.bbox) for t in tokens])
text, conf, chars = reader.recognize_digits(img, tokens)
print("Recognize:", text, conf, chars)
