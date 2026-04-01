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
          const response = await fetch(aff.uri);
          const blob = await response.blob();
          
          const audioRef = ref(storage, `users/${userId}/audio/${aff.id}.m4a`);
          await uploadBytes(audioRef, blob);
          const downloadUrl = await getDownloadURL(audioRef);
          
          // クラウドURLを保存
          affirmations[i] = { ...aff, cloudUrl: downloadUrl };
        } catch (err) {
          console.warn(`Failed to upload audio ${aff.id}:`, err);
          // エラーでも続行（一部だけアップロード失敗した等）
        }
      }
    }

    if (onProgress) onProgress('データベースに同期中...');

    // Firestoreにアプリ全体の状態を保存
    // Firestoreは undefined を許容しないため、JSON経由で undefined なプロパティを消去する
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

    // 成功したらローカルステートも更新（cloudUrlを反映させるため）
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

    if (!snapshot.exists()) {
      return false; // クラウドにデータが存在しない
    }

    const data = snapshot.data();
    const serverAffirmations = data.affirmations || [];
    
    // 不足しているオーディオファイルをダウンロード
    for (let i = 0; i < serverAffirmations.length; i++) {
      const aff = serverAffirmations[i];
      if (onProgress) onProgress(`不足している音声データをダウンロード中... (${i + 1}/${serverAffirmations.length})`);
      
      if (aff.uri) {
        // 現在のデバイスにこのファイルが存在するかチェック
        const fileInfo = await FileSystem.getInfoAsync(aff.uri);
        if (!fileInfo.exists && aff.cloudUrl) {
          try {
            // ダウンロードしてuriを書き換え
            let ext = aff.cloudUrl.includes('.mp3') ? '.mp3' : '.m4a';
            const newLocalUri = FileSystem.documentDirectory + `sync_${aff.id}${ext}`;
            await FileSystem.downloadAsync(aff.cloudUrl, newLocalUri);
            serverAffirmations[i] = { ...aff, uri: newLocalUri };
          } catch (err) {
            console.warn(`Failed to download audio ${aff.id}:`, err);
          }
        }
      }
    }

    if (onProgress) onProgress('復元処理の最終仕上げ中...');

    // Zustandの状態を上書き（復元）
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
