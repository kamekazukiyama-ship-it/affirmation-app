const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

/**
 * Jimp v1.6.x 完全対応版
 * 1. resizeの引数を数値で確実に渡す
 * 2. writeがPromiseを返すのを正しくawaitする
 */

const image_paths = [
    "C:\\antigravity\\AppStore_PERFECT\\1_Home_Perfect.jpg",
    "C:\\antigravity\\AppStore_PERFECT\\2_Player_Perfect.jpg",
    "C:\\antigravity\\AppStore_PERFECT\\3_Generate_Perfect.jpg",
    "C:\\antigravity\\AppStore_PERFECT\\4_Marketing_Subconscious_Perfect.jpg",
    "C:\\antigravity\\AppStore_PERFECT\\5_Marketing_Philosophy_Perfect.jpg",
    "C:\\Users\\kamek\\.gemini\\antigravity\\brain\\9d8d6805-eb6d-40d0-884a-5216fe515f20\\app_feature_graphic_1774950217732.png"
];

const file_names = [
    "1_Home_fixed.png",
    "2_Player_fixed.png",
    "3_Generate_fixed.png",
    "4_Marketing_Subconscious_fixed.png",
    "5_Marketing_Philosophy_fixed.png",
    "Feature_Graphic_AI.png"
];

const output_dir = "C:\\PlayStore_Android";

async function run() {
    console.log(`--- アセット生成開始 (Jimp v1.6対応版) ---`);
    
    if (!fs.existsSync(output_dir)) {
        fs.mkdirSync(output_dir, { recursive: true });
    }

    for (let i = 0; i < image_paths.length; i++) {
        const src = image_paths[i];
        const dest = path.join(output_dir, file_names[i]);
        
        try {
            console.log(`[${i+1}/6] 処理中: ${path.basename(src)}`);
            const image = await Jimp.read(src);
            
            // 数値として確実に渡す
            const w = i === 5 ? 1024 : 1284;
            const h = i === 5 ? 500 : 2778;

            console.log(`    リサイズ実行: ${w}x${h}`);
            // Jimp v1.6 の修正: オブジェクトで指定
            image.resize({ width: w, height: h });
            
            console.log(`    ファイルを書き出し中: ${dest}`);
            // Jimp v1.6 の write は Promise を返す
            await image.write(dest);
            console.log(`    完了!`);
        } catch (e) {
            console.error(`    [!] エラー: ${src}`);
            console.error(e);
        }
    }
    
    console.log("--- 全画像生成完了！ ---");
}

run();
