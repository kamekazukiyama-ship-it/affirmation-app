from PIL import Image
import os

# 画像のパスを指定
image_paths = [
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\framed_screenshot_1_home_1774864560859.png",
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\framed_screenshot_2_generate_1774864588361.png",
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\framed_screenshot_3_player_1774864618723.png"
]

target_width = 1284
target_height = 2778

output_dir = r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c"

for i, path in enumerate(image_paths):
    img = Image.open(path)
    # アスペクト比を維持しながらリサイズ
    img_resized = img.resize((target_width, target_height), Image.LANCZOS)
    
    output_path = os.path.join(output_dir, f"appstore_screenshot_{i+1}_resized.png")
    img_resized.save(output_path, "PNG")
    print(f"Resized: {output_path}")
