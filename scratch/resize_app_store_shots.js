const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = 'C:\\Users\\kamek\\.gemini\\antigravity\\brain\\9d8d6805-eb6d-40d0-884a-5216fe515f20\\';
const DEST_BASE = 'c:\\antigravity\\AppStore_PERFECT\\';

const SOURCES = [
  { name: '01_Multilingual_1.png', src: 'multilingual_feature_screen_1776401530367.png' },
  { name: '02_Multilingual_2.png', src: 'multilingual_player_screen_v2_1776401588850.png' },
  { name: '03_Home_EN.png', src: 'media__1776401248678.png' },
  { name: '04_Player_EN.png', src: 'media__1776401248709.png' },
  { name: '05_AI_Create_EN.png', src: 'media__1776401355245.png' }
];

const SIZES = [
  { folder: '6.5_inch_Screenshots', width: 1242, height: 2688 },
  { folder: '6.7_inch_Screenshots', width: 1290, height: 2796 },
  { folder: 'iPad', width: 2048, height: 2732 }
];

async function resize() {
  for (const size of SIZES) {
    const targetDir = path.join(DEST_BASE, size.folder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    for (const item of SOURCES) {
      const input = path.join(SOURCE_DIR, item.src);
      const output = path.join(targetDir, item.name);
      
      console.log(`Processing ${item.name} for ${size.folder}...`);
      await sharp(input)
        .resize(size.width, size.height, {
          fit: 'contain',
          background: { r: 10, g: 10, b: 26, alpha: 1 } // 背景色に合わせた濃いネイビー
        })
        .png()
        .toFile(output);
    }
  }
  console.log('All resizing complete!');
}

resize().catch(console.error);
