import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { auth } from './src/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';
import { Audio } from 'expo-av';
import { LoginScreen } from './src/screens/LoginScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初回起動時にFirebaseのログイン状態を監視し、オーディオ設定を行う
  useEffect(() => {
    // バックグラウンド・マナーモード再生を許可するグローバル設定
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* ログインしていればメイン画面へ、していなければログイン画面へ */}
      {user ? <AppNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}
