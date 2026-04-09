import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';

export function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      // Firebase匿名ログインの実行
      await signInAnonymously(auth);
    } catch (error: any) {
      // エラーコードに応じてメッセージを出すなど後ほどリファクタリング可能
      Alert.alert('ログインに失敗しました', error.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI×倍速×アファメーション</Text>
      <Text style={styles.subtitle}>まずはログインして始めましょう</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleAnonymousLogin}>
          <Text style={styles.buttonText}>匿名でログイン（テスト用）</Text>
        </TouchableOpacity>
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
});
