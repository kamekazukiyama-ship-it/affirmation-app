import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore, Affirmation } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { Play, Plus, BookText, Trash2, Library, CheckCircle2, Circle, X, Mic, Sparkles, Share2, FileDown } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

export function PlaylistScreen({ route, navigation }: any) {
  const { isDarkMode, language, playlists, savedTexts, affirmations, addPlaylist, removePlaylist, removeSavedText, removeAffirmation } = useAppStore();
  const themeColors = isDarkMode ? ['#0f172a', '#1e293b'] : ['#f8fafc', '#e2e8f0'];
  const textColor = isDarkMode ? '#F8FAFC' : '#1E293B';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBg = isDarkMode ? 'rgba(30,41,59,0.8)' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const activeColor = isDarkMode ? '#00F2FE' : '#007AFF';

  const initialTab = route?.params?.initialTab;
  const [activeTab, setActiveTab] = React.useState<'playlists' | 'texts' | 'mic' | 'ai'>('playlists');
  const [listModalVisible, setListModalVisible] = useState(false);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setListModalVisible(true);
      // 一度開いたらパラメータをリセット
      navigation.setParams({ initialTab: undefined });
    }
  }, [initialTab, navigation]);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handlePlayPlaylist = (playlistId: string) => {
    setListModalVisible(false);
    navigation.navigate('Player', { playPlaylistId: playlistId });
  };

  const handleShareAffirmation = async (aff: Affirmation) => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('エラー', 'このデバイスでは共有機能が利用できません');
      return;
    }

    Alert.alert(
      '共有方法の選択',
      'どのような形式で共有しますか？',
      [
        {
          text: '音声ファイル (.m4a)',
          onPress: () => shareRawAudio(aff)
        },
        {
          text: 'データ移行用 (.json)',
          onPress: () => shareJsonPackage(aff)
        },
        {
          text: 'キャンセル',
          style: 'cancel'
        }
      ]
    );
  };

  const shareRawAudio = async (aff: Affirmation) => {
    try {
      let targetUri = aff.uri;
      const currentDocDir = (FileSystem as any).documentDirectory;

      // パス補正
      if (targetUri.includes('/Documents/') && !targetUri.startsWith(currentDocDir)) {
        const filename = targetUri.split('/').pop();
        const correctedUri = `${currentDocDir}${filename}`;
        const check = await FileSystem.getInfoAsync(correctedUri);
        if (check.exists) {
          targetUri = correctedUri;
        }
      }

      // リモートURLの場合は一時ファイルにダウンロード
      if (targetUri.startsWith('http')) {
        const fileName = `shared_${aff.id}.mp3`;
        const tempPath = `${(FileSystem as any).cacheDirectory}${fileName}`;
        const downloadResult = await FileSystem.downloadAsync(targetUri, tempPath);
        targetUri = downloadResult.uri;
      }

      Alert.alert(
        '送信の確認',
        'この音声データを送信してもよろしいですか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: '送信する', 
            onPress: async () => {
              await Sharing.shareAsync(targetUri, {
                mimeType: 'audio/mpeg',
                dialogTitle: '音声を共有',
              });
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('共有エラー', '音声ファイルの送信に失敗しました: ' + e.message);
    }
  };

  const shareJsonPackage = async (aff: Affirmation) => {
    try {
      let targetUri = aff.uri;
      const currentDocDir = (FileSystem as any).documentDirectory;

      if (targetUri.includes('/Documents/') && !targetUri.startsWith(currentDocDir)) {
        const filename = targetUri.split('/').pop();
        const correctedUri = `${currentDocDir}${filename}`;
        const check = await FileSystem.getInfoAsync(correctedUri);
        if (check.exists) {
          targetUri = correctedUri;
        }
      }

      if (targetUri.startsWith('http')) {
        const fileName = `temp_share_${Date.now()}.mp3`;
        const tempDldPath = `${(FileSystem as any).cacheDirectory}${fileName}`;
        const downloadResult = await FileSystem.downloadAsync(targetUri, tempDldPath);
        targetUri = downloadResult.uri;
      }

      // Base64化 (Fetch方式)
      let base64Audio = '';
      try {
        const response = await fetch(targetUri);
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
        base64Audio = await FileSystem.readAsStringAsync(targetUri, { encoding: 'base64' as any });
      }

      const packageData = {
        title: aff.title,
        text: aff.text,
        audioBase64: base64Audio,
        extension: targetUri.split('.').pop() || 'm4a',
        type: 'affa_package',
        version: '1.0'
      };

      const fileName = `${aff.title.replace(/[\\\/:*?"<>|]/g, '_')}.json`;
      const tempPath = `${(FileSystem as any).cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(tempPath, JSON.stringify(packageData));
      
      Alert.alert(
        '送信の確認',
        'この音声データを送信してもよろしいですか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: '送信する', 
            onPress: async () => {
              await Sharing.shareAsync(tempPath, {
                mimeType: 'application/json',
                dialogTitle: 'バックアップ共有',
                UTI: 'public.json'
              });
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('共有エラー', 'パッケージの作成に失敗しました: ' + e.message);
    }
  };

  const handleImportAffirmation = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      if (data.type !== 'affa_package' || !data.audioBase64 || data.audioBase64.length < 100) {
        Alert.alert('エラー', 'アファメーション形式が正しくないか、音声データが破損しています。');
        return;
      }

      // 新しいファイルとしてドキュメントディレクトリに保存
      const ext = data.extension || 'm4a';
      const newFileName = `imported_${Date.now()}.${ext}`;
      const newUri = `${(FileSystem as any).documentDirectory}${newFileName}`;

      await FileSystem.writeAsStringAsync(newUri, data.audioBase64, {
        encoding: 'base64' as any
      });

      // ストアに追加
      useAppStore.getState().addAffirmation({
        id: Date.now().toString(),
        title: data.title + ' (共有受取)',
        text: data.text,
        uri: newUri,
        date: Date.now()
      });

      Alert.alert('成功', `「${data.title}」をライブラリに追加しました！`);
    } catch (e: any) {
      Alert.alert('インポートエラー', 'ファイルの読み込みに失敗しました。正しいファイルか確認してください。');
    }
  };

  const renderPlaylist = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      onPress={() => {
        // iOSでのModal遷移競合によるフリーズを防ぐため、リストモーダルは閉じずに上に重ねる
        setEditingPlaylistId(item.id);
        setNewPlaylistName(item.name);
        setSelectedItems(item.itemIds);
        setCreateModalVisible(true);
      }}
    >
      <View style={styles.cardIconBox}>
        <Library color={activeColor} size={24} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: textColor }]}>{item.name}</Text>
        <Text style={[styles.cardSub, { color: subTextColor }]}>{getTranslation(language, 'library', 'countTracks').replace('{0}', item.itemIds.length.toString())}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.playBtn, { backgroundColor: activeColor }]} 
        onPress={() => handlePlayPlaylist(item.id)}
      >
        <Play color="#FFF" size={20} style={{ marginLeft: 3 }} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.delBtn} onPress={() => removePlaylist(item.id)}>
        <Trash2 color="#FF3B30" size={20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderText = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      onPress={() => {
        setListModalVisible(false);
        navigation.navigate('Generate', { presetText: item.text });
      }}
    >
      <View style={styles.cardIconBox}>
        <BookText color={activeColor} size={24} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: textColor }]}>{item.title}</Text>
        <Text style={[styles.cardSub, { color: subTextColor }]} numberOfLines={2}>
          {item.text}
        </Text>
      </View>
      <TouchableOpacity style={styles.delBtn} onPress={() => removeSavedText(item.id)}>
        <Trash2 color="#FF3B30" size={20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAudio = ({ item }: any) => {
    const isAi = item.title.includes('AI生成');
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: cardBg, borderColor }]}
        onPress={() => {
          setListModalVisible(false);
          navigation.navigate('Player', { playAudioId: item.id, triggerTab: activeTab });
        }}
      >
        <View style={[styles.cardIconBox, { backgroundColor: isAi ? 'rgba(0,122,255,0.1)' : 'rgba(255,59,48,0.1)' }]}>
          {isAi ? <Sparkles color="#007AFF" size={24} /> : <Mic color="#FF3B30" size={24} />}
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.cardSub, { color: subTextColor }]} numberOfLines={2}>
            {item.text || getTranslation(language, 'library', 'recLabel')}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.playBtn, { backgroundColor: isAi ? '#007AFF' : '#FF3B30' }]} 
          onPress={() => {
            setListModalVisible(false);
            navigation.navigate('Player', { playAudioId: item.id, triggerTab: activeTab });
          }}
        >
          <Play color="#FFF" size={20} style={{ marginLeft: 3 }} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.delBtn} onPress={() => handleShareAffirmation(item)}>
          <Share2 color={activeColor} size={22} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.delBtn} onPress={() => removeAffirmation(item.id)}>
          <Trash2 color="#FF3B30" size={20} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={themeColors as any} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}>
          <Text style={[styles.headerTitle, { color: textColor, marginHorizontal: 0, marginTop: 0, marginBottom: 0 }]}>{getTranslation(language, 'library', 'title')}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              onPress={handleImportAffirmation} 
              style={{ padding: 8, backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}
            >
              <FileDown color={textColor} size={20} />
              <Text style={{ color: textColor, fontSize: 13, fontWeight: 'bold' }}>{getTranslation(language, 'library', 'import')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Menu')} style={{ padding: 8, backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor }}>
              <X color={textColor} size={24} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 四分割グリッドメニュー */}
        <View style={styles.gridContainer}>
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => { setActiveTab('playlists'); setListModalVisible(true); }}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIconBox, { backgroundColor: isDarkMode ? 'rgba(0,122,255,0.1)' : '#E5F1FF' }]}>
              <Library color="#007AFF" size={36} />
            </View>
            <Text style={[styles.gridTitle, { color: textColor }]}>{getTranslation(language, 'library', 'catPlaylist')}</Text>
            <Text style={[styles.gridSub, { color: subTextColor }]}>{getTranslation(language, 'library', 'countFolder').replace('{0}', playlists.length.toString())}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => { setActiveTab('mic'); setListModalVisible(true); }}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIconBox, { backgroundColor: isDarkMode ? 'rgba(255,59,48,0.1)' : '#FFEBEB' }]}>
              <Mic color="#FF3B30" size={36} />
            </View>
            <Text style={[styles.gridTitle, { color: textColor }]}>{getTranslation(language, 'library', 'catRec')}</Text>
            <Text style={[styles.gridSub, { color: subTextColor }]}>{getTranslation(language, 'library', 'countRec').replace('{0}', affirmations.filter(a => !a.title.includes('AI生成')).length.toString())}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => { setActiveTab('ai'); setListModalVisible(true); }}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIconBox, { backgroundColor: isDarkMode ? 'rgba(0,122,255,0.1)' : '#E5F1FF' }]}>
              <Sparkles color="#007AFF" size={36} />
            </View>
            <Text style={[styles.gridTitle, { color: textColor }]}>{getTranslation(language, 'library', 'catAi')}</Text>
            <Text style={[styles.gridSub, { color: subTextColor }]}>{getTranslation(language, 'library', 'countAi').replace('{0}', affirmations.filter(a => a.title.includes('AI生成')).length.toString())}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => { setActiveTab('texts'); setListModalVisible(true); }}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIconBox, { backgroundColor: isDarkMode ? 'rgba(52,199,89,0.1)' : '#E8F5E9' }]}>
              <BookText color="#34C759" size={36} />
            </View>
            <Text style={[styles.gridTitle, { color: textColor }]}>{getTranslation(language, 'library', 'catText')}</Text>
            <Text style={[styles.gridSub, { color: subTextColor }]}>{getTranslation(language, 'library', 'countText').replace('{0}', savedTexts.length.toString())}</Text>
          </TouchableOpacity>
        </View>

      {/* 各カテゴリの詳細リストを表示するモーダル */}
      <Modal visible={listModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setListModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
          <View style={[styles.modalHeader, { marginBottom: 16 }]}>
            <TouchableOpacity onPress={() => setListModalVisible(false)} style={{ padding: 4 }}>
              <X color={textColor} size={28} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {activeTab === 'playlists' ? getTranslation(language, 'library', 'catPlaylist') : 
               activeTab === 'texts' ? getTranslation(language, 'library', 'catText') : 
               activeTab === 'mic' ? getTranslation(language, 'library', 'catRec') : 
               getTranslation(language, 'library', 'catAi')}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* 新規作成ボタン */}
          {(activeTab === 'playlists' || activeTab === 'texts') && (
            <TouchableOpacity 
              style={[styles.createBtn, { borderColor: activeColor, backgroundColor: cardBg }]}
              onPress={() => {
                if (activeTab === 'playlists') {
                  setEditingPlaylistId(null);
                  setNewPlaylistName('');
                  setSelectedItems([]);
                  setCreateModalVisible(true);
                } else {
                  setListModalVisible(false); // モーダルを閉じてから遷移
                  navigation.navigate('Generate');
                }
              }}
            >
              <Plus color={activeColor} size={20} style={{ marginRight: 8 }} />
              <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 16 }}>
                {activeTab === 'playlists' ? getTranslation(language, 'library', 'modalNew') : getTranslation(language, 'library', 'modalAiGen')}
              </Text>
            </TouchableOpacity>
          )}

          <FlatList<any>
            data={
              activeTab === 'playlists' ? playlists : 
              activeTab === 'texts' ? savedTexts :
              activeTab === 'mic' ? affirmations.filter(a => !a.title.includes('AI生成')) :
              affirmations.filter(a => a.title.includes('AI生成'))
            }
            keyExtractor={item => item.id}
            renderItem={
              activeTab === 'playlists' ? renderPlaylist :
              activeTab === 'texts' ? renderText :
              renderAudio
            }
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              (activeTab === 'mic' || activeTab === 'ai') ? (
                <View style={{ backgroundColor: 'rgba(107,78,255,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: activeColor, flexDirection: 'row', alignItems: 'center' }}>
                  <Share2 color={activeColor} size={18} />
                  <Text style={{ color: subTextColor, fontSize: 13, fontWeight: '500', marginLeft: 10, flex: 1 }}>
                    {getTranslation(language, 'library', 'shareNotice')}
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={{ color: subTextColor, textAlign: 'center', lineHeight: 24 }}>{getTranslation(language, 'library', 'empty')}</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* プレイリスト作成モーダル */}
      <Modal visible={createModalVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={{ padding: 4 }}>
              <X color={textColor} size={28} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {editingPlaylistId ? getTranslation(language, 'library', 'editTitle') : getTranslation(language, 'library', 'createTitle')}
            </Text>
            <TouchableOpacity 
              style={{ padding: 4 }}
              onPress={() => {
                if (!newPlaylistName.trim()) {
                  Alert.alert('エラー', 'プレイリスト名を入力してください');
                  return;
                }
                if (selectedItems.length === 0) {
                  Alert.alert('エラー', '少なくとも1つの音声を選んでください');
                  return;
                }
                if (editingPlaylistId) {
                  // store update function
                  useAppStore.getState().updatePlaylist(editingPlaylistId, newPlaylistName.trim(), selectedItems);
                } else {
                  addPlaylist({
                    id: Date.now().toString(),
                    name: newPlaylistName.trim(),
                    itemIds: selectedItems,
                    createdAt: Date.now(),
                  });
                }
                setCreateModalVisible(false);
              }}
            >
              <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 16 }}>{getTranslation(language, 'library', 'save')}</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.modalInput, { backgroundColor: cardBg, color: textColor, borderColor }]}
            placeholder={getTranslation(language, 'library', 'inputPlName')}
            placeholderTextColor={subTextColor}
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
          />
          
          <Text style={[styles.label, { color: textColor, marginTop: 24, marginBottom: 12 }]}>{getTranslation(language, 'library', 'selectAff')}</Text>
          <FlatList
            data={affirmations}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const checked = selectedItems.includes(item.id);
              return (
                <TouchableOpacity 
                  style={[styles.listItem, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => {
                    if (checked) {
                      setSelectedItems(prev => prev.filter(id => id !== item.id));
                    } else {
                      setSelectedItems(prev => [...prev, item.id]);
                    }
                  }}
                >
                  {checked ? <CheckCircle2 color={activeColor} size={24} /> : <Circle color={subTextColor} size={24} />}
                  <Text style={{ marginLeft: 12, color: textColor, flex: 1, fontSize: 15 }} numberOfLines={2}>{item.title}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  gridContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, gap: 16 },
  gridCard: { backgroundColor: '#FFFFFF', width: '47%', paddingVertical: 32, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  gridIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  gridTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  gridSub: { fontSize: 12, textAlign: 'center' },
  tabsRow: { flexDirection: 'row', gap: 12, paddingRight: 20 },
  tabBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, minWidth: 100 },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  cardIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,122,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 16, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardSub: { fontSize: 13, lineHeight: 20 },
  playBtn: { backgroundColor: '#FFFFFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  delBtn: { padding: 12, marginLeft: 4 },
  emptyBox: { padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  modalContainer: { flex: 1, padding: 20, paddingTop: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalInput: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 16 },
  label: { fontSize: 16, fontWeight: 'bold' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 }
});