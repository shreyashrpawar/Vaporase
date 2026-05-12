from PIL import Image
import os

img_path = '/home/shreyash/.gemini/antigravity/brain/c2b25a7e-ae26-4ddb-845d-c1a718efa4f2/.tempmediaStorage/media_c2b25a7e-ae26-4ddb-845d-c1a718efa4f2_1778468760803.png'
img = Image.open(img_path)
w, h = img.size

# It's 1920x961. Let's just crop a 800x800 square from the right side (probably the second icon).
# Assuming 2x1 or 2x2 layout, the top-right or right icon is usually around x=1440 (if 4 in row) or x=1440, y=480 (if 2x1).
# If it's a 2x2 grid, 1920x961 is roughly 2x1. So it must be 2 columns, 1 row! Wait... 
# I will just crop x=w//2 + w//8 to w - w//8, y=h//8 to h - h//8
box = (w//2 + 50, 50, w - 50, h - 50)
cropped = img.crop(box)

# make it square
cw, ch = cropped.size
size = min(cw, ch)
left = (cw - size)/2
top = (ch - size)/2
square = cropped.crop((left, top, left+size, top+size))

os.makedirs('ilusion_app/assets', exist_ok=True)
square.save('ilusion_app/assets/app_icon.png')
print(f"Saved to ilusion_app/assets/app_icon.png with size {square.size}")
