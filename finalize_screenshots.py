from PIL import Image
import os

# 修正版の画像パスを指定
image_paths = [
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\framed_screenshot_1_home_v2_1774865814529.png",
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\framed_screenshot_2_generate_v2_1774865846266.png",
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\framed_screenshot_3_player_v2_1774865879119.png"
]

target_width = 1284
target_height = 2778

output_dir = r"C:\Users\kamek\OneDrive\Desktop\antigravity\store_assets"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for i, path in enumerate(image_paths):
    img = Image.open(path)
    img_resized = img.resize((target_width, target_height), Image.LANCZOS)
    
    output_path = os.path.join(output_dir, f"appstore_screenshot_{i+1}_final.png")
    img_resized.save(output_path, "PNG")
    print(f"Resized: {output_path}")
