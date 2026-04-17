const fs = require('fs');
const filePath = 'c:\\antigravity\\src\\screens\\GenerateScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Use regex to find the duplicate placeholder and placeholderTextColor
// This handles any amount of whitespace.
const regex = /(placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"\s+placeholderTextColor=\{subTextColor\})\s+placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"\s+placeholderTextColor=\{subTextColor\}/g;

if (regex.test(content)) {
    const newContent = content.replace(regex, '$1');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully removed duplicate JSX props from GenerateScreen.tsx using Regex');
} else {
    console.error('Regex did not match the duplicate props in GenerateScreen.tsx');
}
