import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ScrollView, Modal, SafeAreaView, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { useAppStore, Affirmation } from '../store/useAppStore';
import { Play, Pause, Square, Trash2, Heart, Settings2, SkipBack, SkipForward, Repeat, Repeat1, Mic, Sparkles, Volume2, Music, Edit2, Flame, X, Share2, Plus } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Visualization } from '../components/Visualization';

// カレンダーの日本語化設定
LocaleConfig.locales['ja'] = {
  monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
  dayNamesShort: ['日','月','火','水','木','金','土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'ja';

// --- 時間フォーマット関数 ---
const formatTime = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- プログレス表示コンポーネント（独立したレンダリング領域） ---
// 再生時間のたびにHomeScreen全体が再描画され、ボタンが重くなる現象を防ぐための工夫です
const AudioProgress = ({ 
  sound, 
  onFinish, 
  subTextColor,
  activeColor 
}: { 
  sound: Audio.Sound | null; 
  onFinish: () => void;
  subTextColor: string;
  activeColor: string;
}) => {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!sound) {
      setPosition(0);
      setDuration(0);
      return;
    }
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 0);
        if (status.didJustFinish) {
          onFinish();
        }
      }
    });
  }, [sound, onFinish]);

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.sliderRow}>
      <Text style={[styles.timeText, { color: subTextColor }]}>{formatTime(position)}</Text>
      <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(150,150,150,0.3)', marginHorizontal: 12, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: activeColor }} />
      </View>
      <Text style={[styles.timeText, { color: subTextColor }]}>
        {duration > 0 ? formatTime(duration) : '0:00'}
      </Text>
    </View>
  );
};

// --- リストの各アイテム（React.memoで不要な再描画を防ぐ） ---
const AffirmationListItem = React.memo(({ 
  item, index, isSelected, isEditing, editTitle,
  cardBg, activeColor, borderColor, textColor, subTextColor,
  onPress, onEditLongPress, onEditChangeText, onEditBlur, onToggleFavorite, onDelete, onShare
}: any) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.6}
      style={[styles.listItem, { backgroundColor: cardBg, borderColor: isSelected ? activeColor : borderColor }]}
      onPress={() => onPress(item.id)}
    >
      <Text style={[styles.listIndex, { color: subTextColor }]}>{index + 1}</Text>
      <View style={styles.listContent}>
        {isEditing ? (
          <TextInput
            style={[styles.editInput, { color: textColor, borderColor: activeColor }]}
            value={editTitle}
            onChangeText={onEditChangeText}
            onBlur={() => onEditBlur(item.id)}
            onSubmitEditing={() => onEditBlur(item.id)}
            autoFocus
          />
        ) : (
          <Text style={[styles.listTitle, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
        )}
      </View>
      <TouchableOpacity style={styles.listAction} onPress={() => onEditLongPress(item)}>
        <Edit2 color={subTextColor} size={18} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.listAction} onPress={() => onToggleFavorite(item.id)}>
        <Heart color={item.isFavorite ? '#FF3B30' : subTextColor} fill={item.isFavorite ? '#FF3B30' : 'none'} size={20} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.listAction} onPress={() => onShare(item)}>
        <Share2 color={subTextColor} size={18} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.listAction} onPress={() => onDelete(item.id, item.title)}>
        <Trash2 color="#FF3B30" size={20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}, (prev, next) => {
  return prev.isSelected === next.isSelected &&
         prev.isEditing === next.isEditing &&
         (prev.isEditing ? prev.editTitle === next.editTitle : true) &&
         prev.item.title === next.item.title &&
         prev.item.isFavorite === next.item.isFavorite &&
         prev.cardBg === next.cardBg &&
         prev.textColor === next.textColor;
});

export function PlayerScreen({ route, navigation }: any) {
  const store = useAppStore();
  const { affirmations, removeAffirmation, toggleFavorite, isDarkMode, voiceVolume, bgmVolume, bgmType, playlists, listenedDays, currentStreak, markListenedToday, bgImageUrl, customBgms, addCustomBgm, removeCustomBgm, isVisualizationEnabled } = store;

  const themeColors = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#F0F8FF', '#E6F4FE'];
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#A0AEC0' : '#8E8E93';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.65)';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';
  const activeColor = '#6B4EFF'; 
  const inactiveColor = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [bgmSound, setBgmSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loopMode, setLoopMode] = useState<0 | 1 | 2>(0); // 0:なし, 1:リストループ, 2:1曲ループ
  const [speed, setSpeed] = useState(1.0);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const bgmList = [
    { id: 'none', label: 'なし' },
    { id: '528hz', label: '癒やし(528Hz)', url: 'https://archive.org/download/528Hz_201904/528Hz.mp3' },
    { id: '432hz', label: '調和(432Hz)', url: 'https://archive.org/download/A432Hz/A432Hz.mp3' },
    { id: 'river', label: '川', url: 'https://archive.org/download/ForestStream_201708/ForestStream.mp3' },
    { id: 'waves', label: '海', url: 'https://cdn.freesound.org/previews/400/400632_5121236-lq.mp3' },
    { id: 'fire', label: '焚き火', url: 'https://archive.org/download/Campfire_201811/Campfire.mp3' },
    { id: 'relax', label: 'ピアノ(月光)', url: 'https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3' },
    { id: 'focus', label: 'ピアノ(カノン)', url: 'https://archive.org/download/CanonInD_261/CanoninD.mp3' }
  ];

  const handleAddCustomBgm = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // ファイルが一意かつ再起動後も読めるようにドキュメントフォルダへコピー
        const ext = asset.name.split('.').pop() || 'tmp';
        const localUri = FileSystem.documentDirectory + `custom_bgm_${Date.now()}.${ext}`;
        await FileSystem.copyAsync({ from: asset.uri, to: localUri });
        
        const newBgm = {
          id: `custom_${Date.now()}`,
          name: asset.name,
          uri: localUri,
        };
        addCustomBgm(newBgm);
        store.setBgmType(newBgm.id);
      }
    } catch (e) {
      console.warn('Custom BGM Add Error', e);
      Alert.alert('エラー', '音声ファイルの読み込みに失敗しました。');
    }
  };
  
  const [selectedId, setSelectedId] = useState<string | null>(affirmations.length > 0 ? affirmations[0].id : null);
  
  const [activeTab, setActiveTab] = useState<'all' | 'mic' | 'ai' | 'fav'>('all');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [bgmIsPlaying, setBgmIsPlaying] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [shareItem, setShareItem] = useState<Affirmation | null>(null);
  const viewShotRef = React.useRef<ViewShot>(null);
  const loadingActionId = React.useRef<number>(0);

  const handleShareButton = (item: Affirmation) => {
    setShareItem(item);
    setTimeout(async () => {
      try {
        if (viewShotRef.current && viewShotRef.current.capture) {
          const uri = await viewShotRef.current.capture();
          await Sharing.shareAsync(uri, {
            dialogTitle: 'アファメーションをシェア',
          });
          setShareItem(null);
        }
      } catch (err) {
        console.error(err);
        Alert.alert('エラー', '画像の生成に失敗しました');
        setShareItem(null);
      }
    }, 300); // UIへレンダリングされるのを待つ
  };

  // プレイリストの直接再生リクエストを受け取る
  const playPlaylistId = route?.params?.playPlaylistId;
  useEffect(() => {
    if (playPlaylistId) {
      setActivePlaylistId(playPlaylistId);
      setActiveTab('all'); // タブの見た目をリセット
      const pl = playlists.find(p => p.id === playPlaylistId);
      if (pl && pl.itemIds.length > 0) {
        setSelectedId(pl.itemIds[0]);
        // 再生準備
        setIsPlaying(false);
        setIsPaused(false);
      }
      navigation.setParams({ playPlaylistId: undefined });
    }
  }, [playPlaylistId, playlists, navigation]);

  // 特定の音声（録音・AIなど）の直接再生リクエストを受け取る
  const playAudioId = route?.params?.playAudioId;
  const triggerTab = route?.params?.triggerTab;
  useEffect(() => {
    if (playAudioId) {
      if (triggerTab) {
        setActiveTab(triggerTab);
      } else {
        setActiveTab('all');
      }
      setActivePlaylistId(null);
      setSelectedId(playAudioId);
      setIsPlaying(false);
      setIsPaused(false);
      navigation.setParams({ playAudioId: undefined, triggerTab: undefined });
    }
  }, [playAudioId, triggerTab, navigation]);

  const adjustVol = (current: number, setter: (v: number) => void, delta: number) => {
    let next = current + delta;
    if (next > 1.0) next = 1.0;
    if (next < 0.0) next = 0.0;
    setter(Math.round(next * 5) / 5); // 0.2単位に丸める
  };

  const isPlayingRef = React.useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const soundRef = React.useRef(sound);
  useEffect(() => { soundRef.current = sound; }, [sound]);

  const bgmSoundRef = React.useRef(bgmSound);
  useEffect(() => { bgmSoundRef.current = bgmSound; }, [bgmSound]);

  const loopModeRef = React.useRef(loopMode);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);

  const [isSeeking, setIsSeeking] = useState(false);
  const [playNextSignal, setPlayNextSignal] = useState(0);

  // コンポーネント破棄時に音声をアンロード
  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
      if (bgmSoundRef.current) bgmSoundRef.current.unloadAsync();
    };
  }, []);

  // アファメーション削除等でIdが消えた時のフォールバック
  useEffect(() => {
    if (selectedId && !affirmations.find(a => a.id === selectedId)) {
      setSelectedId(affirmations.length > 0 ? affirmations[0].id : null);
      if (soundRef.current) soundRef.current.stopAsync();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [affirmations, selectedId]);

  // ▼ BGMの動的切り替え（BGM設定を変えた時用）
  useEffect(() => {
    let isCancelled = false;
    const changeBgm = async () => {
      // 完全に独立したBGM管理
      if (!bgmIsPlaying) {
        if (bgmSound) {
          await bgmSound.stopAsync();
          await bgmSound.unloadAsync();
          if (!isCancelled) setBgmSound(null);
        }
        return;
      }
      
      if (bgmSound) {
        await bgmSound.stopAsync();
        await bgmSound.unloadAsync();
        if (!isCancelled) setBgmSound(null);
      }

      if (bgmType === 'none') {
        if (!isCancelled) setBgmIsPlaying(false);
        return;
      }
      
      let uriToPlay = '';
      const selectedBgmObj = bgmList.find(b => b.id === bgmType);
      const customBgmObj = customBgms.find(b => b.id === bgmType);

      if (selectedBgmObj && selectedBgmObj.url) {
        uriToPlay = selectedBgmObj.url;
        if (uriToPlay.startsWith('http')) {
          const localUri = FileSystem.documentDirectory + `bgm_cache_${selectedBgmObj.id}.mp3`;
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          if (!fileInfo.exists) {
            await FileSystem.downloadAsync(uriToPlay, localUri);
          }
          uriToPlay = localUri;
        }
      } else if (customBgmObj && customBgmObj.uri) {
        uriToPlay = customBgmObj.uri;
      }

      if (uriToPlay) {
        try {
          let targetBgmUri = uriToPlay;
          const currentDocDir = (FileSystem as any).documentDirectory;
          if (targetBgmUri.includes('/Documents/') && !targetBgmUri.startsWith(currentDocDir)) {
            const filename = targetBgmUri.split('/').pop();
            const correctedUri = `${currentDocDir}${filename}`;
            const check = await FileSystem.getInfoAsync(correctedUri);
            if (check.exists) {
              targetBgmUri = correctedUri;
            }
          }

          const { sound: createdBgm } = await Audio.Sound.createAsync(
            { uri: targetBgmUri },
            { shouldPlay: true, isLooping: true, volume: bgmVolume }
          );
          if (!isCancelled) setBgmSound(createdBgm);
          else createdBgm.unloadAsync(); // キャンセルされていれば破棄
        } catch (e) {
          console.warn('BGM dynamic load err', e);
        }
      }
    };
    
    changeBgm();
    
    return () => {
      isCancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgmType, bgmIsPlaying]);

  // 倍速・音量が変更されたときに即座に反映（処理を独立させて過剰コールを防ぐ）
  const speedRef = React.useRef(speed);
  useEffect(() => {
    if (sound && speedRef.current !== speed) {
      sound.setRateAsync(speed, true, Audio.PitchCorrectionQuality.High).catch(e => console.warn(e));
      speedRef.current = speed;
    }
  }, [speed, sound]);

  const volRef = React.useRef(voiceVolume);
  useEffect(() => {
    if (sound && volRef.current !== voiceVolume) {
      sound.setVolumeAsync(voiceVolume).catch(e => console.warn(e));
      volRef.current = voiceVolume;
    }
  }, [voiceVolume, sound]);

  const bgmVolRef = React.useRef(bgmVolume);
  useEffect(() => {
    if (bgmSound && bgmVolRef.current !== bgmVolume) {
      bgmSound.setVolumeAsync(bgmVolume).catch(e => console.warn(e));
      bgmVolRef.current = bgmVolume;
    }
  }, [bgmVolume, bgmSound]);

  const playAudio = async (item: Affirmation) => {
    const actionId = ++loadingActionId.current;
    
    try {
      store.markListenedToday(); // ここでストリーク記録！
      
      // 1. 今鳴っている音声を即座に停止して破棄
      if (soundRef.current) {
        const prevSound = soundRef.current;
        setSound(null);
        setIsPlaying(false);
        await prevSound.unloadAsync().catch(e => console.warn('prev unload err', e));
      }

      // 中断チェック
      if (actionId !== loadingActionId.current) return;

      let targetUri = item.uri;
      const currentDocDir = (FileSystem as any).documentDirectory;

      // 【重要】パス補正ロジック
      if (targetUri.includes('/Documents/') && !targetUri.startsWith(currentDocDir)) {
        const filename = targetUri.split('/').pop();
        const correctedUri = `${currentDocDir}${filename}`;
        const check = await FileSystem.getInfoAsync(correctedUri);
        if (check.exists) {
          targetUri = correctedUri;
        }
      }

      let newSound;
      try {
        const result = await Audio.Sound.createAsync(
          { uri: targetUri },
          { 
            shouldPlay: false, 
            shouldCorrectPitch: true, 
            pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
            volume: volRef.current,
            isLooping: false
          }
        );
        newSound = result.sound;
        
        // 中断チェック（ロード中に別の曲が選ばれた場合）
        if (actionId !== loadingActionId.current) {
          await newSound.unloadAsync().catch(() => {});
          return;
        }

        await newSound.setRateAsync(speedRef.current, true, Audio.PitchCorrectionQuality.High);
        await newSound.playAsync();
        
      } catch (err: any) {
        // ... (Error UI) ...
        if (actionId !== loadingActionId.current) return;

        console.error('Core Audio Load Err:', err);
        Alert.alert(
          '再生エラー', 
          '音声ファイルが見つからないか、破損しています。この項目をリストから削除しますか？',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: '削除する', style: 'destructive', onPress: () => removeAffirmation(item.id) }
          ]
        );
        return;
      }
      
      setSound(newSound);
      setIsPlaying(true);
      setIsPaused(false);
      setSelectedId(item.id);

    } catch (error) {
      if (actionId === loadingActionId.current) {
        console.error('再生エラー全般:', error);
        Alert.alert('エラー', '再生中に予期せぬエラーが発生しました。');
      }
    }
  };

  const stopAudio = async () => {
    setIsPlaying(false);
    setIsPaused(false);
    if (soundRef.current) await soundRef.current.stopAsync();
  };

  const togglePause = async () => {
    if (!soundRef.current) return;
    if (isPaused) {
      await soundRef.current.playAsync();
      setIsPaused(false);
    } else {
      await soundRef.current.pauseAsync();
      setIsPaused(true);
    }
  };

  // --- 独立したBGMコントロール ---
  const handleBgmPlayToggle = () => {
    if (bgmType === 'none') {
      Alert.alert('BGM', '先にBGMを選択してください。');
      return;
    }
    setBgmIsPlaying(!bgmIsPlaying);
  };

  const handleBgmStop = async () => {
    if (bgmSound) {
      await bgmSound.stopAsync();
      await bgmSound.unloadAsync();
      setBgmSound(null);
    }
    setBgmIsPlaying(false);
  };
  // -------------------------

  const toggleLooping = () => {
    setLoopMode((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
  };

  const handleMainPlayToggle = () => {
    if (!selectedId) return;
    if (isPlaying) {
      togglePause();
    } else {
      const selectedItem = affirmations.find(a => a.id === selectedId);
      if (selectedItem) playAudio(selectedItem);
    }
  };

  const handleSeek = async (value: number) => {
    if (sound) await sound.setPositionAsync(value);
    setIsSeeking(false);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('削除の確認', `「${title}」をプレイリストから削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => {
        if (selectedId === id) stopAudio();
        removeAffirmation(id);
      }}
    ]);
  };

  const handleEditTitle = (item: Affirmation) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };
  
  const saveTitle = (id: string) => {
    if (editTitle.trim()) {
      store.updateTitle(id, editTitle);
    }
    setEditingId(null);
  };

  const getFilteredAffirmations = () => {
    if (activePlaylistId) {
      const pl = playlists.find(p => p.id === activePlaylistId);
      if (pl) {
        return pl.itemIds.map(id => affirmations.find(a => a.id === id)).filter(Boolean) as Affirmation[];
      }
    }
    return affirmations.filter(item => {
      if (activeTab === 'fav') return item.isFavorite;
      if (activeTab === 'mic') return !item.title.startsWith('AI生成');
      if (activeTab === 'ai') return item.title.startsWith('AI生成');
      return true;
    });
  };

  const selectedItem = affirmations.find(a => a.id === selectedId);
  const filteredList = getFilteredAffirmations();

  // シグナルを受け取って次の曲を再生
  useEffect(() => {
    if (playNextSignal > 0) {
      const currentIndex = filteredList.findIndex(a => a.id === selectedId);
      if (currentIndex !== -1) {
        if (currentIndex + 1 < filteredList.length) {
          // 次の曲がある場合は再生
          const nextItem = filteredList[currentIndex + 1];
          playAudio(nextItem);
        } else if (loopModeRef.current === 1) {
          // リストの最後まできたら最初の曲に戻ってループ
          playAudio(filteredList[0]);
        } else {
          // ループOFFで最後まできたら終了
          setIsPlaying(false);
          setIsPaused(false);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playNextSignal]);

  const MemoizedSpeedSlider = React.useMemo(() => {
    const MemoSlider = React.memo(({ currentSpeed, onCommit, active, inactive }: any) => (
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={1}
        maximumValue={10}
        step={0.1}
        value={currentSpeed}
        onSlidingComplete={onCommit}
        minimumTrackTintColor={active}
        maximumTrackTintColor={inactive}
        thumbTintColor={active}
      />
    ), (prev, next) => prev.currentSpeed === next.currentSpeed && prev.active === next.active);
    
    return <MemoSlider currentSpeed={speed} onCommit={setSpeed} active={activeColor} inactive={inactiveColor} />;
  }, [speed, activeColor, inactiveColor]);

  // --- List Header (Main Player View) ---
  const renderHeader = () => (
    <View style={{ paddingBottom: 16 }}>
      {/* ストリークバッジ表示 */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,149,0,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,149,0,0.3)' }}
          onPress={() => setShowCalendar(true)}
        >
          <Flame color="#FF9500" size={20} style={{ marginRight: 6 }} />
          <Text style={{ color: '#FF9500', fontWeight: 'bold', fontSize: 14 }}>{currentStreak || 0}日連続クリア！</Text>
        </TouchableOpacity>
      </View>

      {/* 画面上部：再生テキスト表示領域 */}
      <View style={[styles.textAreaContainer, { backgroundColor: cardBg, borderColor }]}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
          <Text style={[styles.mainText, { color: textColor }]}>
            {selectedItem?.text || selectedItem?.title || 'アファメーションを選択してください。'}
          </Text>
        </ScrollView>
      </View>

      {/* プレイヤーコントロール群 (Boxed) */}
      <View style={[styles.playerContainer, { backgroundColor: cardBg, borderColor, padding: 20, borderRadius: 20, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }]}>
        <AudioProgress 
          sound={sound} 
          onFinish={async () => {
             if (loopModeRef.current === 2 && sound) {
               // 1曲だけを繰り返す
               await sound.replayAsync();
             } else if (loopModeRef.current === 1 && filteredList.length === 1 && sound) {
               // リストループだがリスト内に1曲しかない場合
               await sound.replayAsync();
             } else {
               setPlayNextSignal(Date.now());
             }
          }} 
          subTextColor={subTextColor} 
          activeColor={activeColor} 
        />

        {/* メインボタン群 */}
        <View style={[styles.mainControlsRow, { marginTop: 16 }]}>
          <TouchableOpacity onPress={toggleLooping} style={styles.iconButton}>
            {loopMode === 2 ? (
              <Repeat1 color={activeColor} size={28} />
            ) : (
              <Repeat color={loopMode === 1 ? activeColor : subTextColor} size={28} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.playPauseButton, { backgroundColor: activeColor, width: 72, height: 72, borderRadius: 36, shadowColor: activeColor, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }]} 
            onPress={handleMainPlayToggle}
          >
            {(isPlaying && !isPaused) ? <Pause color="#FFF" size={32} /> : <Play color="#FFF" size={32} style={{ marginLeft: 6 }} />}
          </TouchableOpacity>

          <View style={{ alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 }}>
            <TouchableOpacity onPress={() => setSpeed(Math.min(10, Math.floor(speed) + 1))} style={{ paddingHorizontal: 16 }}>
              <Text style={{ color: activeColor, fontSize: 20, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
            <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 16, marginVertical: 4 }}>{speed.toFixed(1)}x</Text>
            <TouchableOpacity onPress={() => setSpeed(Math.max(1, Math.floor(speed) - 1))} style={{ paddingHorizontal: 16 }}>
              <Text style={{ color: activeColor, fontSize: 22, fontWeight: 'bold', lineHeight: 22 }}>-</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 倍速・スライダー設定群 */}
        <View style={[styles.speedSection, { backgroundColor: cardBg, borderColor, padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 12 }]}>
          <Text style={{ color: textColor, fontWeight: 'bold', marginBottom: 12 }}>再生速度</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[1, 2, 4, 6, 10].map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.speedChip, 
                  { 
                    backgroundColor: speed === s ? activeColor : inactiveColor, 
                    borderColor: speed === s ? activeColor : borderColor,
                    flex: 1,
                    marginHorizontal: 4,
                  }
                ]}
                onPress={() => setSpeed(s)}
              >
                <Text style={{ color: speed === s ? '#FFF' : textColor, fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>{s}x</Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>

        {/* BGM・音量設定トグル */}
        <TouchableOpacity 
          style={[styles.settingsToggle, { backgroundColor: cardBg, borderColor }]} 
          onPress={() => setShowSettings(!showSettings)}
        >
          <Settings2 color={activeColor} size={20} />
          <Text style={[styles.settingsToggleText, { color: textColor }]}>音量 & BGM設定</Text>
        </TouchableOpacity>

        {showSettings && (
          <View style={[styles.settingsPanel, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.volRow}>
              <Text style={{color: textColor, fontSize: 13, marginRight: 8, width: 60}}>BGM選択:</Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', flex: 1}}>
                {bgmList.map((bgm) => (
                  <TouchableOpacity 
                    key={bgm.id} 
                    style={[styles.bgmChip, { backgroundColor: bgmType === bgm.id ? activeColor : inactiveColor, marginBottom: 8 }]}
                    onPress={() => store.setBgmType(bgm.id)}
                  >
                    <Text style={{color: bgmType === bgm.id ? '#FFF' : textColor, fontSize: 12, fontWeight: '500'}}>{bgm.label}</Text>
                  </TouchableOpacity>
                ))}
                {customBgms.map((bgm) => (
                  <View key={bgm.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginRight: 8 }}>
                    <TouchableOpacity 
                      style={[styles.bgmChip, { backgroundColor: bgmType === bgm.id ? activeColor : inactiveColor, marginRight: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                      onPress={() => store.setBgmType(bgm.id)}
                    >
                      <Text style={{color: bgmType === bgm.id ? '#FFF' : textColor, fontSize: 12, fontWeight: '500'}} numberOfLines={1} ellipsizeMode="middle">{bgm.name.length > 8 ? bgm.name.substring(0,8)+'...' : bgm.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.bgmChip, { backgroundColor: '#FF3B30', paddingHorizontal: 8, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                      onPress={() => {
                        if (bgmType === bgm.id) store.setBgmType('none');
                        removeCustomBgm(bgm.id);
                        FileSystem.deleteAsync(bgm.uri, { idempotent: true });
                      }}
                    >
                      <X color="#FFF" size={14} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity 
                  style={[styles.bgmChip, { backgroundColor: inactiveColor, marginBottom: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: activeColor }]}
                  onPress={handleAddCustomBgm}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Plus color={textColor} size={14} style={{ marginRight: 4 }} />
                    <Text style={{color: textColor, fontSize: 12, fontWeight: '500'}}>端末から追加</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.volRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: 60 }}>
                <Mic color={textColor} size={20} />
                <Text style={{ color: subTextColor, fontSize: 11, marginLeft: 4 }}>声</Text>
              </View>
              <View style={styles.volControlArea}>
                <TouchableOpacity onPress={() => adjustVol(voiceVolume, store.setVoiceVolume, -0.2)} style={[styles.volBtn, { borderColor }]}>
                  <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold' }}>-</Text>
                </TouchableOpacity>
                <Text style={{ color: textColor, width: 44, textAlign: 'center', fontWeight: 'bold' }}>{Math.round(voiceVolume * 100)}%</Text>
                <TouchableOpacity onPress={() => adjustVol(voiceVolume, store.setVoiceVolume, 0.2)} style={[styles.volBtn, { borderColor }]}>
                  <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.volRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: 60 }}>
                <Music color={bgmType !== 'none' ? textColor : subTextColor} size={20} />
              </View>
              {bgmType !== 'none' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <TouchableOpacity onPress={handleBgmPlayToggle} style={{ padding: 6, backgroundColor: activeColor, borderRadius: 16, marginRight: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
                    {bgmIsPlaying ? <Pause color="#FFF" size={14} /> : <Play color="#FFF" size={14} style={{ marginLeft: 3 }} />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleBgmStop} style={{ padding: 6, backgroundColor: cardBg, borderColor, borderWidth: 1, borderRadius: 16 }}>
                    <Square color="#FF3B30" size={14} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.volControlArea}>
                <TouchableOpacity onPress={() => adjustVol(bgmVolume, store.setBgmVolume, -0.2)} style={[styles.volBtn, { borderColor }]}>
                  <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold' }}>-</Text>
                </TouchableOpacity>
                <Text style={{ color: textColor, width: 44, textAlign: 'center', fontWeight: 'bold' }}>{Math.round(bgmVolume * 100)}%</Text>
                <TouchableOpacity onPress={() => adjustVol(bgmVolume, store.setBgmVolume, 0.2)} style={[styles.volBtn, { borderColor }]}>
                  <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* カテゴリタブ */}
      <View style={styles.tabsRow}>
        {[
          { id: 'all', label: 'すべて' },
          { id: 'mic', label: '録音' },
          { id: 'ai', label: 'AI生成' },
          { id: 'fav', label: 'お気に入り' }
        ].map(tab => (
          <TouchableOpacity 
            key={tab.id}
            style={[
              styles.tabChip,
              { backgroundColor: (activeTab === tab.id && !activePlaylistId) ? activeColor : inactiveColor }
            ]}
            onPress={() => {
              setActiveTab(tab.id as any);
              setActivePlaylistId(null);
            }}
          >
            <Text style={{ color: (activeTab === tab.id && !activePlaylistId) ? '#FFF' : textColor, fontSize: 13, fontWeight: '600' }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {activePlaylistId ? (
        <View style={{ marginBottom: 16, paddingHorizontal: 4 }}>
          <Text style={{ color: activeColor, fontWeight: 'bold' }}>
            🎵 プレイリスト「{playlists.find(p => p.id === activePlaylistId)?.name}」を再生中...
          </Text>
        </View>
      ) : null}
    </View>
  );

  const renderCalendarModal = () => {
    const markedDates: any = {};
    Object.keys(listenedDays).forEach(date => {
      if (listenedDays[date]) {
        markedDates[date] = { selected: true, selectedColor: '#FF9500' };
      }
    });

    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().split('T')[0];
    if (markedDates[localISOTime]) {
      markedDates[localISOTime].marked = true;
    } else {
      markedDates[localISOTime] = { marked: true, dotColor: activeColor };
    }

    return (
      <Modal visible={showCalendar} animationType="slide" transparent={true}>
        <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>記録カレンダー</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCalendar(false)}>
                <X color={textColor} size={28} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Flame color="#FF9500" size={48} />
                <Text style={{ color: textColor, fontSize: 24, fontWeight: 'bold', marginTop: 12 }}>
                  現在 {currentStreak || 0} 日連続！
                </Text>
              </View>

              <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor }}>
                <Calendar
                  theme={{
                    backgroundColor: cardBg,
                    calendarBackground: cardBg,
                    textSectionTitleColor: subTextColor,
                    selectedDayBackgroundColor: '#FF9500',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: activeColor,
                    dayTextColor: textColor,
                    textDisabledColor: inactiveColor,
                    monthTextColor: textColor,
                    arrowColor: activeColor,
                    textDayFontWeight: '500',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '500',
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14
                  }}
                  markedDates={markedDates}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {bgImageUrl ? (
        <>
          <Image source={{ uri: bgImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(10,10,26,0.7)' : 'rgba(255,255,255,0.45)' }]} />
        </>
      ) : (
        <LinearGradient colors={themeColors as [string, string]} style={StyleSheet.absoluteFill} />
      )}
      {isVisualizationEnabled && <Visualization isDarkMode={isDarkMode} />}
      {/* 
        ★ ScrollViewで全体を囲むとネストエラー・パフォーマンス低下を招くため削除！ 
        代わりに FlatList の ListHeaderComponent を使って上部のPlayer領域を描画します。
      */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        extraData={{ isPlaying, isPaused, speed, showSettings, bgmVolume, voiceVolume, bgmType, activeTab, loopMode, bgmIsPlaying, cardBg, activeColor, textColor, activePlaylistId }}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <AffirmationListItem 
            item={item}
            index={index}
            isSelected={selectedId === item.id}
            isEditing={editingId === item.id}
            editTitle={editTitle}
            cardBg={cardBg}
            activeColor={activeColor}
            borderColor={borderColor}
            textColor={textColor}
            subTextColor={subTextColor}
            onPress={(id: string) => {
              if (selectedId !== id) {
                // UI切り替えを瞬時に行うためセットだけ先にやる
                setSelectedId(id);
                // レンダリング完了後に重いAudio破棄を実行させるため50ms遅延
                setTimeout(() => {
                  if (isPlayingRef.current) {
                    // もし再生状態なら、瞬時に新しい曲へオートプレイ
                    const nextItem = affirmations.find(a => a.id === id);
                    if (nextItem) playAudio(nextItem);
                  } else {
                    // 停止状態ならただの選択切り替えとしてAudioを停止
                    if (soundRef.current) soundRef.current.stopAsync();
                    setIsPlaying(false);
                    setIsPaused(false);
                  }
                }, 50);
              }
            }}
            onEditLongPress={handleEditTitle}
            onEditChangeText={setEditTitle}
            onEditBlur={saveTitle}
            onToggleFavorite={toggleFavorite}
            onDelete={handleDelete}
            onShare={handleShareButton}
          />
        )}
      />
      {renderCalendarModal()}
      
      {shareItem && (
        <View style={{ position: 'absolute', left: -5000, top: 0 }}>
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
            <View style={{ width: 1080, height: 1080, backgroundColor: isDarkMode ? '#0A0A1A' : '#F0F8FF', justifyContent: 'center', alignItems: 'center' }}>
              {bgImageUrl ? (
                <>
                  <Image source={{ uri: bgImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(10,10,26,0.5)' : 'rgba(255,255,255,0.3)' }]} />
                </>
              ) : (
                <LinearGradient colors={themeColors as [string, string]} style={StyleSheet.absoluteFill} />
              )}
              
              <View style={{ width: '85%', padding: 40, backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor }}>
                <Text style={{ color: textColor, fontSize: 48, fontWeight: 'bold', textAlign: 'center', lineHeight: 68 }}>
                  "{shareItem.title}"
                </Text>
              </View>
              
              <View style={{ position: 'absolute', bottom: 60, alignItems: 'center', flexDirection: 'row', backgroundColor: cardBg, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 40, borderWidth: 1, borderColor }}>
                <Flame color="#FF9500" size={32} />
                <Text style={{ color: textColor, fontSize: 24, fontWeight: 'bold', marginLeft: 12, marginRight: 20 }}>
                  {currentStreak || 0} 日連続クリア！
                </Text>
                  |   AI×倍速×アファーメーション
              </View>
            </View>
          </ViewShot>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  textAreaContainer: {
    height: 280,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  mainText: { fontSize: 16, lineHeight: 28, fontWeight: '500', letterSpacing: 0.5 },
  playerContainer: { marginBottom: 20 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
  timeText: { fontSize: 13, width: 38, textAlign: 'center' },
  mainControlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, paddingHorizontal: 16, gap: 40 }, 
  iconButton: { padding: 12 },
  playPauseButton: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', shadowColor: '#4A3AFF', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  speedSection: { marginBottom: 20 },
  speedLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  speedButtonsGrid: { gap: 8 },
  speedButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, paddingHorizontal: 4 },
  speedChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  settingsToggle: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  settingsToggleText: { marginLeft: 8, fontSize: 14, fontWeight: '600' },
  settingsPanel: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  volRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  tabsRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  tabChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  listIndex: { fontSize: 14, width: 24 },
  listContent: { flex: 1, justifyContent: 'center' },
  listTitle: { fontSize: 16, fontWeight: '500' },
  editInput: { fontSize: 16, fontWeight: '500', paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderRadius: 8 },
  listAction: { padding: 8, marginLeft: 4 },
  bgmChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  volControlArea: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  volBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' }
});
