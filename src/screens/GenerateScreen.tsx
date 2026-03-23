import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Sparkles, Mic, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { httpsCallable } from 'firebase/functions';
import { functions, storage } from '../services/firebase';
import { getDownloadURL, ref } from 'firebase/storage';
import { useAppStore } from '../store/useAppStore';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';

export function GenerateScreen({ route, navigation }: any) {
  const [theme, setTheme] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const { affirmations, addAffirmation, isDarkMode, savedTexts, addSavedText } = useAppStore();

  useEffect(() => {
    if (route?.params?.presetText) {
      setGeneratedText(route.params.presetText);
      // navigationから呼ばれた場合は少しスクロールさせるなど（簡易版）
    }
  }, [route?.params?.presetText]);

  const themeColors = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#F0F8FF', '#E6F4FE'];
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#A0AEC0' : '#8E8E93';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';
  const activeColor = isDarkMode ? '#00F2FE' : '#007AFF';
  const inputBg = isDarkMode ? 'rgba(0, 0, 0, 0.4)' : '#FFFFFF';
  const inputBorder = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // --- 録音用のステート ---
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const presets = ['自己肯定', '健康', '人間関係', '目標達成', '能力'];

  // 録音タイマー
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setDuration((prev) => prev + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
         Alert.alert('エラー', 'マイクへのアクセスを許可してください。');
         return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: { extension: '.m4a', outputFormat: Audio.AndroidOutputFormat.MPEG_4, audioEncoder: Audio.AndroidAudioEncoder.AAC, sampleRate: 44100, numberOfChannels: 1, bitRate: 128000 },
        ios: { extension: '.m4a', outputFormat: Audio.IOSOutputFormat.MPEG4AAC, audioQuality: Audio.IOSAudioQuality.MAX, sampleRate: 44100, numberOfChannels: 1, bitRate: 128000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
        web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
      });
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('録音の開始に失敗しました', err);
      Alert.alert('エラー', '録音を開始できませんでした。');
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      const uri = recording.getURI();
      if (uri) {
        addAffirmation({
          id: Date.now().toString(),
          uri: uri,
          title: `自分の録音 (${new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`,
          text: generatedText.trim() || undefined,
          date: Date.now()
        });
      }
      setRecording(null);
      Alert.alert('録音完了', '声のサンプルを保存しました。このままAI音声を合成できます！');
    } catch (error) {
      console.error('録音の停止に失敗しました', error);
    }
  }

  const handleGenerateText = async (customTheme?: string) => {
    const targetTheme = customTheme || theme;
    if (!targetTheme) return;
    
    setIsGeneratingText(true);
    
    try {
      const generateAffirmation = httpsCallable(functions, 'createAffirmation');
      // プリセットの場合は「〜についてのアファメーション」と補う
      const prompt = customTheme ? `${customTheme}についてのアファメーションをして` : targetTheme;
      const response = await generateAffirmation({ theme: prompt });
      const data = response.data as { text: string };
      // 句読点（。）で改行＋1行空け
      const formattedText = data.text.replace(/。/g, '。\n\n').trim();
      setGeneratedText(formattedText);
    } catch (error: any) {
      console.error('Generaton Error:', error);
      Alert.alert('エラー', 'テキストの生成に失敗しました。\n' + (error.message || ''));
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!generatedText) return;
    
    if (affirmations.length === 0) {
      Alert.alert('録音データがありません', '先に「声のサンプルを録音」からあなたの声を10秒ほど録音してお試しください。');
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const latestAudioUri = affirmations[0].uri;
      const base64Audio = await FileSystem.readAsStringAsync(latestAudioUri, {
        encoding: 'base64' as any,
      });

      const generateAudio = httpsCallable(functions, 'createVoiceCloneAndAudio');
      const response = await generateAudio({ text: generatedText, audioBase64: base64Audio });
      const data = response.data as { storagePath: string; audioUrl?: string; isFallback?: boolean };

      let audioUrl = data.audioUrl;
      if (!audioUrl) {
        audioUrl = await getDownloadURL(ref(storage, data.storagePath));
      }

      const id = Date.now().toString();
      
      // ▼ ローカルにキャッシュして次回以降の再生ラグをゼロにする
      const localUri = FileSystem.documentDirectory + `ai_audio_${id}.mp3`;
      try {
        await FileSystem.downloadAsync(audioUrl, localUri);
        audioUrl = localUri; // キャッシュ成功時はローカルパスをプレイリストに登録
      } catch (err) {
        console.warn('Cache download err (playing from cloud instead):', err);
      }

      addAffirmation({
        id,
        uri: audioUrl,
        title: `AI生成: ${theme || '自動生成'}`,
        text: generatedText,
        date: parseInt(id),
      });

      if (data.isFallback) {
        Alert.alert(
          '標準音声で作成しました',
          'ElevenLabsの音声クローン作成制限（月間上限）に達したため、高音質の標準AI音声で代替生成しました。\n生成された音声はプレイリストに追加されています！\n※次月になれば再びご自身の声で生成可能です。'
        );
      } else {
        Alert.alert('完成！🎉', 'あなた専用のAIアファメーション音声が生成され、ホームのプレイリストに追加されました！');
      }
      
    } catch (error: any) {
      console.error('Audio Generation Error:', error);
      Alert.alert('エラー', '音声の合成に失敗しました。\n' + (error.message || ''));
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: textColor }]}>AIアファメーション作成</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>AIが前向きな言葉を作成し、あなたの声で読み上げます</Text>

      {/* 録音セクション（常に表示して初心者にわかりやすく） */}
      <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.label, { color: textColor }]}>1. 声のサンプルを録音する</Text>
        <Text style={[styles.infoText, { color: subTextColor, marginBottom: 12 }]}>
          AIに学習させるためのあなたの声（10秒程度）を録音します。
        </Text>
        
        <View style={styles.recorderRow}>
          <TouchableOpacity 
            style={[styles.miniRecordButton, isRecording && styles.recordingActiveButton]} 
            onPress={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <Square color="#FF3B30" size={24} /> : <Mic color="#FFFFFF" size={24} />}
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
             <Text style={[styles.recorderTitle, { color: textColor }]}>
               {isRecording ? '録音中...' : '録音ボタンをタップ'}
             </Text>
             <Text style={[styles.recorderDesc, { color: isRecording ? '#FF3B30' : subTextColor }]}>
               {isRecording ? formatTime(duration) : '話す内容は自由です'}
             </Text>
          </View>
        </View>
      </View>
      
      {/* テキスト作成セクション */}
      <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.label, { color: textColor }]}>2. 読み上げる文章を作成する</Text>
        <Text style={[styles.infoText, { color: subTextColor, marginBottom: 16 }]}>
          AIに作ってもらうか、自分で入力できます。
        </Text>

        <View style={styles.presetContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
            {presets.map(preset => (
              <TouchableOpacity
                key={preset}
                style={[styles.presetButton, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleGenerateText(preset)}
                disabled={isGeneratingText}
              >
                {isGeneratingText ? <ActivityIndicator size="small" color="#00F2FE" /> : <Sparkles size={14} color="#00F2FE" />}
                <Text style={{ color: textColor, marginLeft: 6, fontSize: 13, fontWeight: '500' }}>{preset}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TextInput
          style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}
          placeholder="テーマを入力 (例: 自信を持ちたい)"
          placeholderTextColor={subTextColor}
          value={theme}
          onChangeText={setTheme}
          multiline
        />
        
        <TouchableOpacity 
          style={[styles.generateButton, !theme && styles.disabledButton]} 
          onPress={() => handleGenerateText()}
          disabled={!theme || isGeneratingText}
        >
          {isGeneratingText ? (
             <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Sparkles color="#FFFFFF" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>AIでテキストを作成</Text>
            </>
          )}
        </TouchableOpacity>

        {generatedText ? (
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[styles.label, { color: textColor }]}>作成された文章（編集可能）:</Text>
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
                    title: theme ? `${theme}のテーマ` : `保存テキスト (${new Date().toLocaleDateString('ja-JP')})`,
                    text: generatedText,
                    createdAt: Date.now()
                  });
                  Alert.alert('保存完了', 'ライブラリにテキストを保存しました！\n後からいつでも呼び出せます。');
                }}
              >
                <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 13 }}>⭐ 保存する</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.resultInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}
              value={generatedText}
              onChangeText={setGeneratedText}
              multiline
            />
          </View>
        ) : null}
      </View>

      {/* 音声合成セクション */}
      {generatedText ? (
        <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor, alignItems: 'center' }]}>
          <Text style={[styles.label, { color: textColor, marginBottom: 16 }]}>3. あなたの声で音声を合成する</Text>
          {isGeneratingAudio ? (
            <ActivityIndicator color="#00F2FE" size="large" />
          ) : (
            <TouchableOpacity 
              style={[styles.generateButton, { backgroundColor: '#34C759', width: '100%' }]} 
              onPress={handleGenerateAudio}
            >
              <Mic color="#FFFFFF" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>音声を合成して保存</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 10, marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#A0AEC0', marginBottom: 20 },
  sectionContainer: { padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  infoText: { fontSize: 12, lineHeight: 18 },
  
  presetContainer: { marginBottom: 12 },
  presetButton: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  
  textInput: { borderRadius: 8, padding: 12, minHeight: 60, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1 },
  generateButton: { backgroundColor: '#00F2FE', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: '#0A0A1A', fontSize: 16, fontWeight: 'bold' },
  
  resultInput: { borderRadius: 12, padding: 16, minHeight: 180, textAlignVertical: 'top', fontSize: 16, lineHeight: 28, borderWidth: 1 },
  
  recorderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  recorderTitle: { fontSize: 16, fontWeight: '600' },
  recorderDesc: { fontSize: 13, marginTop: 4 },
  miniRecordButton: { 
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF3B30', 
    justifyContent: 'center', alignItems: 'center', 
    shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 
  },
  recordingActiveButton: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FF3B30' },
});
