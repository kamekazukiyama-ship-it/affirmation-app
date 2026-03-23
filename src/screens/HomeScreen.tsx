import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { useAppStore, Affirmation } from '../store/useAppStore';
import { Play, Pause, Square, Trash2, Heart, Settings2, SkipBack, SkipForward, Repeat, Mic, Sparkles, Volume2, Music, Edit2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  onPress, onEditLongPress, onEditChangeText, onEditBlur, onToggleFavorite, onDelete
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

export function HomeScreen() {
  const store = useAppStore();
  const { affirmations, removeAffirmation, toggleFavorite, isDarkMode, voiceVolume, bgmVolume, bgmType } = store;

  const themeColors = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#F0F8FF', '#E6F4FE'];
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#A0AEC0' : '#8E8E93';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';
  const activeColor = '#4A3AFF'; 
  const inactiveColor = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [bgmSound, setBgmSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const bgmList = [
    { id: 'none', label: 'なし' },
    { id: 'relax', label: 'リラックス', url: 'https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3' }, // Pixabayリンク切れのため代替
    { id: 'focus', label: '集中', url: 'https://archive.org/download/CanonInD_261/CanoninD.mp3' },
    { id: 'positive', label: 'ポジティブ', url: 'https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3' }
  ];
  
  const [selectedId, setSelectedId] = useState<string | null>(affirmations.length > 0 ? affirmations[0].id : null);
  
  const [activeTab, setActiveTab] = useState<'all' | 'mic' | 'ai' | 'fav'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [bgmIsPlaying, setBgmIsPlaying] = useState(false);

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
      
      const selectedBgmObj = bgmList.find(b => b.id === bgmType);
      if (selectedBgmObj && selectedBgmObj.url) {
        try {
          const { sound: createdBgm } = await Audio.Sound.createAsync(
            { uri: selectedBgmObj.url },
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
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();

      let newSound;
      try {
        const result = await Audio.Sound.createAsync(
          { uri: item.uri },
          { 
            shouldPlay: false, // 最初は停止状態で用意し、のちに正しくレートと音量を適用してから再生開始
            shouldCorrectPitch: true, 
            pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
            volume: volRef.current, // ここでもStale Closure回避のためrefを利用
            isLooping: false // iOSのループバグ回避
          }
        );
        newSound = result.sound;
        
        // iOS特有の「オーディオロード時の1周目だけsetRateが効かない」バグを完全回避
        await newSound.setRateAsync(speedRef.current, true, Audio.PitchCorrectionQuality.High);
        await newSound.playAsync();
        
      } catch (err: any) {
        console.error('Core Audio Load Err:', err);
        Alert.alert(
          '再生エラー', 
          '音声ファイルが見つかりません。アプリの再インストール等でファイルが消失した可能性があります。\nこの項目をリストから削除しますか？',
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
      console.error('再生エラー全般:', error);
      Alert.alert('エラー', '再生中に予期せぬエラーが発生しました。');
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

  const toggleLooping = async () => {
    setIsLooping(!isLooping);
    // iOSネイティブのループバグ回避のため setIsLoopingAsync は使わず、JS側で再生完了時に replayAsync を呼ぶ仕様に変更します
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
      if (currentIndex !== -1 && currentIndex + 1 < filteredList.length) {
        // 次の曲がある場合は再生
        const nextItem = filteredList[currentIndex + 1];
        playAudio(nextItem);
      } else {
        // リストの最後まできたら終了
        setIsPlaying(false);
        setIsPaused(false);
      }
    }
  }, [playNextSignal]);

  // --- List Header (Main Player View) ---
  const renderHeader = () => (
    <View style={{ paddingBottom: 16 }}>
      {/* 画面上部：再生テキスト表示領域 */}
      <View style={[styles.textAreaContainer, { backgroundColor: cardBg, borderColor }]}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
          <Text style={[styles.mainText, { color: textColor }]}>
            {selectedItem?.text || selectedItem?.title || 'アファメーションを選択してください。'}
          </Text>
        </ScrollView>
      </View>

      {/* プレイヤーコントロール群 */}
      <View style={styles.playerContainer}>
        {/* 新しく独立したプログレス（時間とバー）表示 */}
        <AudioProgress 
          sound={sound} 
          onFinish={async () => {
            if (isLooping && sound) {
              await sound.replayAsync(); // 手動でループ処理（iOSピッチ補正バグ回避）
            } else {
              setPlayNextSignal(Date.now());
            }
          }} 
          subTextColor={subTextColor} 
          activeColor={activeColor} 
        />

        {/* メインボタン群 */}
        <View style={styles.mainControlsRow}>
          <TouchableOpacity onPress={toggleLooping} style={styles.iconButton}>
            <Repeat color={isLooping ? activeColor : subTextColor} size={28} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.playPauseButton, { backgroundColor: activeColor }]} 
            onPress={handleMainPlayToggle}
          >
            {(isPlaying && !isPaused) ? <Pause color="#FFF" size={36} /> : <Play color="#FFF" size={36} style={{ marginLeft: 6 }} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={stopAudio} style={styles.iconButton}>
            <Square color={isPlaying ? '#FF3B30' : subTextColor} size={28} />
          </TouchableOpacity>
        </View>

        {/* 倍速ボタン群 */}
        <View style={styles.speedSection}>
          <Text style={[styles.speedLabel, { color: textColor }]}>再生速度: {speed.toFixed(1)}x</Text>
          <View style={styles.speedButtonsGrid}>
            <View style={styles.speedButtonsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.speedChip, 
                    { backgroundColor: speed === s ? activeColor : inactiveColor, borderColor: speed === s ? activeColor : borderColor }
                  ]}
                  onPress={() => setSpeed(s)}
                >
                  <Text style={{ color: speed === s ? '#FFF' : textColor, fontWeight: 'bold', fontSize: 13 }}>{s}x</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.speedButtonsRow}>
              {[6, 7, 8, 9, 10].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.speedChip, 
                    { backgroundColor: speed === s ? activeColor : inactiveColor, borderColor: speed === s ? activeColor : borderColor }
                  ]}
                  onPress={() => setSpeed(s)}
                >
                  <Text style={{ color: speed === s ? '#FFF' : textColor, fontWeight: 'bold', fontSize: 13 }}>{s}x</Text>
                </TouchableOpacity>
              ))}
            </View>
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
                {bgmList.map(bgm => (
                  <TouchableOpacity 
                    key={bgm.id} 
                    style={[styles.bgmChip, { backgroundColor: bgmType === bgm.id ? activeColor : inactiveColor, marginBottom: 8 }]}
                    onPress={() => store.setBgmType(bgm.id)}
                  >
                    <Text style={{color: bgmType === bgm.id ? '#FFF' : textColor, fontSize: 12, fontWeight: '500'}}>{bgm.label}</Text>
                  </TouchableOpacity>
                ))}
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
              { backgroundColor: activeTab === tab.id ? activeColor : inactiveColor }
            ]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={{ color: activeTab === tab.id ? '#FFF' : textColor, fontSize: 13, fontWeight: '600' }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
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
        extraData={{ isPlaying, isPaused, speed, showSettings, bgmVolume, voiceVolume, bgmType, activeTab, isLooping, bgmIsPlaying, cardBg, activeColor, textColor }}
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
          />
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  textAreaContainer: {
    height: 300,
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
