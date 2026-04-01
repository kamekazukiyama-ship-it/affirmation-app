from PIL import Image
import os
import sys

# 本物のソース画像パスを指定 (カズ様の完璧な素材 + AIのフィーチャー画像)
image_paths = [
    r"c:\antigravity\AppStore_PERFECT\1_Home_Perfect.jpg",
    r"c:\antigravity\AppStore_PERFECT\2_Player_Perfect.jpg",
    r"c:\antigravity\AppStore_PERFECT\3_Generate_Perfect.jpg",
    r"c:\antigravity\AppStore_PERFECT\4_Marketing_Subconscious_Perfect.jpg",
    r"c:\antigravity\AppStore_PERFECT\5_Marketing_Philosophy_Perfect.jpg",
    r"C:\Users\kamek\.gemini\antigravity\brain\9d8d6805-eb6d-40d0-884a-5216fe515f20\app_feature_graphic_1774950217732.png"
]

# リサイズ設定
target_width = 1284
target_height = 2778
feature_width = 1024
feature_height = 500

# 出力先を C:\PlayStore_Android に固定
output_dir = r"C:\PlayStore_Android"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

file_names = [
    "1_Home_fixed.png",
    "2_Player_fixed.png",
    "3_Generate_fixed.png",
    "4_Marketing_Subconscious_fixed.png",
    "5_Marketing_Philosophy_fixed.png",
    "Feature_Graphic_AI.png"
]

print(f"--- Pythonによる画像リサイズ開始 ---")
print(f"出力先: {output_dir}")

for i, path in enumerate(image_paths):
    if not os.path.exists(path):
        print(f" [!] ファイルが見つかりません: {path}")
        continue
        
    try:
        print(f" [{i+1}/6] 処理中: {os.path.basename(path)}")
        img = Image.open(path)
        
        # フィーチャーグラフィックだけサイズが異なる
        if i == 5:
            w, h = feature_width, feature_height
        else:
            w, h = target_width, target_height
            
        # リサイズ（LANCZOSは高品質）
        img_resized = img.resize((w, h), Image.Resampling.LANCZOS)
        
        output_path = os.path.join(output_dir, file_names[i])
        # PNGとして保存
        img_resized.save(output_path, "PNG")
        print(f"  -> 保存完了: {output_path}")
    except Exception as e:
        print(f"  [!] エラー発生: {str(e)}")

print("--- すべての画像生成が完了しました！ ---")
