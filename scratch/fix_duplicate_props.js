const fs = require('fs');
const filePath = 'c:\\antigravity\\src\\screens\\GenerateScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The lines 508-511 are:
// 508:             placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"
// 509:             placeholderTextColor={subTextColor}
// 510:             placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"
// 511:             placeholderTextColor={subTextColor}

const target = 'placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"\n            placeholderTextColor={subTextColor}\n            placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"\n            placeholderTextColor={subTextColor}';
const replacement = 'placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"\n            placeholderTextColor={subTextColor}';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully removed duplicate JSX props from GenerateScreen.tsx');
} else {
    // Try with CRLF just in case
    const targetCRLF = target.replace(/\n/g, '\r\n');
    const replacementCRLF = replacement.replace(/\n/g, '\r\n');
    if (content.includes(targetCRLF)) {
        content = content.replace(targetCRLF, replacementCRLF);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Successfully removed duplicate JSX props from GenerateScreen.tsx (CRLF)');
    } else {
        console.error('Target not found in GenerateScreen.tsx. The file might have different whitespace.');
        // Fallback: search for specific duplicate pattern
        const lines = content.split(/\r?\n/);
        const filteredLines = [];
        let skipped = false;
        for (let i = 0; i < lines.length; i++) {
            if (!skipped && i > 0 && lines[i].includes('placeholder=') && lines[i-1].includes('placeholder=')) {
                // skip duplicate placeholder
                skipped = true;
                continue;
            }
            if (skipped && lines[i].includes('placeholderTextColor=')) {
                // skip duplicate color
                skipped = false;
                continue;
            }
            filteredLines.push(lines[i]);
        }
        if (filteredLines.length < lines.length) {
            fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf8');
            console.log('Successfully removed duplicate JSX props via line filtering');
        } else {
            console.error('Could not find duplicate props even with line filtering.');
        }
    }
}
