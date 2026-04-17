import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Sparkles, AlertCircle } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { generateLongAffirmation, SubjectType } from '../utils/affirmationGenerator';
import { getTranslation } from '../i18n/translations';

export function RecordScreen() {
  const { addAffirmation, isDarkMode, language } = useAppStore();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const [affirmationText, setAffirmationText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [subjectType, setSubjectType] = useState<SubjectType>('I');
  const [customName, setCustomName] = useState('');

  const themeColors = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#F0F8FF', '#E6F4FE'];
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#A0AEC0' : '#8E8E93';
  const inputBg = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : '#F2F2F7';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';
  const activeColor = isDarkMode ? '#00F2FE' : '#007AFF';
  const inputBorder = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  const presets = language === 'en' 
    ? ['Self-Esteem', 'Gratitude', 'Goals', 'Healing', 'Motivation', 'Focus', 'Relax', 'Positive', 'Success', 'Luck', 'Relationships', 'Action']
    : ['自己肯定感', '感謝', '目標達成', '癒やし', 'モチベーション', '集中力', 'リラックス', 'ポジティブ', '成功', '運', '人間関係', '行動力'];

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
      // ローカルジェネレーターで即時テキスト作成
      const text = generateLongAffirmation(preset, subjectType, customName, language);
      setAffirmationText(text.trim());
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
          title: language === 'en' ? `Recording (${new Date().toLocaleDateString('en-US')})` : `自分の録音 (${new Date().toLocaleDateString('ja-JP')})`,
          text: affirmationText.trim() || undefined,
          date: Date.now()
        });
      }
      setRecording(null);
      Alert.alert(getTranslation(language, 'rec', 'successTitle'), getTranslation(language, 'rec', 'successMsg'));
      setAffirmationText(''); // 録音完了したらテキストをクリア
    } catch (error) {
      console.error('録音の停止に失敗しました', error);
    }
  }

  return (
    <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: textColor }]}>{getTranslation(language, 'rec', 'title')}</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>{getTranslation(language, 'rec', 'subtitle')}</Text>
        
        {/* ステップ1: 主語選択 */}
        <View style={{ marginBottom: 16, marginTop: 8 }}>
          <Text style={[styles.presetLabel, { color: textColor, marginBottom: 8 }]}>{getTranslation(language, 'rec', 'step1')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setSubjectType('I')} style={[styles.presetButton, { flex: 1, backgroundColor: subjectType === 'I' ? 'rgba(0,122,255,0.1)' : cardBg, borderColor: subjectType === 'I' ? activeColor : borderColor }]}>
              <Text style={{ color: subjectType === 'I' ? activeColor : textColor, textAlign: 'center', fontWeight: subjectType === 'I' ? 'bold' : 'normal' }}>{getTranslation(language, 'gen', 'subjI')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSubjectType('YOU')} style={[styles.presetButton, { flex: 1, backgroundColor: subjectType === 'YOU' ? 'rgba(0,122,255,0.1)' : cardBg, borderColor: subjectType === 'YOU' ? activeColor : borderColor }]}>
              <Text style={{ color: subjectType === 'YOU' ? activeColor : textColor, textAlign: 'center', fontWeight: subjectType === 'YOU' ? 'bold' : 'normal' }}>{getTranslation(language, 'gen', 'subjYou')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSubjectType('NAME')} style={[styles.presetButton, { flex: 1, backgroundColor: subjectType === 'NAME' ? 'rgba(0,122,255,0.1)' : cardBg, borderColor: subjectType === 'NAME' ? activeColor : borderColor }]}>
              <Text style={{ color: subjectType === 'NAME' ? activeColor : textColor, textAlign: 'center', fontWeight: subjectType === 'NAME' ? 'bold' : 'normal' }}>{getTranslation(language, 'gen', 'subjName')}</Text>
            </TouchableOpacity>
          </View>
          {subjectType === 'NAME' && (
            <TextInput
              style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 }}
              placeholder={getTranslation(language, 'gen', 'namePlaceholder')}
              placeholderTextColor={subTextColor}
              value={customName}
              onChangeText={setCustomName}
            />
          )}
        </View>

        {/* AIワンタップ生成ボタン */}
        <View style={styles.presetContainer}>
          <Text style={[styles.presetLabel, { color: textColor }]}>{getTranslation(language, 'rec', 'step2')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8 }}>
            {presets.map(preset => (
              <TouchableOpacity
                key={preset}
                style={[styles.presetButton, { backgroundColor: cardBg, borderColor, marginBottom: 8, marginRight: 8 }]}
                onPress={() => handleAutoGenerate(preset)}
                disabled={isGenerating}
              >
                {isGenerating ? <ActivityIndicator size="small" color="#00F2FE" /> : <Sparkles size={14} color="#00F2FE" />}
                <Text style={{ color: textColor, marginLeft: 6, fontSize: 13, fontWeight: '500' }}>{preset}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
          <Text style={[styles.presetLabel, { color: textColor, marginVertical: 0 }]}>{getTranslation(language, 'rec', 'step3')}</Text>
          {/* 文字数カウンター */}
          <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: inputBorder }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>
              {affirmationText.length} {language === 'en' ? 'chars' : '文字'}
            </Text>
          </View>
        </View>
        
        {/* スクロール・編集可能なテキストボックス */}
        <TextInput
          style={[styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor }]}
          multiline
          placeholder={getTranslation(language, 'rec', 'textPlaceholder')}
          placeholderTextColor={subTextColor}
          value={affirmationText}
          onChangeText={setAffirmationText}
          autoCorrect={false}
          spellCheck={false}
        />
        
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
            {isRecording ? getTranslation(language, 'rec', 'stopRec') : getTranslation(language, 'rec', 'startRec')}
          </Text>
        </View>

        {/* 録音のコツ */}
        <View style={[styles.tipsContainer, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.tipsHeader}>
            <AlertCircle color="#00F2FE" size={18} />
            <Text style={[styles.tipsTitle, { color: textColor }]}>{getTranslation(language, 'rec', 'tipTitle')}</Text>
          </View>
          <Text style={[styles.tipItem, { color: subTextColor }]}>{getTranslation(language, 'rec', 'tip1')}</Text>
          <Text style={[styles.tipItem, { color: subTextColor }]}>{getTranslation(language, 'rec', 'tip2')}</Text>
          <Text style={[styles.tipItem, { color: subTextColor }]}>{getTranslation(language, 'rec', 'tip3')}</Text>
          <Text style={[styles.tipItem, { color: subTextColor }]}>{getTranslation(language, 'rec', 'tip4')}</Text>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 10, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  textArea: {
    borderRadius: 12,
    paddingTop: 16,
    padding: 16,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 28,
    textAlignVertical: 'top',
    minHeight: 180,
    marginBottom: 16,
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
