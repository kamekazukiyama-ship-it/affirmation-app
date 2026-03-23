import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { Play, Plus, BookText, Trash2, Library, CheckCircle2, Circle, X } from 'lucide-react-native';

export function PlaylistScreen({ navigation }: any) {
  const { isDarkMode, playlists, savedTexts, affirmations, addPlaylist, removePlaylist, removeSavedText } = useAppStore();
  const themeColors = isDarkMode ? ['#0f172a', '#1e293b'] : ['#f8fafc', '#e2e8f0'];
  const textColor = isDarkMode ? '#F8FAFC' : '#1E293B';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBg = isDarkMode ? 'rgba(30,41,59,0.8)' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const activeColor = isDarkMode ? '#00F2FE' : '#007AFF';

  const [activeTab, setActiveTab] = useState<'playlists' | 'texts'>('playlists');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handlePlayPlaylist = (playlistId: string) => {
    navigation.navigate('Home', { playPlaylistId: playlistId });
  };

  const renderPlaylist = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      onPress={() => {
        setEditingPlaylistId(item.id);
        setNewPlaylistName(item.name);
        setSelectedItems(item.itemIds);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardIconBox}>
        <Library color={activeColor} size={24} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: textColor }]}>{item.name}</Text>
        <Text style={[styles.cardSub, { color: subTextColor }]}>{item.itemIds.length} 曲収録</Text>
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

  return (
    <LinearGradient colors={themeColors as any} style={styles.container}>
      <Text style={[styles.headerTitle, { color: textColor }]}>ライブラリ</Text>
      
      {/* タブ切り替え */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'playlists' ? { backgroundColor: activeColor } : { backgroundColor: cardBg, borderColor }]}
          onPress={() => setActiveTab('playlists')}
        >
          <Text style={{ color: activeTab === 'playlists' ? '#FFF' : textColor, fontWeight: 'bold' }}>プレイリスト</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'texts' ? { backgroundColor: activeColor } : { backgroundColor: cardBg, borderColor }]}
          onPress={() => setActiveTab('texts')}
        >
          <Text style={{ color: activeTab === 'texts' ? '#FFF' : textColor, fontWeight: 'bold' }}>保存テキスト</Text>
        </TouchableOpacity>
      </View>

      {/* 新規作成ボタン */}
      <TouchableOpacity 
        style={[styles.createBtn, { borderColor: activeColor, backgroundColor: cardBg }]}
        onPress={() => {
          if (activeTab === 'playlists') {
            setEditingPlaylistId(null);
            setNewPlaylistName('');
            setSelectedItems([]);
            setModalVisible(true);
          } else {
            navigation.navigate('Generate');
          }
        }}
      >
        <Plus color={activeColor} size={20} style={{ marginRight: 8 }} />
        <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 16 }}>
          {activeTab === 'playlists' ? '新規プレイリストを作成' : 'AI生成画面でテキストを保存'}
        </Text>
      </TouchableOpacity>

      <FlatList<any>
        data={activeTab === 'playlists' ? playlists : savedTexts}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'playlists' ? renderPlaylist : renderText}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ color: subTextColor, textAlign: 'center', lineHeight: 24 }}>
              {activeTab === 'playlists' 
                ? 'まだプレイリストがありません。\nお気に入りの音声をまとめて作成しましょう！' 
                : 'まだ保存されたテキストがありません。\nAI生成画面で気に入った文章を保存できます！'}
            </Text>
          </View>
        }
      />

      {/* プレイリスト作成モーダル */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
              <X color={textColor} size={28} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>プレイリスト作成</Text>
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
                setModalVisible(false);
              }}
            >
              <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 16 }}>保存</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.modalInput, { backgroundColor: cardBg, color: textColor, borderColor }]}
            placeholder="プレイリスト名を入力"
            placeholderTextColor={subTextColor}
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
          />
          
          <Text style={[styles.label, { color: textColor, marginTop: 24, marginBottom: 12 }]}>収録する音声を選ぶ</Text>
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

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  tabsRow: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  cardIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,122,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 16, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardSub: { fontSize: 13, lineHeight: 20 },
  playBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  delBtn: { padding: 12, marginLeft: 4 },
  emptyBox: { padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalInput: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 16 },
  label: { fontSize: 16, fontWeight: 'bold' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 }
});