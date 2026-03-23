import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Sparkles, AlertCircle } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

export function RecordScreen() {
  const { addAffirmation, isDarkMode } = useAppStore();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const [affirmationText, setAffirmationText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const themeColors = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#F0F8FF', '#E6F4FE'];
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#A0AEC0' : '#8E8E93';
  const inputBg = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : '#F2F2F7';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';

  const presets = ['自己肯定', '健康', '人間関係', '目標達成', '能力'];

  // タイマー処理
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
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

  const handleAutoGenerate = async (preset: string) => {
    setIsGenerating(true);
    try {
      const generateAffirmation = httpsCallable(functions, 'createAffirmation');
      const response = await generateAffirmation({ theme: preset + 'についてのアファメーションをして' });
      const data = response.data as { text: string };
      // 句読点（。）で改行し、さらに1行空ける（\n\n）
      const formattedText = data.text.replace(/。/g, '。\n\n').trim();
      setAffirmationText(formattedText);
    } catch (error: any) {
      console.error('Generation Error:', error);
      Alert.alert('エラー', '自動生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('エラー', 'マイクへのアクセスを許可してください。');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
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
          title: `自分の録音 (${new Date().toLocaleDateString('ja-JP')})`,
          text: affirmationText.trim() || undefined,
          date: Date.now()
        });
      }
      setRecording(null);
      Alert.alert('完了', '録音が完了し、ホーム画面に保存されました！');
      setAffirmationText(''); // 録音完了したらテキストをクリア
    } catch (error) {
      console.error('録音の停止に失敗しました', error);
    }
  }

  return (
    <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: textColor }]}>自分の声を録音する</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>ポジティブな自己暗示（アファメーション）を吹き込んでみましょう</Text>
        
        {/* スクロール・編集可能なテキストボックス */}
        <View style={styles.textInputWrapper}>
          <TextInput
            style={[styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor }]}
            multiline
            placeholder="読みたいアファメーションを入力、またはAIで自動生成してください"
            placeholderTextColor={subTextColor}
            value={affirmationText}
            onChangeText={setAffirmationText}
          />
        </View>

        {/* AIワンタップ生成ボタン */}
        <View style={styles.presetContainer}>
          <Text style={[styles.presetLabel, { color: textColor }]}>AIで自動作成：</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            {presets.map(preset => (
              <TouchableOpacity
                key={preset}
                style={[styles.presetButton, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleAutoGenerate(preset)}
                disabled={isGenerating}
              >
                {isGenerating ? <ActivityIndicator size="small" color="#00F2FE" /> : <Sparkles size={14} color="#00F2FE" />}
                <Text style={{ color: textColor, marginLeft: 6, fontSize: 13, fontWeight: '500' }}>{preset}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* 録音エリア */}
        <View style={styles.recordingArea}>
          <Text style={[styles.timer, { color: textColor }]}>{formatTime(duration)}</Text>
          
          <TouchableOpacity 
            style={[styles.recordButton, isRecording && styles.recordingActiveButton]} 
            onPress={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <Square color="#FFFFFF" size={32} />
            ) : (
              <Mic color="#FFFFFF" size={32} />
            )}
          </TouchableOpacity>
          <Text style={[styles.statusText, { color: subTextColor }]}>
            {isRecording ? 'タップして停止' : 'タップして録音開始'}
          </Text>
        </View>

        {/* 録音のコツ */}
        <View style={[styles.tipsContainer, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.tipsHeader}>
            <AlertCircle color="#00F2FE" size={18} />
            <Text style={[styles.tipsTitle, { color: textColor }]}>録音のコツ</Text>
          </View>
          <Text style={[styles.tipItem, { color: subTextColor }]}>・静かな環境で録音してください</Text>
          <Text style={[styles.tipItem, { color: subTextColor }]}>・はっきりとした声で、ゆっくりと話してください</Text>
          <Text style={[styles.tipItem, { color: subTextColor }]}>・AI音声に負けないためにも、抑揚をつけて話してください</Text>
          <Text style={[styles.tipItem, { color: subTextColor }]}>・感情、思いを強く言葉に込めて話してください</Text>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 10, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  textInputWrapper: { height: 160, marginBottom: 16 },
  textArea: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 28,
    textAlignVertical: 'top',
  },
  presetContainer: { marginBottom: 30 },
  presetLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  recordingArea: { alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  timer: { fontSize: 64, fontWeight: '300', marginBottom: 30, fontVariant: ['tabular-nums'] },
  recordButton: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#00F2FE',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#00F2FE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
  },
  recordingActiveButton: { backgroundColor: '#FF3B30', shadowColor: '#FF3B30' },
  statusText: { marginTop: 24, fontSize: 16 },
  tipsContainer: { padding: 16, borderRadius: 12, borderWidth: 1 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipsTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  tipItem: { fontSize: 13, lineHeight: 22, marginBottom: 4 }
});
