import { useAppStore } from '../store/useAppStore';
import { db, storage } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export const syncToCloud = async (userId: string, onProgress?: (msg: string) => void) => {
  try {
    const state = useAppStore.getState();
    const affirmations = [...state.affirmations];

    for (let i = 0; i < affirmations.length; i++) {
      const aff = affirmations[i];
      if (onProgress) onProgress(`音声データをアップロード中... (${i + 1}/${affirmations.length})`);
      
      // クラウドURLが未設定の場合、ローカルファイルをアップロード
      if (!aff.cloudUrl && aff.uri.startsWith('file://')) {
        try {
          // 拡張子を取得（デフォルトはm4a）
          const ext = aff.uri.endsWith('.mp3') ? '.mp3' : '.m4a';
          
          const response = await fetch(aff.uri);
          const blob = await response.blob();
          
          const audioRef = ref(storage, `users/${userId}/audio/${aff.id}${ext}`);
          await uploadBytes(audioRef, blob);
          const downloadUrl = await getDownloadURL(audioRef);
          
          // クラウドURLを保存
          affirmations[i] = { ...aff, cloudUrl: downloadUrl };
        } catch (err) {
          console.warn(`Failed to upload audio ${aff.id}:`, err);
        }
      }
    }
    // ... (Firestore sync remains same) ...
    const rawData = {
      affirmations,
      playlists: state.playlists,
      savedTexts: state.savedTexts,
      listenedDays: state.listenedDays,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      updatedAt: Date.now()
    };
    const cleanData = JSON.parse(JSON.stringify(rawData));
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, cleanData);

    useAppStore.setState({ affirmations });
    return true;
  } catch (error) {
    console.error("Sync to cloud error:", error);
    throw error;
  }
};

export const restoreFromCloud = async (userId: string, onProgress?: (msg: string) => void) => {
  try {
    if (onProgress) onProgress('クラウドからデータを取得しています...');
    const docRef = doc(db, 'users', userId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return false;

    const data = snapshot.data();
    const serverAffirmations = [...(data.affirmations || [])];
    const currentDocDir = FileSystem.documentDirectory;
    
    // 不足しているオーディオファイルをダウンロード
    for (let i = 0; i < serverAffirmations.length; i++) {
      const aff = serverAffirmations[i];
      if (onProgress) onProgress(`音声データを復旧中... (${i + 1}/${serverAffirmations.length})`);
      
      if (aff.cloudUrl) {
        // パス補正ロジック：古いビルドの絶対パスが含まれている場合は「今のパス」で探し直す
        let targetUri = aff.uri;
        if (targetUri.includes('/Documents/') && !targetUri.startsWith(currentDocDir as string)) {
          const filename = targetUri.split('/').pop();
          targetUri = `${currentDocDir}${filename}`;
        }

        const fileInfo = await FileSystem.getInfoAsync(targetUri);
        if (!fileInfo.exists) {
          try {
            // クラウドから再ダウンロード
            const ext = aff.cloudUrl.includes('.mp3') ? '.mp3' : '.m4a';
            const newLocalUri = `${currentDocDir}sync_${aff.id}${ext}`;
            await FileSystem.downloadAsync(aff.cloudUrl, newLocalUri);
            serverAffirmations[i] = { ...aff, uri: newLocalUri };
          } catch (err) {
            console.warn(`Failed to restore audio ${aff.id}:`, err);
          }
        } else {
          // ファイルが存在する場合も、念のためURIを最新のパスに更新
          serverAffirmations[i] = { ...aff, uri: targetUri };
        }
      }
    }

    useAppStore.setState({
      affirmations: serverAffirmations,
      playlists: data.playlists || [],
      savedTexts: data.savedTexts || [],
      listenedDays: data.listenedDays || {},
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
    });
    return true;
  } catch (error) {
    console.error("Restore from cloud error:", error);
    throw error;
  }
};
