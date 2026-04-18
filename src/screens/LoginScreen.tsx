import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const language = useAppStore(state => state.language);

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      // ユーザーに「ログイン」を意識させず、ゲストとして匿名ログインを実行
      await signInAnonymously(auth);
    } catch (error: any) {
      Alert.alert(language === 'ja' ? 'エラー' : 'Error', error.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTranslation(language, 'login', 'title')}</Text>
      <Text style={styles.subtitle}>{getTranslation(language, 'login', 'subtitle')}</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <View style={{ width: '100%' }}>
          <TouchableOpacity style={styles.button} onPress={handleAnonymousLogin}>
            <Text style={styles.buttonText}>{getTranslation(language, 'login', 'guestBtn')}</Text>
          </TouchableOpacity>
          <Text style={styles.benefitText}>{getTranslation(language, 'login', 'loginBenefit')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
