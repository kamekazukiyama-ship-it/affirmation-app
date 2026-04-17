import re

path = r'c:\antigravity\src\screens\GenerateScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Navigation
content = content.replace(
    "{ text: 'ポイントを購入する', onPress: () => navigation.navigate('Settings') }",
    "{ text: 'ポイントを購入する', onPress: () => navigation.navigate('Premium') }"
)

# 2. Permanent Text Box
# Find Step 3 block
pattern_step3 = re.compile(r'\{\/\* ステップ3 \*\/\}\s+\{generatedText \? \(\s+<View>', re.MULTILINE)
content = pattern_step3.sub('{/* ステップ3 */}\n        <View>', content)

# Remove the trailing ) : null} for step 3
# It should be after the TextInput
pattern_trailing = re.compile(r'(\s+<\/TextInput>)\s+<\/View>\s+\) : null\}', re.MULTILINE)
content = pattern_trailing.sub(r'\1\n        </View>', content)

# Add placeholder and minHeight to Step 3 TextInput
content = content.replace(
    'style={[styles.resultInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}',
    'style={[styles.resultInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder, minHeight: 120 }]}'
)
content = content.replace(
    'onChangeText={setGeneratedText}',
    'onChangeText={setGeneratedText}\n            placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"\n            placeholderTextColor={subTextColor}'
)

# 3. Tutorial Wording
# Title
content = content.replace('👇 有料APIキーの取得方法（3ステップ）', '👇 APIキーの取得方法（3ステップ）')
# Step 1
content = content.replace('1️⃣ アカウント作成とStarterプランへの登録', '1️⃣ アカウント作成とプランへの登録')
content = content.replace(
    'アカウントを作成後、「Starter」プラン（$5/月）以上のプランに登録します。',
    'アカウントを作成後、利用したいプラン（無料プランもあります）に登録します。'
)
# Step 2
content = content.replace('「使用状況分析（Usage analytics）」', '「Usage analytics（使用状況分析）」')
content = content.replace(
    '「API Keys」という文字をタップし、「＋Create Key」ボタンを押して',
    '「API Keys（APIキー）」から「＋Create Key（キーを作成）」を押し、好きな名前を入力して、「Restrict Key（キーを制限）」のつまみをオフ（灰色）にします。最後に「Create Key（キーを作成）」を押すと'
)
content = content.replace(
    '<Text style={{ fontWeight: \'bold\', color: \'#FF3B30\' }}>必ず「Restrict Key」のスイッチをオフ（灰色）にしてから</Text>作成ボタンを押してください。',
    '<Text style={{ fontWeight: \'bold\', color: \'#FF3B30\' }}>必ず「Restrict Key（キーを制限）」をオフにしてください。</Text>これをしないとアプリ側で機能が解放されません。'
)
# Step 3 Warning
step3_end = '作成された「API Key」というパスワードのような文字列を全選択してコピーし、すぐ上の入力欄に貼り付ければ完了です！'
content = content.replace(
    step3_end,
    step3_end + '\n                    <Text style={{ color: "#FF3B30", fontSize: 12, fontWeight: "bold", marginTop: 8 }}>※APIキーは一度しか表示されないため、メモアプリ等どこかに保存しておくことをオススメします。</Text>'
)

# Fix icon location
content = content.replace(
    '画面のどこかにあるご自身のアイコンをタップして',
    '画面のおそらく右上にあるご自身のアイコンをタップして'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("GenerateScreen.tsx patched successfully.")
