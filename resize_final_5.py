from PIL import Image
import os

# ユーザーが最後に送ってくれた5枚の画像ID（メディアパス）を指定
image_paths = [
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\media__1774854692517.png", # 実画面：ホーム
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\media__1774855295144.png", # 実画面：プレイヤー
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\media__1774855505277.png", # 実画面：AI生成
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\media__1774855965401.png", # マーケティング：AI哲学
    r"C:\Users\kamek\.gemini\antigravity\brain\bf71c092-5b3b-4320-a980-b69c8476dc4c\media__1774856434699.png"  # マーケティング：メインコンセプト
]

target_width = 1284
target_height = 2778

# OneDriveを避けた直接の保存場所
output_dir = r"C:\AppStoreFinal"

if not os.path.exists(output_dir):
    try:
        os.makedirs(output_dir)
    except Exception:
        # C直下がダメな場合はユーザーのAppDataなど別ルート
        output_dir = os.path.join(os.environ['USERPROFILE'], 'AppStoreFinal')
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

file_names = [
    "1_Real_Home.png",
    "2_Real_Player.png",
    "3_Real_Generate.png",
    "4_Marketing_AI.png",
    "5_Marketing_Concept.png"
]

for i, path in enumerate(image_paths):
    img = Image.open(path)
    # 元画像がアルファチャンネル（透明度）を持っているかもしれないのでRGBに変換
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    img_resized = img.resize((target_width, target_height), Image.LANCZOS)
    
    output_path = os.path.join(output_dir, file_names[i])
    img_resized.save(output_path, "PNG")
    print(f"Resized and saved: {output_path}")
