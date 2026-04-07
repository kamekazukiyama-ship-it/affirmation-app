import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, LayoutAnimation, Platform, UIManager, Modal } from 'react-native';
import { Sparkles, Mic, Square, Key, ChevronDown, ChevronUp, Play } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { httpsCallable } from 'firebase/functions';
import { functions, storage } from '../services/firebase';
import { getDownloadURL, ref } from 'firebase/storage';
import { useAppStore } from '../store/useAppStore';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { generateLongAffirmation, SubjectType } from '../utils/affirmationGenerator';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PREVIEW_CACHE: Record<string, string> = {};

export function GenerateScreen({ route, navigation }: any) {
  const AI_VOICES = [
    // --- 女性 ---
    { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'アリス (Alice)', gender: 'female', desc: '落ち着いた優しい女性の声。リラックスに最適。', icon: '👩🏻', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/d10f7534-11f6-41fe-a012-2de1e482d336.mp3' },
    { id: 'XrExE9yKIg1WjnnlVkGX', name: 'マチルダ (Matilda)', gender: 'female', desc: '明るく元気な女性の声。モチベーションアップに！', icon: '👧🏼', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/b930e18d-6b4d-466e-bab2-0ae97c6d8535.mp3' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'サラ (Sarah)', gender: 'female', desc: '柔らかく温かみのある女性の声。安心感があります。', icon: '👩🏽', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3' },
    { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'ローラ (Laura)', gender: 'female', desc: '少しクセのある元気な声。個性的な響きです。', icon: '👱‍♀️', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/FGY2WhTYpPnrIDTdsKH5/67341759-ad08-41a5-be6e-de12fe448618.mp3' },
    { id: 'cgSgspJ2msm6clMCkdW9', name: 'ジェシカ (Jessica)', gender: 'female', desc: '可愛らしくて温かい声。親しみやすさ抜群。', icon: '🌸', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3' },
    { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'ベラ (Bella)', gender: 'female', desc: 'プロフェッショナルで明るく、温かい声。', icon: '💎', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/hpp4J3VqNfWAUOO0d1Us/dab0f5ba-3aa4-48a8-9fad-f138fea1126d.mp3' },
    { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'リリー (Lily)', gender: 'female', desc: '滑らかで女優のような、心地よい質感の声。', icon: '🌷', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/89b68b35-b3dd-4348-a84a-a3c13a3c2b30.mp3' },

    // --- 男性 ---
    { id: 'cjVigY5qzO86Huf0OWal', name: 'エリック (Eric)', gender: 'male', desc: '親しみやすくバランスの良い男性の声。', icon: '👨🏻', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3' },
    { id: 'nPczCjzI2devNBz1zQrb', name: 'ブライアン (Brian)', gender: 'male', desc: '深く渋い男性の声。説得力と落ち着きがあります。', icon: '👨🏽‍🦳', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/nPczCjzI2devNBz1zQrb/2dd3e72c-4fd3-42f1-93ea-abc5d4e5aa1d.mp3' },
    { id: 'IKne3meq5aSn9XLyUdCD', name: 'チャーリー (Charlie)', gender: 'male', desc: 'ハキハキとした自信に満ちた声。テンション高め！', icon: '👦🏻', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/102de6f2-22ed-43e0-a1f1-111fa75c5481.mp3' },
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'ジョージ (George)', gender: 'male', desc: '温かく語りかけるようなおじさまの声。豊かな包容力。', icon: '👴🏼', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/JBFqnCBsd6RMkjVDRZzb/e6206d1a-0721-4787-aafb-06a6e705cac5.mp3' },
    { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'カラム (Callum)', gender: 'male', desc: 'ハスキーで少しクセのある男性の声。', icon: '👔', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-9ebc-b0f99ca25481.mp3' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'リアム (Liam)', gender: 'male', desc: 'エネルギッシュな若い男性のクリエイターボイス。', icon: '👓', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/63148076-6363-42db-aea8-31424308b92c.mp3' },
    { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'ハリー (Harry)', gender: 'male', desc: '激しく力強い男性の声。モチベーション限界突破！', icon: '🔥', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/SOYHLrjzK2X1ezoPC6cr/86d178f6-f4b6-4e0e-85be-3de19f490794.mp3' },
    { id: 'bIHbv24MWmeRgasZH58o', name: 'ウィル (Will)', gender: 'male', desc: 'フレンドリーで親しみやすい若者の声。', icon: '🧢', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/bIHbv24MWmeRgasZH58o/8caf8f3d-ad29-4980-af41-53f20c72d7a4.mp3' },
    { id: 'SAz9YHcvj6GT2YYXdXww', name: 'リバー (River)', gender: 'male', desc: 'ジェンダーレスで中世的、非常に落ち着いた声。', icon: '🌿', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/SAz9YHcvj6GT2YYXdXww/e6c95f0b-2227-491a-b3d7-2249240decb7.mp3' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'ロジャー (Roger)', gender: 'male', desc: 'カジュアルでゆったりとした、響く男性の声。', icon: '🏕️', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/CwhRBWXzGAHq8TQ4Fs17/58ee3ff5-f6f2-4628-93b8-e38eb31806b0.mp3' },
    { id: 'iP95p4xoKVk53GoZ742B', name: 'クリス (Chris)', gender: 'male', desc: 'チャーミングで地に足のついた声。', icon: '☕', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/iP95p4xoKVk53GoZ742B/3f4bde72-cc48-40dd-829f-57fbf906f4d7.mp3' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'ダニエル (Daniel)', gender: 'male', desc: '安定した放送局のアナウンサーのような声。', icon: '🎙️', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/7eee0236-1a72-4b86-b303-5dcadc007ba9.mp3' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'アダム (Adam)', gender: 'male', desc: '強固で圧倒的なカリスマを持つ男性の声。', icon: '👑', preview: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/d6905d7a-dd26-4187-bfff-1bd3a5ea7cac.mp3' },
  ];

  const [theme, setTheme] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [subjectType, setSubjectType] = useState<SubjectType>('I');
  const [customName, setCustomName] = useState('');
  const [voiceType, setVoiceType] = useState<'system'|'custom'>('system');
  const [systemVoiceId, setSystemVoiceId] = useState(AI_VOICES[0].id);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female');
  const { affirmations, addAffirmation, isDarkMode, savedTexts, addSavedText, elevenLabsApiKey, setElevenLabsApiKey } = useAppStore();

  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
  const [isAIModalVisible, setIsAIModalVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (previewSound) {
        previewSound.unloadAsync();
      }
    };
  }, [previewSound]);


  const togglePreview = async (voiceId: string) => {
    try {
      if (previewSound) {
        try {
          const status = await previewSound.getStatusAsync();
          if (status.isLoaded) {
            await previewSound.stopAsync();
            await previewSound.unloadAsync();
          }
        } catch (e) {
          console.log("Ignored error while stopping previous sound", e);
        }
        setPreviewSound(null);
        
        if (playingPreviewId === voiceId) {
          setPlayingPreviewId(null);
          return;
        }
      }
      setPlayingPreviewId(voiceId);
      
      const voice = AI_VOICES.find(v => v.id === voiceId);
      const url = voice?.preview;
      if (!voice || !url) {
        setPlayingPreviewId(null);
        Alert.alert('エラー', 'プレビューが見つかりません');
        return;
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      setPreviewSound(sound);
      
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setPlayingPreviewId(null);
          setPreviewSound(null);
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (e) {
      console.error(e);
      setPlayingPreviewId(null);
      Alert.alert('再生エラー', '再生に失敗しました。');
    }
  };

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

  const presets = ['自己肯定感', '感謝', '目標達成', '癒やし', 'モチベーション', '集中力', 'リラックス', 'ポジティブ', '成功', '運', '人間関係', '行動力'];

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
    if (customTheme) setTheme(customTheme);
    const targetTheme = customTheme || theme;
    if (!targetTheme) return;
    
    setIsGeneratingText(true);
    
    try {
      const prompt = customTheme ? `${customTheme}` : targetTheme;
      
      // ローカルジェネレーターで即時テキスト作成（API通信不要・完全無料）
      const text = generateLongAffirmation(prompt, subjectType, customName);
      setGeneratedText(text.trim());
    } catch (error: any) {
      console.error('Generaton Error:', error);
      Alert.alert('エラー', 'テキストの生成に失敗しました。\n' + (error.message || ''));
    } finally {
      setIsGeneratingText(false);
    }
  };

  const startGenerateAudioProcess = async () => {
    setIsAIModalVisible(false);
    if (!generatedText) return;
    
    let base64Audio: string | undefined = undefined;

    if (voiceType === 'custom') {
      if (!elevenLabsApiKey) {
        Alert.alert(
          'APIキーの設定が必要です',
          'あなた自身の声（クローン）を使用するには、ElevenLabsの有料APIキー（Starterプラン等）を取得して設定してください。\n※「✨ プレミアム機能 ✨」のメニューから設定できます。'
        );
        return;
      }
      
      if (affirmations.length === 0) {
        Alert.alert('録音データがありません', '先に「あなたの声」を10秒ほど録音してお試しください。');
        return;
      }
      try {
        let latestAudioUri = affirmations[0].uri;
        const currentDocDir = (FileSystem as any).documentDirectory;

        // 【重要】パス補正ロジック
        // iOSではUUIDが変わると古い絶対パスが機能しなくなるため、現在のディレクトリで再構成
        if (latestAudioUri.includes('/Documents/') && !latestAudioUri.startsWith(currentDocDir)) {
          const filename = latestAudioUri.split('/').pop();
          const correctedUri = `${currentDocDir}${filename}`;
          const check = await FileSystem.getInfoAsync(correctedUri);
          if (check.exists) {
            latestAudioUri = correctedUri;
          }
        }

        // fetch を使って読み取る（FileSystem の制限を回避）
        try {
          const response = await fetch(latestAudioUri);
          const blob = await response.blob();
          base64Audio = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          // フォールバック
          base64Audio = await FileSystem.readAsStringAsync(latestAudioUri, {
            encoding: 'base64' as any,
          });
        }
      } catch (err) {
        console.error('Failed to read audio file', err);
        Alert.alert('エラー', '録音データの読み込みに失敗しました。');
        return;
      }
    }

    setIsGeneratingAudio(true);
    try {
      const generateAudio = httpsCallable(functions, 'createVoiceCloneAndAudio');
      const response = await generateAudio({ 
        text: generatedText, 
        audioBase64: base64Audio,
        userApiKey: elevenLabsApiKey || null,
        systemVoiceId: systemVoiceId
      });
      const data = response.data as { storagePath: string; audioUrl?: string; isFallback?: boolean };

      let audioUrl = data.audioUrl;
      if (!audioUrl) {
        audioUrl = await getDownloadURL(ref(storage, data.storagePath));
      }

      const id = `${Date.now()}`;
      
      // ▼ ローカルにキャッシュして次回以降の再生ラグをゼロにする
      const localUri = FileSystem.documentDirectory + `ai_audio_${id}.mp3`;
      try {
        const downloadResult = await FileSystem.downloadAsync(audioUrl, localUri);
        
        // 保存されたか再確認（ステータス200かつファイルが存在することを確認）
        const check = await FileSystem.getInfoAsync(localUri);
        if (downloadResult.status === 200 && check.exists) {
          audioUrl = localUri; // 成功時のみローカルパスに切り替え
        } else {
          console.warn('Download status not 200 or file missing', downloadResult.status);
          // 失敗時は audioUrl は元のクラウドURLのまま続行
        }
      } catch (err) {
        console.warn('Cache download failed, playing from cloud:', err);
      }

      addAffirmation({
        id,
        uri: audioUrl,
        title: `AI生成: ${theme || '自動生成'}`,
        text: generatedText,
        date: Date.now(),
      });

      Alert.alert('完成！🎉', '前向きなアファメーション音声が生成され、ホームのプレイリストに追加されました！');
      
    } catch (error: any) {
      console.error('Audio Generation Error:', error);
      Alert.alert('エラー', '音声の合成に失敗しました。\n' + (error.message || ''));
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // --- AI同意モーダルのレンダリング ---
  const renderAIConfirmationModal = () => (
    <Modal
      visible={isAIModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsAIModalVisible(false)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ 
          backgroundColor: isDarkMode ? '#1e1e2e' : '#fff', 
          borderRadius: 20, 
          padding: 24, 
          width: '100%',
          borderWidth: 1,
          borderColor: 'rgba(255,149,0,0.5)'
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: textColor, marginBottom: 16 }}>⚠️ データ送信に関する同意</Text>
          
          <Text style={{ color: subTextColor, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
            音声合成を開始するために、以下のデータを第三者AIサービスへ送信します：
          </Text>

          <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ color: textColor, fontWeight: 'bold', width: 80, fontSize: 13 }}>送信データ:</Text>
              <Text style={{ color: subTextColor, flex: 1, fontSize: 13 }}>・テキスト内容{'\n'}・音声サンプル(ボイスクローン時)</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ color: textColor, fontWeight: 'bold', width: 80, fontSize: 13 }}>送信先:</Text>
              <Text style={{ color: subTextColor, flex: 1, fontSize: 13 }}>OpenAI, ElevenLabs</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ color: textColor, fontWeight: 'bold', width: 80, fontSize: 13 }}>利用目的:</Text>
              <Text style={{ color: subTextColor, flex: 1, fontSize: 13 }}>アファメーション音声の合成のみに使用され、AIの学習には利用されません。</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => Linking.openURL('https://docs.google.com/document/d/e/2PACX-1vRXwLvJzuRj_zVqkd-OmA0k-jHqQ9de6r_R1aFrOdDd0VeYtgvLY6vEaUxDa06wi9ecIxLnm-1wg8vm/pub')}
            style={{ marginBottom: 20 }}
          >
            <Text style={{ color: '#007AFF', fontSize: 12, textDecorationLine: 'underline', textAlign: 'center' }}>
              プライバシーポリシーで詳細を確認する
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              onPress={() => setIsAIModalVisible(false)}
              style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: isDarkMode ? '#2d2d3e' : '#f0f0f0', alignItems: 'center' }}
            >
              <Text style={{ color: textColor, fontWeight: '600' }}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={startGenerateAudioProcess}
              style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#34C759', alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>同意して合成</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
      {renderAIConfirmationModal()}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: textColor }]}>AIアファメーション作成</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>AIが前向きな言葉を作成し、あなたの声で読み上げます</Text>

      {/* 1. テキスト作成セクション */}
      <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.label, { color: textColor }]}>1. 読み上げる文章を作成する</Text>
        
        {/* ステップ1 */}
        <View style={{ marginBottom: 20, marginTop: 8 }}>
          <Text style={[styles.infoText, { color: subTextColor, marginBottom: 8, fontWeight: 'bold' }]}>
            ① まずは主語のパターンを選びます
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setSubjectType('I')} style={[styles.presetButton, { flex: 1, backgroundColor: subjectType === 'I' ? 'rgba(0,122,255,0.1)' : cardBg, borderColor: subjectType === 'I' ? activeColor : borderColor }]}>
              <Text style={{ color: subjectType === 'I' ? activeColor : textColor, textAlign: 'center', fontWeight: subjectType === 'I' ? 'bold' : 'normal' }}>私</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSubjectType('YOU')} style={[styles.presetButton, { flex: 1, backgroundColor: subjectType === 'YOU' ? 'rgba(0,122,255,0.1)' : cardBg, borderColor: subjectType === 'YOU' ? activeColor : borderColor }]}>
              <Text style={{ color: subjectType === 'YOU' ? activeColor : textColor, textAlign: 'center', fontWeight: subjectType === 'YOU' ? 'bold' : 'normal' }}>あなた</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSubjectType('NAME')} style={[styles.presetButton, { flex: 1, backgroundColor: subjectType === 'NAME' ? 'rgba(0,122,255,0.1)' : cardBg, borderColor: subjectType === 'NAME' ? activeColor : borderColor }]}>
              <Text style={{ color: subjectType === 'NAME' ? activeColor : textColor, textAlign: 'center', fontWeight: subjectType === 'NAME' ? 'bold' : 'normal' }}>名前</Text>
            </TouchableOpacity>
          </View>
          {subjectType === 'NAME' && (
            <TextInput
              style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder, marginTop: 8 }]}
              placeholder="呼ばれたい名前を入力 (例: カズキ、カー君、かずぽん etc)"
              placeholderTextColor={subTextColor}
              value={customName}
              onChangeText={setCustomName}
            />
          )}
        </View>

        {/* ステップ2 */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.infoText, { color: subTextColor, marginBottom: 8, fontWeight: 'bold' }]}>
            ② 続いて項目を選びます
          </Text>
          <View style={styles.presetContainer}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 }}>
              {presets.map(preset => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetButton, { backgroundColor: cardBg, borderColor, marginBottom: 8, marginRight: 8 }]}
                  onPress={() => handleGenerateText(preset)}
                  disabled={isGeneratingText}
                >
                  {isGeneratingText ? <ActivityIndicator size="small" color="#00F2FE" /> : <Sparkles size={14} color="#00F2FE" />}
                  <Text style={{ color: textColor, marginLeft: 6, fontSize: 13, fontWeight: '500' }}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ステップ3 */}
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
        ) : null}
      </View>

      {/* 2. 音声選択セクション */}
      <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.label, { color: textColor }]}>2. ナレーション音声を選ぶ</Text>
        <Text style={[styles.infoText, { color: subTextColor, marginBottom: 16 }]}>
          プロにお任せするか、あなた自身の声（クローン）を使うか選べます。
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity 
            onPress={() => setVoiceType('system')}
            style={[{ flex: 1, padding: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center' }, voiceType === 'system' ? { borderColor: activeColor, backgroundColor: isDarkMode ? 'rgba(0, 242, 254, 0.1)' : 'rgba(0, 122, 255, 0.05)' } : { borderColor: inputBorder }]}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>⭐️</Text>
            <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14 }}>プロAIナレーター</Text>
            <Text style={{ color: subTextColor, fontSize: 11, marginTop: 4, textAlign: 'center' }}>ハイクオリティな{'\n'}標準音声</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setVoiceType('custom')}
            style={[{ flex: 1, padding: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center' }, voiceType === 'custom' ? { borderColor: activeColor, backgroundColor: isDarkMode ? 'rgba(0, 242, 254, 0.1)' : 'rgba(0, 122, 255, 0.05)' } : { borderColor: inputBorder }]}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>🎙️</Text>
            <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14 }}>あなたの声で生成</Text>
            <Text style={{ color: subTextColor, fontSize: 11, marginTop: 4, textAlign: 'center' }}>自分の声の{'\n'}AIクローン</Text>
          </TouchableOpacity>
        </View>

        {voiceType === 'system' && (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity 
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowVoiceSelect(!showVoiceSelect);
              }}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F0F8FF', 
                padding: 16, 
                borderRadius: 12, 
                borderWidth: 1, 
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#BDE0FE' 
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: subTextColor, fontSize: 12, marginBottom: 4 }}>現在の音声:</Text>
                <Text style={{ color: textColor, fontSize: 16, fontWeight: 'bold' }}>
                  {AI_VOICES.find(v => v.id === systemVoiceId)?.icon} {AI_VOICES.find(v => v.id === systemVoiceId)?.name}
                </Text>
              </View>
              {showVoiceSelect ? <ChevronUp color={textColor} size={24} /> : <ChevronDown color={textColor} size={24} />}
            </TouchableOpacity>

            {showVoiceSelect && (
              <View style={{ backgroundColor: cardBg, marginTop: 12, padding: 8, borderRadius: 12, borderWidth: 1, borderColor }}>
                {/* 性別切り替えタブ */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
                  <TouchableOpacity 
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setSelectedGender('female');
                    }}
                    style={[{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 }, selectedGender === 'female' ? { backgroundColor: isDarkMode ? 'rgba(255, 105, 180, 0.15)' : 'rgba(255, 105, 180, 0.1)', borderColor: '#FF69B4' } : { backgroundColor: 'transparent', borderColor: borderColor }]}
                  >
                    <Text style={{ color: selectedGender === 'female' ? (isDarkMode ? '#FF69B4' : '#E0338F') : textColor, fontWeight: 'bold', fontSize: 13 }}>👱‍♀️ 女性</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setSelectedGender('male');
                    }}
                    style={[{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 }, selectedGender === 'male' ? { backgroundColor: isDarkMode ? 'rgba(0, 191, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)', borderColor: isDarkMode ? '#00BFFF' : '#007AFF' } : { backgroundColor: 'transparent', borderColor: borderColor }]}
                  >
                    <Text style={{ color: selectedGender === 'male' ? (isDarkMode ? '#00BFFF' : '#007AFF') : textColor, fontWeight: 'bold', fontSize: 13 }}>👱‍♂️ 男性</Text>
                  </TouchableOpacity>
                </View>

                {AI_VOICES.filter(v => v.gender === selectedGender).map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => { setSystemVoiceId(v.id); setShowVoiceSelect(false); }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: systemVoiceId === v.id ? (isDarkMode ? 'rgba(0, 242, 254, 0.15)' : 'rgba(0, 122, 255, 0.1)') : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{v.icon}</Text>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14 }}>{v.name}</Text>
                      <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2 }}>{v.desc}</Text>
                    </View>
                    
                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={(e) => { e.stopPropagation(); togglePreview(v.id); }}
                      style={{ padding: 8, borderRadius: 20, backgroundColor: playingPreviewId === v.id ? 'rgba(255,59,48,0.1)' : 'rgba(0,242,254,0.1)' }}
                    >
                      {playingPreviewId === v.id ? <Square color="#FF3B30" size={18} fill="#FF3B30" /> : <Play color="#00F2FE" size={18} fill="#00F2FE" />}
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {voiceType === 'custom' && (
          <View style={{ marginTop: 8 }}>
            {/* 1. 高度な設定（アコーディオン）を上に！ */}
            <View style={{ marginBottom: 24 }}>
              <TouchableOpacity 
                onPress={() => setShowAdvanced(!showAdvanced)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF', 
                  padding: 16, 
                  borderRadius: 12, 
                  borderWidth: 1, 
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' 
                }}
              >
                <Text style={{ flex: 1, color: textColor, fontSize: 14, fontWeight: 'bold', lineHeight: 22 }}>
                  ✨ プレミアム機能 ✨{'\n'}
                  自分の声でAIアファメーションを{'\n'}
                  作成したい方は<Text style={{ color: '#FF3B30', textDecorationLine: 'underline' }}>コチラ</Text> ☞
                </Text>
                {showAdvanced ? <ChevronUp color={subTextColor} size={24} /> : <ChevronDown color={subTextColor} size={24} />}
              </TouchableOpacity>

              {showAdvanced && (
                <View style={{ backgroundColor: cardBg, marginTop: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor }}>
                  <Text style={{ color: textColor, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
                    ElevenLabsの有料プラン（Starterプラン: 月額約750円/$5）に登録してAPIキーを取得すると、あなた自身の声をAI化してアファメーションを作成できるようになります！🎉{'\n\n'}
                    ※生成した音声は無期限でアプリ内に保存して何度も聴けるため、生成したい月だけ登録し、その後解約することも可能です。
                  </Text>
                  
                  <TextInput
                    style={{ backgroundColor: inputBg, color: textColor, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: inputBorder, marginBottom: 16 }}
                    placeholder="ここにAPIキーを貼り付け (sk_...)"
                    placeholderTextColor={subTextColor}
                    value={elevenLabsApiKey || ''}
                    onChangeText={setElevenLabsApiKey}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={{ color: subTextColor, fontSize: 11, marginBottom: 12, lineHeight: 16 }}>
                    ※入力いただいたAPIキーは端末内に暗号化して保存され、開発者を含む外部に送信されることはありません。ElevenLabsの音声合成機能を利用するためにのみ、お使いの端末から直接使用されます。
                  </Text>
                  {elevenLabsApiKey ? (
                    <Text style={{ color: '#34C759', fontSize: 13, marginBottom: 16, fontWeight: 'bold' }}>✅ APIキー設定済み（フル機能解放中！）</Text>
                  ) : null}

                  <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 14, marginBottom: 12 }}>👇 有料APIキーの取得方法（3ステップ）</Text>
                  
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: textColor, fontWeight: 'bold', marginBottom: 4 }}>1️⃣ アカウント作成とStarterプランへの登録</Text>
                    <Text style={{ color: subTextColor, fontSize: 13, lineHeight: 18 }}>
                      ブラウザで「ElevenLabs」と検索するか、
                      <Text 
                        style={{ color: activeColor, textDecorationLine: 'underline' }} 
                        onPress={() => Linking.openURL('https://elevenlabs.io/')}
                      >
                        elevenlabs.io
                      </Text>
                      にアクセスし、アカウントを作成後、「Starter」プラン（$5/月）以上のプランに登録します。
                    </Text>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: textColor, fontWeight: 'bold', marginBottom: 4 }}>2️⃣ プロフィール画面からキーを作成</Text>
                    <Text style={{ color: subTextColor, fontSize: 13, lineHeight: 20, marginBottom: 8 }}>
                      ログイン後、画面のどこかにあるご自身のアイコンをタップして「使用状況分析（Usage analytics）」を選びます。{'\n'}
                      その後、ページ上部の「API Keys」という文字をタップし、「＋Create Key」ボタンを押して好きな名前を入力します。
                    </Text>
                    <Text style={{ color: subTextColor, fontSize: 13, lineHeight: 20, marginBottom: 8 }}>
                      <Text style={{ fontWeight: 'bold', color: '#FF3B30' }}>必ず「Restrict Key」のスイッチをオフ（灰色）にしてから</Text>作成ボタンを押してください。
                    </Text>
                    <Text style={{ color: subTextColor, fontSize: 12, lineHeight: 18, padding: 8, backgroundColor: isDarkMode ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.05)', borderRadius: 8, overflow: 'hidden' }}>
                      ※オフにすると赤い警告文（キー流出に注意という内容）が出ますが、このアプリ内にのみ保存され外部に共有されることはないため安心してください！そのまま作成して大丈夫です。
                    </Text>
                  </View>

                  <View style={{ marginBottom: 4 }}>
                    <Text style={{ color: textColor, fontWeight: 'bold', marginBottom: 4 }}>3️⃣ キーをコピーしてアプリに貼る</Text>
                    <Text style={{ color: subTextColor, fontSize: 13, lineHeight: 18 }}>
                      作成された「API Key」というパスワードのような文字列を全選択してコピーし、すぐ上の入力欄に貼り付ければ完了です！
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 2. 録音エリアを下に（APIキー入力までロックする） */}
            <View style={{ opacity: elevenLabsApiKey ? 1 : 0.4 }} pointerEvents={elevenLabsApiKey ? 'auto' : 'none'}>
              <Text style={[styles.label, { color: textColor, fontSize: 14, marginBottom: 8 }]}>自分の声を10秒ほど録音する</Text>
              {!elevenLabsApiKey && (
                 <Text style={{ color: '#FF3B30', fontSize: 12, marginBottom: 8, fontWeight: 'bold' }}>
                   ※上の「✨プレミアム機能✨」からAPIキーを設定すると録音機能が使えます
                 </Text>
              )}
              <View style={[styles.recorderRow, { backgroundColor: isDarkMode ? '#1A1A2E' : '#F0F8FF', padding: 16, borderRadius: 12 }]}>
                <TouchableOpacity 
                  style={[styles.miniRecordButton, isRecording && styles.recordingActiveButton]} 
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <Square color="#FF3B30" size={24} /> : <Mic color="#FFFFFF" size={24} />}
                </TouchableOpacity>
                <View style={{ marginLeft: 16, flex: 1 }}>
                   <Text style={[styles.recorderTitle, { color: textColor, fontSize: 15 }]}>
                     {isRecording ? '録音中...' : '録音ボタンをタップ'}
                   </Text>
                   <Text style={[styles.recorderDesc, { color: isRecording ? '#FF3B30' : subTextColor, fontSize: 12 }]}>
                     {isRecording ? formatTime(duration) : '話す内容は自由（自己紹介など）です'}
                   </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 3. 音声合成セクション */}
      <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor, alignItems: 'center' }, !generatedText && { opacity: 0.5 }]}>
        <Text style={[styles.label, { color: textColor, marginBottom: 8 }]}>3. 前向きなフレーズを音声にする</Text>
        
        <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
          ※「音声を合成して保存」をタップすると、データ送信への同意画面が表示されます。
        </Text>

        {isGeneratingAudio ? (
          <ActivityIndicator color="#00F2FE" size="large" />
        ) : (
          <TouchableOpacity 
            style={[
              styles.generateButton, 
              { backgroundColor: '#34C759', width: '100%' }, 
              !generatedText && styles.disabledButton
            ]} 
            onPress={() => setIsAIModalVisible(true)}
            disabled={!generatedText || isGeneratingAudio}
          >
            <Mic color="#FFFFFF" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>音声を合成して保存</Text>
          </TouchableOpacity>
        )}
      </View>


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
  
  textInput: { borderRadius: 8, paddingTop: 16, padding: 12, minHeight: 60, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1 },
  generateButton: { backgroundColor: '#00F2FE', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: '#0A0A1A', fontSize: 16, fontWeight: 'bold' },
  
  resultInput: { borderRadius: 12, paddingTop: 16, padding: 16, minHeight: 180, textAlignVertical: 'top', fontSize: 16, lineHeight: 28, borderWidth: 1 },
  
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
