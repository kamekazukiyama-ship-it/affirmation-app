import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ScrollView, Modal, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Slider from '@react-native-community/slider';
import { useAppStore, Affirmation } from '../store/useAppStore';
import { Play, Pause, Square, Trash2, Heart, Settings2, SkipBack, SkipForward, Repeat, Repeat1, Mic, Sparkles, Volume2, Music, Edit2, Flame, X, Share2, Plus } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Visualization } from '../components/Visualization';
import { getTranslation } from '../i18n/translations';
import { useNavigation } from '@react-navigation/native';

// カレンダーの設定
LocaleConfig.locales['ja'] = {
  monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
  dayNamesShort: ['日','月','火','水','木','金','土'],
  today: '今日'
};
LocaleConfig.locales['en'] = {
  monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  today: 'Today'
};

// --- BGMリストの定義（コンポーネントの外に置いて安全を確保） ---
const getBgmList = (lang: string) => [
  { id: 'none', label: lang === 'en' ? 'None' : 'なし' },
  { id: 'focus', label: lang === 'en' ? 'Piano (Canon) *' : 'ピアノ(カノン) ★', url: 'https://archive.org/download/CanonInD_261/CanoninD.mp3', tag: lang === 'en' ? 'Classic' : '定番' },
  { id: 'moonlight', label: lang === 'en' ? 'Piano (Moonlight) *' : 'ピアノ(月光) ★', url: 'https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3', tag: lang === 'en' ? 'Classic' : '定番' },
  { id: 'bgm1', label: 'BGM1', source: require('../../assets/bgm/bgm_1.mp4'), tag: lang === 'en' ? 'Classic' : '定番' },
  { id: 'bgm2', label: 'BGM2', source: require('../../assets/bgm/bgm_2.mp4'), tag: lang === 'en' ? 'Classic' : '定番' },
  { id: '396hz', label: lang === 'en' ? 'Release (396Hz)' : '解放 (396Hz)', source: require('../../assets/bgm/bgm_396hz.mp3'), tag: lang === 'en' ? 'Solfeggio' : 'ソルフェ' },
  { id: '432hz', label: lang === 'en' ? 'Universe (432Hz)' : '宇宙 (432Hz)', source: require('../../assets/bgm/bgm_432hz.mp3'), tag: lang === 'en' ? 'Solfeggio' : 'ソルフェ' },
  { id: '528hz', label: lang === 'en' ? 'Miracle (528Hz)' : '奇跡 (528Hz)', source: require('../../assets/bgm/bgm_528hz.mp3'), tag: lang === 'en' ? 'Solfeggio' : 'ソルフェ' },
  { id: '852hz', label: lang === 'en' ? 'Awakening (852Hz)' : '覚醒 (852Hz)', source: require('../../assets/bgm/bgm_852hz.mp3'), tag: lang === 'en' ? 'Solfeggio' : 'ソルフェ' },
  { id: '963hz', label: lang === 'en' ? 'Universe Mind (963Hz)' : '宇宙意識 (963Hz)', source: require('../../assets/bgm/bgm_963hz.mp3'), tag: lang === 'en' ? 'Solfeggio' : 'ソルフェ' },
  { id: 'river_local', label: lang === 'en' ? 'River' : '川のせせらぎ', source: require('../../assets/bgm/bgm_river_local.mp3'), tag: lang === 'en' ? 'Nature' : '自然' },
  { id: 'fire_local', label: lang === 'en' ? 'Campfire' : '焚き火', source: require('../../assets/bgm/bgm_fire_local.mp3'), tag: lang === 'en' ? 'Nature' : '自然' },
  { id: 'birds_local', label: lang === 'en' ? 'Bird Songs' : '鳥のさえずり', source: require('../../assets/bgm/bgm_birds_local.mp3'), tag: lang === 'en' ? 'Nature' : '自然' },
  { id: 'noise_local', label: lang === 'en' ? 'White Noise' : 'ホワイトノイズ', source: require('../../assets/bgm/bgm_noise.mp3'), tag: lang === 'en' ? 'Nature' : '自然' },
];

// --- 時間フォーマット関数 ---
const formatTime = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- プログレス表示コンポーネント（独立したレンダリング領域） ---
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

// --- ヘッダーコンポーネント（独立させて再マウントを防止） ---
const PlayerHeader = React.memo(({ 
  currentStreak, setShowCalendar, MemoizedAffirmationArea, 
  sound, setPlayNextSignal, subTextColor, activeColor,
  loopMode, toggleLooping, isPlaying, isPaused, handleMainPlayToggle,
  speed, isPremium, showPremiumLimitAlert, setSpeed,
  textColor, cardBg, borderColor, inactiveColor,
  showSettings, setShowSettings, MemoizedBgmRow, 
  voiceVolume, adjustVol, setVoiceVolume, bgmType, handleBgmPlayToggle, 
  isBgmLoading, bgmIsPlaying, handleBgmStop, bgmVolume, setBgmVolume,
  MemoizedTabsRow, activePlaylistId, playlists
}: any) => {
  const language = useAppStore(state => state.language);
  return (
    <View style={{ paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,149,0,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,149,0,0.3)' }}
          onPress={() => setShowCalendar(true)}
        >
          <Flame color="#FF9500" size={20} style={{ marginRight: 6 }} />
          <Text style={{ color: '#FF9500', fontWeight: 'bold', fontSize: 14 }}>
            {getTranslation(language, 'dash', 'currentStreak').replace('{0}', String(currentStreak || 0))}
          </Text>
        </TouchableOpacity>
      </View>
      
      {MemoizedAffirmationArea}
      
      <View style={styles.playerContainer}>
        <AudioProgress 
          sound={sound} 
          onFinish={() => setPlayNextSignal((s: any) => s + 1)}
          subTextColor={subTextColor}
          activeColor={activeColor}
        />

        <View style={styles.mainControlsRow}>
          <View style={{ width: 90, alignItems: 'center' }}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleLooping}>
              {loopMode === 0 && <Repeat color={subTextColor} size={26} />}
              {loopMode === 1 && <Repeat color={activeColor} size={26} />}
              {loopMode === 2 && <Repeat1 color={activeColor} size={26} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.playPauseButton} 
            onPress={handleMainPlayToggle}
          >
            {isPlaying && !isPaused ? (
              <Pause color="#FFF" size={32} />
            ) : (
              <Play color="#FFF" size={32} style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>

          <View style={{ width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity 
              onPress={() => {
                if (!isPremium) return showPremiumLimitAlert('倍速再生');
                setSpeed(Math.max(1, Math.floor(speed) - 1));
              }} 
              style={{ padding: 8 }}
            >
              <Text style={{ color: activeColor, fontSize: 24, fontWeight: 'bold' }}>-</Text>
            </TouchableOpacity>
            <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 14, minWidth: 28, textAlign: 'center' }}>{speed.toFixed(1)}x</Text>
            <TouchableOpacity 
              onPress={() => {
                if (!isPremium) return showPremiumLimitAlert('倍速再生');
                setSpeed(Math.min(10, Math.floor(speed) + 1));
              }} 
              style={{ padding: 8 }}
            >
              <Text style={{ color: activeColor, fontSize: 22, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.speedSection, { backgroundColor: cardBg, borderColor, padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 12 }]}>
        <Text style={{ color: textColor, fontWeight: 'bold', marginBottom: 12 }}>{getTranslation(language, 'player', 'playbackSpeed')}</Text>
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
              onPress={() => {
                if (!isPremium && s !== 1) return showPremiumLimitAlert('倍速再生');
                setSpeed(s);
              }}
            >
              <Text style={{ color: speed === s ? '#FFF' : textColor, fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>{s}x</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.settingsToggle, { backgroundColor: cardBg, borderColor }]} 
        onPress={() => setShowSettings(!showSettings)}
      >
        <Settings2 color={activeColor} size={20} />
        <Text style={[styles.settingsToggleText, { color: textColor }]}>{getTranslation(language, 'player', 'settingTitle')}</Text>
      </TouchableOpacity>

      {showSettings && (
        <View style={[styles.settingsPanel, { backgroundColor: cardBg, borderColor }]}>
          {MemoizedBgmRow}
          <View style={styles.volRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: 60 }}>
              <Mic color={textColor} size={20} />
              <Text style={{ color: subTextColor, fontSize: 11, marginLeft: 4 }}>{getTranslation(language, 'player', 'voiceVol')}</Text>
            </View>
            <View style={styles.volControlArea}>
              <TouchableOpacity onPress={() => adjustVol(voiceVolume, setVoiceVolume, -0.2)} style={[styles.volBtn, { borderColor }]}>
                <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold' }}>-</Text>
              </TouchableOpacity>
              <Text style={{ color: textColor, width: 44, textAlign: 'center', fontWeight: 'bold' }}>{Math.round(voiceVolume * 100)}%</Text>
              <TouchableOpacity onPress={() => adjustVol(voiceVolume, setVoiceVolume, 0.2)} style={[styles.volBtn, { borderColor }]}>
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
                <TouchableOpacity 
                  onPress={handleBgmPlayToggle} 
                  disabled={isBgmLoading}
                  style={{ padding: 6, backgroundColor: isBgmLoading ? inactiveColor : activeColor, borderRadius: 16, marginRight: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}
                >
                  {isBgmLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : bgmIsPlaying ? (
                    <Pause color="#FFF" size={14} />
                  ) : (
                    <Play color="#FFF" size={14} style={{ marginLeft: 3 }} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBgmStop} style={{ padding: 6, backgroundColor: cardBg, borderColor, borderWidth: 1, borderRadius: 16 }}>
                  <Square color="#FF3B30" size={14} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.volControlArea}>
              <TouchableOpacity onPress={() => adjustVol(bgmVolume, setBgmVolume, -0.2)} style={[styles.volBtn, { borderColor }]}>
                <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold' }}>-</Text>
              </TouchableOpacity>
              <Text style={{ color: textColor, width: 44, textAlign: 'center', fontWeight: 'bold' }}>{Math.round(bgmVolume * 100)}%</Text>
              <TouchableOpacity onPress={() => adjustVol(bgmVolume, setBgmVolume, 0.2)} style={[styles.volBtn, { borderColor }]}>
                <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold' }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {MemoizedTabsRow}

      {activePlaylistId ? (
        <View style={{ marginBottom: 16, paddingHorizontal: 4, marginTop: 12 }}>
          <Text style={{ color: activeColor, fontWeight: 'bold' }}>
            🎵 プレイリスト「{playlists.find((p: any) => p.id === activePlaylistId)?.name}」を再生中...
          </Text>
        </View>
      ) : null}
    </View>
  );
});
export function PlayerScreen({ route, navigation }: any) {
  const store = useAppStore();
  const { affirmations, removeAffirmation, toggleFavorite, isDarkMode, voiceVolume, bgmVolume, setVoiceVolume, setBgmVolume, bgmType, playlists, listenedDays, currentStreak, markListenedToday, bgImageUrl, customBgms, addCustomBgm, removeCustomBgm, isVisualizationEnabled, membershipType, language, userId } = store;

  const themeColors = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#F0F8FF', '#E6F4FE'];
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#A0AEC0' : '#8E8E93';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';
  const activeColor = '#6B4EFF'; 
  const inactiveColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';

  const BGM_LIST = getBgmList(language);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [bgmSound, setBgmSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loopMode, setLoopMode] = useState<0 | 1 | 2>(0); // 0:なし, 1:リストループ, 2:1曲ループ
  const [speed, setSpeed] = useState(1.0);

const isPremium = membershipType === 'premium';

  
  const showPremiumLimitAlert = (feature: string) => {
    Alert.alert(
      'プレミアム機能',
      `${feature}はサブスク会員限定の機能です。月500円で全機能が使い放題になり、初回3000ポイントも付与されます！`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '詳しく見る', onPress: () => navigation.navigate('Premium') }
      ]
    );
  };
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');


  const handleAddCustomBgm = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
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
  const [isBgmLoading, setIsBgmLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const loadingActionId = React.useRef(0);

  const playPlaylistId = route?.params?.playPlaylistId;
  useEffect(() => {
    if (playPlaylistId) {
      setActivePlaylistId(playPlaylistId);
      setActiveTab('all');
      const pl = playlists.find(p => p.id === playPlaylistId);
      if (pl && pl.itemIds.length > 0) {
        setSelectedId(pl.itemIds[0]);
        setIsPlaying(false);
        setIsPaused(false);
      }
      navigation.setParams({ playPlaylistId: undefined });
    }
  }, [playPlaylistId, playlists, navigation]);

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
    setter(Math.round(next * 5) / 5);
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

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
      if (bgmSoundRef.current) bgmSoundRef.current.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (!selectedId && affirmations.length > 0) {
      setSelectedId(affirmations[0].id);
    } else if (selectedId && !affirmations.find(a => a.id === selectedId)) {
      setSelectedId(affirmations.length > 0 ? affirmations[0].id : null);
      if (soundRef.current) soundRef.current.stopAsync();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [affirmations, selectedId]);

  useEffect(() => {
    let isCancelled = false;
    const changeBgm = async () => {
      if (!bgmIsPlaying) {
        if (bgmSound) {
          await bgmSound.stopAsync().catch(() => {});
          await bgmSound.unloadAsync().catch(() => {});
          if (!isCancelled) setBgmSound(null);
        }
        return;
      }
      
      if (bgmSound) {
        await bgmSound.stopAsync().catch(() => {});
        await bgmSound.unloadAsync().catch(() => {});
        if (!isCancelled) setBgmSound(null);
      }

      if (bgmType === 'none') {
        if (!isCancelled) setBgmIsPlaying(false);
        return;
      }
      
      let bgmSource: any = null;
      const selectedBgmObj = BGM_LIST.find(b => b.id === bgmType) as any;
      const customBgmObj = customBgms.find(b => b.id === bgmType);

      if (selectedBgmObj) {
        if (selectedBgmObj.source) {
          bgmSource = selectedBgmObj.source;
        } else if (selectedBgmObj.url) {
          let uriToPlay = selectedBgmObj.url;
          if (uriToPlay.startsWith('http')) {
            const localUri = `${FileSystem.documentDirectory}bgm_cache_${selectedBgmObj.id}.mp3`;
            const fileInfo = await FileSystem.getInfoAsync(localUri);
            if (!fileInfo.exists) {
              try {
                const downloadResult = await FileSystem.downloadAsync(uriToPlay, localUri);
                if (downloadResult.status === 200) uriToPlay = localUri;
              } catch (e) {
                console.warn('BGM download fail', e);
              }
            } else {
              uriToPlay = localUri;
            }
          }
          bgmSource = { uri: uriToPlay };
        }
      } else if (customBgmObj && customBgmObj.uri) {
        let targetBgmUri = customBgmObj.uri;
        const currentDocDir = FileSystem.documentDirectory;
        if (targetBgmUri.includes('/Documents/') && !targetBgmUri.startsWith(currentDocDir as string)) {
          const filename = targetBgmUri.split('/').pop();
          targetBgmUri = `${currentDocDir}${filename}`;
        }
        bgmSource = { uri: targetBgmUri };
      }

      if (bgmSource && !isCancelled) {
        try {
          setIsBgmLoading(true);
          const { sound: createdBgm } = await Audio.Sound.createAsync(
            bgmSource,
            { shouldPlay: true, isLooping: true, volume: bgmVolRef.current }
          );
          if (!isCancelled) {
            setBgmSound(createdBgm);
            setIsBgmLoading(false);
          } else {
            createdBgm.unloadAsync().catch(() => {});
          }
        } catch (e) {
          console.warn('BGM load error:', e);
          if (!isCancelled) {
            setBgmIsPlaying(false);
            setIsBgmLoading(false);
          }
        }
      }
    };
    
    changeBgm();
    return () => { isCancelled = true; };
  }, [bgmType, bgmIsPlaying]);

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
      store.markListenedToday();
      
      if (soundRef.current) {
        const prevSound = soundRef.current;
        setSound(null);
        setIsPlaying(false);
        await prevSound.unloadAsync().catch(e => console.warn('prev unload err', e));
      }

      if (actionId !== loadingActionId.current) return;

      let targetUri = item.uri;
      const currentDocDir = (FileSystem as any).documentDirectory;

      if (targetUri.includes('/Documents/') && !targetUri.startsWith(currentDocDir)) {
        const filename = targetUri.split('/').pop();
        const correctedUri = `${currentDocDir}${filename}`;
        const check = await FileSystem.getInfoAsync(correctedUri);
        if (check.exists) {
          targetUri = correctedUri;
        }
      }

      let newSound;
      let loadError: any = null;

      // 最初の読み込み試行
      try {
        const result = await Audio.Sound.createAsync(
          { uri: targetUri },
          { 
            shouldPlay: false, 
            shouldCorrectPitch: true, 
            pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
            volume: volRef.current,
            isLooping: loopModeRef.current === 2
          }
        );
        newSound = result.sound;
      } catch (err: any) {
        loadError = err;
      }

      // --- リトライロジック (AI生成直後のファイルシステム遅延対策) ---
      if (loadError && actionId === loadingActionId.current) {
        console.log('First load failed, retrying in 500ms...', loadError.message);
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
          const result = await Audio.Sound.createAsync(
            { uri: targetUri },
            { 
              shouldPlay: false, 
              shouldCorrectPitch: true, 
              pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
              volume: volRef.current,
              isLooping: loopModeRef.current === 2
            }
          );
          newSound = result.sound;
          loadError = null; // 成功したのでエラーを消去
        } catch (retryErr: any) {
          loadError = retryErr;
        }
      }

      if (loadError) {
        if (actionId !== loadingActionId.current) return;

        console.error('Core Audio Load Err (after retry):', loadError);
        Alert.alert(
          '再生エラー', 
          '音声ファイルがまだ準備できていないか、破損しています。もう一度お試しいただくか、この項目を削除してください。',
          [
            { text: '閉じる', style: 'cancel' },
            { text: '削除する', style: 'destructive', onPress: () => removeAffirmation(item.id) }
          ]
        );
        return;
      }

      // 成功した場合の処理
      if (newSound) {
        if (actionId !== loadingActionId.current) {
          await newSound.unloadAsync().catch(() => {});
          return;
        }
        await newSound.setRateAsync(speedRef.current, true, Audio.PitchCorrectionQuality.High);
        await newSound.playAsync();
        
        setSound(newSound);
        setIsPlaying(true);
        setIsPaused(false);
        setSelectedId(item.id);
      }

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

  const toggleLooping = () => {
    setLoopMode((prev) => {
      const next = ((prev + 1) % 3) as 0 | 1 | 2;
      if (soundRef.current) {
        soundRef.current.setIsLoopingAsync(next === 2).catch(e => console.warn(e));
      }
      return next;
    });
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
    const safeAffirmations = affirmations || [];
    const safePlaylists = playlists || [];

    if (activePlaylistId) {
      const pl = safePlaylists.find(p => p.id === activePlaylistId);
      if (pl && pl.itemIds) {
        return pl.itemIds.map(id => safeAffirmations.find(a => a.id === id)).filter(Boolean) as Affirmation[];
      }
    }
    return safeAffirmations.filter(item => {
      if (!item) return false;
      if (activeTab === 'fav') return item.isFavorite;
      if (activeTab === 'mic') return !item.title.startsWith('AI生成');
      if (activeTab === 'ai') return item.title.startsWith('AI生成');
      return true;
    });
  };

  const selectedItem = (affirmations || []).find(a => a.id === selectedId);
  const filteredList = getFilteredAffirmations();

  useEffect(() => {
    if (playNextSignal > 0) {
      const currentIndex = filteredList.findIndex(a => a.id === selectedId);
      if (currentIndex !== -1) {
        if (loopModeRef.current === 2) {
          // 1曲リピート
          playAudio(filteredList[currentIndex]);
        } else if (currentIndex + 1 < filteredList.length) {
          const nextItem = filteredList[currentIndex + 1];
          playAudio(nextItem);
        } else if (loopModeRef.current === 1) {
          playAudio(filteredList[0]);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
        }
      }
    }
  }, [playNextSignal]);

  // --- 再描画を最適化するための内部的なメモ化コンポーネント ---
  const MemoizedAffirmationArea = React.useMemo(() => {
    return (
      <View style={[styles.textAreaContainer, { backgroundColor: cardBg, borderColor }]}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
          <Text style={[styles.mainText, { color: textColor }]}>
            {selectedItem?.text || selectedItem?.title || getTranslation(language, 'player', 'empty').split('\n')[0]}
          </Text>
        </ScrollView>
      </View>
    );
  }, [selectedItem?.id, selectedItem?.text, selectedItem?.title, cardBg, borderColor, textColor]);

  const MemoizedTabsRow = React.useMemo(() => {
    return (
      <View style={styles.tabsRow}>
        {[
          { id: 'all', label: getTranslation(language, 'player', 'tabAll') },
          { id: 'mic', label: getTranslation(language, 'player', 'tabRec') },
          { id: 'ai', label: getTranslation(language, 'player', 'tabAi') },
          { id: 'fav', label: getTranslation(language, 'player', 'tabFav') }
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
    );
  }, [activeTab, activePlaylistId, activeColor, inactiveColor, textColor, language]);

  const MemoizedBgmRow = React.useMemo(() => {
    return (
      <View style={styles.volRow}>
        <Text style={{color: textColor, fontSize: 13, marginRight: 8, width: 60}}>{getTranslation(language, 'player', 'bgmSelect')}</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'column' }}>
            {[
              { ja: '定番', en: 'Classic' },
              { ja: 'ソルフェ', en: 'Solfeggio' },
              { ja: '自然', en: 'Nature' }
            ].map(cat => (
              <View key={cat.en} style={{ flexDirection: 'row', marginBottom: 8 }}>
                {BGM_LIST.filter(b => b.tag === (language === 'en' ? cat.en : cat.ja) || (cat.ja === '定番' && b.id === 'none')).map((bgm) => (
                  <TouchableOpacity 
                    key={bgm.id} 
                    style={[
                      styles.bgmChip, 
                      { 
                        backgroundColor: bgmType === bgm.id ? activeColor : inactiveColor,
                        borderWidth: 1,
                        borderColor: bgmType === bgm.id ? activeColor : borderColor
                      }
                    ]}
                    onPress={() => {
                      if (!isPremium && bgm.id !== 'none') return showPremiumLimitAlert('BGM機能');
                      if (bgmType !== bgm.id) {
                        setIsBgmLoading(true);
                        store.setBgmType(bgm.id);
                        setBgmIsPlaying(true);
                      }
                    }}
                  >
                    <Text style={{color: bgmType === bgm.id ? '#FFF' : textColor, fontSize: 11, fontWeight: '600'}}>
                      {bgm.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            
            <View style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'center' }}>
              {customBgms.map((bgm) => (
                <View key={bgm.id} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                  <TouchableOpacity 
                    style={[styles.bgmChip, { backgroundColor: bgmType === bgm.id ? activeColor : inactiveColor, marginRight: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                    onPress={() => store.setBgmType(bgm.id)}
                  >
                    <Text style={{color: bgmType === bgm.id ? '#FFF' : textColor, fontSize: 11, fontWeight: '500'}} numberOfLines={1}>{bgm.name.length > 6 ? bgm.name.substring(0,6)+'...' : bgm.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.bgmChip, { backgroundColor: '#FF3B30', paddingHorizontal: 6, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, height: 28, justifyContent: 'center' }]}
                    onPress={() => {
                      if (bgmType === bgm.id) store.setBgmType('none');
                      removeCustomBgm(bgm.id);
                      FileSystem.deleteAsync(bgm.uri, { idempotent: true });
                    }}
                  >
                    <X color="#FFF" size={12} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity 
                style={[styles.bgmChip, { backgroundColor: 'transparent', borderStyle: 'dashed', borderWidth: 1, borderColor: activeColor }]}
                onPress={handleAddCustomBgm}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Plus color={activeColor} size={14} style={{ marginRight: 4 }} />
                  <Text style={{color: activeColor, fontSize: 11, fontWeight: 'bold'}}>{language === 'en' ? 'Add' : '追加'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }, [bgmType, customBgms, isPremium, textColor, activeColor, inactiveColor, borderColor, isBgmLoading, language]);

  const headerProps = {
    currentStreak, setShowCalendar, MemoizedAffirmationArea, 
    sound, setPlayNextSignal, subTextColor, activeColor,
    loopMode, toggleLooping, isPlaying, isPaused, handleMainPlayToggle,
    speed, isPremium, showPremiumLimitAlert, setSpeed,
    textColor, cardBg, borderColor, inactiveColor,
    showSettings, setShowSettings, MemoizedBgmRow, 
    voiceVolume, adjustVol, setVoiceVolume, bgmType, handleBgmPlayToggle, 
    isBgmLoading, bgmIsPlaying, handleBgmStop, bgmVolume, setBgmVolume,
    MemoizedTabsRow, activePlaylistId, playlists: playlists || [], store
  };

  const MemoizedHeader = React.useMemo(() => (
    <PlayerHeader {...headerProps} />
  ), [
    currentStreak, MemoizedAffirmationArea, sound, loopMode, isPlaying, 
    isPaused, speed, showSettings, MemoizedBgmRow, voiceVolume, 
    bgmIsPlaying, bgmVolume, MemoizedTabsRow, 
    activePlaylistId, activeColor, textColor, inactiveColor, subTextColor, 
    cardBg, borderColor, isBgmLoading, bgmType, playlists, language
  ]);


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
              <Text style={[styles.modalTitle, { color: textColor }]}>{getTranslation(language, 'dash', 'calTitle')}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCalendar(false)}>
                <X color={textColor} size={28} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Flame color="#FF9500" size={48} />
                <Text style={{ color: textColor, fontSize: 24, fontWeight: 'bold', marginTop: 12 }}>
                  {getTranslation(language, 'dash', 'currentStreak').replace('{0}', String(currentStreak || 0))}
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
        ListHeaderComponent={MemoizedHeader}
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
                setSelectedId(id);
                setTimeout(() => {
                  if (isPlayingRef.current) {
                    const nextItem = affirmations.find(a => a.id === id);
                    if (nextItem) playAudio(nextItem);
                  } else {
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
      {renderCalendarModal()}
      
      {!isPremium && (
        <View style={styles.adContainer}>
          <BannerAd
            unitId="ca-app-pub-6343618071277983/1442484920"
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, backgroundColor: 'transparent' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  textAreaContainer: {
    height: 350,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mainText: { fontSize: 16, lineHeight: 28, fontWeight: '500', letterSpacing: 0.5 },
  playerContainer: { marginBottom: 20 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
  timeText: { fontSize: 13, width: 38, textAlign: 'center' },
  mainControlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, paddingHorizontal: 16, gap: 25 }, 
  iconButton: { padding: 12 },
  playPauseButton: { backgroundColor: '#6B4EFF', width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },
  speedSection: { marginBottom: 20 },
  speedLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  speedButtonsGrid: { gap: 8 },
  speedButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, paddingHorizontal: 4 },
  speedChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  settingsToggle: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  settingsToggleText: { marginLeft: 8, fontSize: 14, fontWeight: '600' },
  settingsPanel: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  volRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  tabsRow: { flexDirection: 'row', marginVertical: 20, alignItems: 'center' },
  tabChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  listIndex: { fontSize: 14, width: 24 },
  listContent: { flex: 1, justifyContent: 'center' },
  listTitle: { fontSize: 16, fontWeight: '500' },
  editInput: { fontSize: 16, fontWeight: '500', paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderRadius: 8 },
  listAction: { padding: 8, marginLeft: 4 },
  bgmChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  volControlArea: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  volBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
    width: '100%',
  }
});
