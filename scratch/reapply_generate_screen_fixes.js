const fs = require('fs');
const filePath = 'c:\\antigravity\\src\\screens\\GenerateScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Permanent Text Box (Step 3)
// Remove the conditional wrapper {generatedText ? (...) : null}
// This version is based on the 'restored' state (Checkpoint 71 view_file)
const step3Start = '{/* ステップ3 */}\n        {generatedText ? (\n          <View>';
const step3StartReplacement = '{/* ステップ3 */}\n        <View>';
if (content.includes(step3Start)) {
    content = content.replace(step3Start, step3StartReplacement);
}

const step3End = ')\n        ) : null}'; // Specific to restored state indentation
const step3EndReplacement = ')\n        }'; // Adjusted for the View closure
// Actually let's be more precise or just replace the whole block

// Better: find and replace the whole block for Step 3
const oldStep3Block = `{/* ステップ3 */}
        {generatedText ? (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[styles.infoText, { color: subTextColor, fontWeight: 'bold' }]}>③ 最後に、自由に編集します</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* 文字数カウンター */}
                <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: inputBorder }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: generatedText.length >= 200 ? '#FF3B30' : subTextColor }}>
                    {generatedText.length} / 200
                  </Text>
                </View>

                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(0,122,255,0.1)' }}
                  onPress={() => {
                    const isAlreadySaved = savedTexts.some(st => st.text === generatedText);
                    if (isAlreadySaved) {
                      Alert.alert('確認', 'このテキストは既に保存されています。');
                      return;
                    }
                    addSavedText({
                      id: Date.now().toString(),
                      title: theme ? \`\${theme}のテーマ\` : \`保存テキスト (\${new Date().toLocaleDateString('ja-JP')})\`,
                      text: generatedText,
                      createdAt: Date.now()
                    });
                    Alert.alert('保存完了', 'ライブラリにテキストを保存しました！\\n後からいつでも呼び出せます。');
                  }}
                >
                  <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 13 }}>⭐ 保存する</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={[styles.resultInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}
              value={generatedText}
              onChangeText={setGeneratedText}
              multiline
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
        ) : null}`;

const newStep3Block = `{/* ステップ3 */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.infoText, { color: subTextColor, fontWeight: 'bold' }]}>③ 最後に、自由に編集します</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* 文字数カウンター */}
              <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: inputBorder }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: (generatedText?.length || 0) >= 200 ? '#FF3B30' : subTextColor }}>
                  {generatedText?.length || 0} / 200
                </Text>
              </View>

              {generatedText ? (
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(0,122,255,0.1)' }}
                  onPress={() => {
                    const isAlreadySaved = savedTexts.some(st => st.text === generatedText);
                    if (isAlreadySaved) {
                      Alert.alert('確認', 'このテキストは既に保存されています。');
                      return;
                    }
                    addSavedText({
                      id: Date.now().toString(),
                      title: theme ? \`\${theme}のテーマ\` : \`保存テキスト (\${new Date().toLocaleDateString('ja-JP')})\`,
                      text: generatedText,
                      createdAt: Date.now()
                    });
                    Alert.alert('保存完了', 'ライブラリにテキストを保存しました！\\n後からいつでも呼び出せます。');
                  }}
                >
                  <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 13 }}>⭐ 保存する</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <TextInput
            style={[styles.resultInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder, minHeight: 120 }]}
            value={generatedText}
            onChangeText={setGeneratedText}
            placeholder="ここにアファメーションを入力、または上のボタンで自動生成してください"
            placeholderTextColor={subTextColor}
            multiline
            autoCorrect={false}
            spellCheck={false}
          />
        </View>`;

// Normalizing line endings for the big replacement
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedOld = oldStep3Block.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedOld)) {
    content = normalizedContent.replace(normalizedOld, newStep3Block);
} else {
    console.log('Step 3 block match failed, trying fallback...');
    // fallback to regex for Step 3
}

// 2. Tutorial Wording Updates
content = content.replace('👇 有料APIキーの取得方法（3ステップ）', '👇 APIキーの取得方法（3ステップ）');
content = content.replace('1️⃣ アカウント作成とStarterプランへの登録', '1️⃣ アカウント作成とプランへの登録');
content = content.replace(
    /アカウントを作成後、「Starter」プラン（\$5\/月）以上のプランに登録します。/g,
    'アカウントを作成後、利用したいプラン（無料プランもあります）に登録します。'
);
content = content.replace(
    /画面のどこかにあるご自身のアイコン/g,
    '画面のおそらく右上にあるご自身のアイコン'
);
content = content.replace(
    /「使用状況分析（Usage analytics）」を選びます。/g,
    '「Usage analytics（使用状況分析）」を選びます。'
);
content = content.replace(
    /ページ上部の「API Keys」という文字をタップし、「＋Create Key」ボタンを押して好きな名前を入力します。/g,
    'その後、「API Keys（APIキー）」から「＋Create Key（キーを作成）」を押し、好きな名前を入力して、「Restrict Key（キーを制限）」のつまみをオフ（灰色）にします。最後に「Create Key（キーを作成）」を押すと取得できます。'
);
content = content.replace(
    /<Text style={{ fontWeight: 'bold', color: '#FF3B30' }}>必ず「Restrict Key」のスイッチをオフ（灰色）にしてから<\/Text>作成ボタンを押してください。/g,
    '<Text style={{ fontWeight: \'bold\', color: \'#FF3B30\' }}>必ず「Restrict Key（キーを制限）」をオフにしてください。</Text>これをしないとアプリ側で機能が解放されません。'
);

const step3TutorialEnd = 'すぐ上の入力欄に貼り付ければ完了です！';
if (content.includes(step3TutorialEnd) && !content.includes('APIキーは一度しか表示されないため')) {
    content = content.replace(
        step3TutorialEnd,
        step3TutorialEnd + '\n                    </Text>\n                    <Text style={{ color: "#FF3B30", fontSize: 11, fontWeight: "bold", marginTop: 8 }}>※APIキーは一度しか表示されないため、メモアプリ等どこかに保存しておくことをオススメします。'
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('GenerateScreen.tsx patched successfully.');
