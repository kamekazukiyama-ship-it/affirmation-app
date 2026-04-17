const fs = require('fs');
const path = require('path');

const filePath = 'c:\\antigravity\\src\\screens\\GenerateScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Navigation
content = content.replace(
    "{ text: 'ポイントを購入する', onPress: () => navigation.navigate('Settings') }",
    "{ text: 'ポイントを購入する', onPress: () => navigation.navigate('Premium') }"
);

// 2. Permanent Text Box
// Find Step 3 block
const pattern_step3 = /\{\/\* ステップ3 \*\/\}\n\s+\{generatedText \? \(\n\s+<View>/;
if (pattern_step3.test(content)) {
    content = content.replace(pattern_step3, '{/* ステップ3 */}\n        <View>');
}

// Remove the trailing ) : null} for step 3
// searching for exact restored version
const target_end = 'autoCorrect={false}\n            spellCheck={false}\n          />\n        </View>\n      ) : null}';
const replacement_end = 'autoCorrect={false}\n            spellCheck={false}\n          />\n        </View>';

if (content.includes(target_end)) {
    content = content.replace(target_end, replacement_end);
}

// Add placeholder and minHeight to Step 3 TextInput
content = content.replace(
    'style={[styles.resultInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}',
    'style={[styles.resultInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder, minHeight: 120 }]}'
);

// Placeholder and onChangeText extension
content = content.replace(
    'onChangeText={setGeneratedText}',
    'onChangeText={setGeneratedText}\n            placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"\n            placeholderTextColor={subTextColor}'
);

// 3. Tutorial Wording
content = content.replace('👇 有料APIキーの取得方法（3ステップ）', '👇 APIキーの取得方法（3ステップ）');
content = content.replace('1️⃣ アカウント作成とStarterプランへの登録', '1️⃣ アカウント作成とプランへの登録');
content = content.replace(
    'アカウントを作成後、「Starter」プラン（$5/月）以上のプランに登録します。',
    'アカウントを作成後、利用したいプラン（無料プランもあります）に登録します。'
);
content = content.replace('「使用状況分析（Usage analytics）」', '「Usage analytics（使用状況分析）」');
content = content.replace(
    /「API Keys」という文字をタップし、「＋Create Key」ボタンを押して好きな名前を入力します。/g,
    '「API Keys（APIキー）」から「＋Create Key（キーを作成）」を押し、好きな名前を入力して、「Restrict Key（キーを制限）」のつまみをオフ（灰色）にします。最後に「Create Key（キーを作成）」を押すと取得できます。'
);

const old_restrict = '<Text style={{ fontWeight: \'bold\', color: \'#FF3B30\' }}>必ず「Restrict Key」のスイッチをオフ（灰色）にしてから</Text>作成ボタンを押してください。';
const new_restrict = '<Text style={{ fontWeight: \'bold\', color: \'#FF3B30\' }}>必ず「Restrict Key（キーを制限）」をオフにしてください。</Text>これをしないとアプリ側で機能が解放されません。';
content = content.replace(old_restrict, new_restrict);

const step3_end = '作成された「API Key」というパスワードのような文字列を全選択してコピーし、すぐ上の入力欄に貼り付ければ完了です！';
if (content.includes(step3_end)) {
    content = content.replace(
        step3_end,
        step3_end + '\n                    <Text style={{ color: "#FF3B30", fontSize: 12, fontWeight: "bold", marginTop: 8 }}>※APIキーは一度しか表示されないため、メモアプリ等どこかに保存しておくことをオススメします。</Text>'
    );
}

content = content.replace(
    '画面のどこかにあるご自身のアイコンをタップして',
    '画面のおそらく右上にあるご自身のアイコンをタップして'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('GenerateScreen.tsx patched successfully via Node.js');
