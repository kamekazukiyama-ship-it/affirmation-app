import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { Mail, Lock, LogIn, UserPlus, ArrowLeft } from 'lucide-react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export function AuthScreen({ navigation }: any) {
  const store = useAppStore();
  const themeColors = store.isDarkMode ? ['#1A1A2E', '#16213E'] : ['#E0EAFC', '#CFDEF3'];
  const textColor = store.isDarkMode ? '#FFFFFF' : '#333333';
  const subTextColor = store.isDarkMode ? '#A0A0A0' : '#666666';
  const cardBg = store.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)';
  const borderColor = store.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const inputBg = store.isDarkMode ? 'rgba(0,0,0,0.3)' : '#FFFFFF';

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    // 全角を半角に変換し、前後の空白を取り除き、小文字にする
    const normalizedEmail = email
      .replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/　/g, ' ')
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        Alert.alert('ログイン成功', 'クラウド同期の準備が整いました！', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        Alert.alert('登録成功', 'アカウントを作成しました！クラウド同期の準備が整いました！', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMsg = '認証に失敗しました。';
      if (error.code === 'auth/email-already-in-use') errorMsg = 'このメールアドレスは既に使われています。';
      if (error.code === 'auth/invalid-email') errorMsg = `無効なメールアドレスです。\n送信された値: [${normalizedEmail}]\n半角英数字（例: test@test.com）になっているか確認してください。`;
      if (error.code === 'auth/weak-password') errorMsg = 'パスワードは6文字以上で設定してください。';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') errorMsg = 'メールアドレスまたはパスワードが間違っています。';
      
      Alert.alert('エラー', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: cardBg, borderColor }]} 
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={textColor} size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              {isLoginMode ? 'おかえりなさい' : 'アカウント作成'}
            </Text>
            <Text style={[styles.subtitle, { color: subTextColor }]}>
              データを安全にクラウドに保存し、{'\n'}どの端末からでもアクセスできるようにします。
            </Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor }]}>
            <View style={[styles.inputGroup, { backgroundColor: inputBg, borderColor }]}>
              <Mail color={subTextColor} size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="メールアドレス"
                placeholderTextColor={subTextColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: inputBg, borderColor }]}>
              <Lock color={subTextColor} size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="パスワード (6文字以上)"
                placeholderTextColor={subTextColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.mainButton, { opacity: isLoading ? 0.7 : 1 }]} 
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  {isLoginMode ? <LogIn color="#FFFFFF" size={20} /> : <UserPlus color="#FFFFFF" size={20} />}
                  <Text style={styles.mainButtonText}>
                    {isLoginMode ? 'ログインする' : '登録して始める'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton} 
              onPress={() => setIsLoginMode(!isLoginMode)}
            >
              <Text style={[styles.switchButtonText, { color: '#00F2FE' }]}>
                {isLoginMode ? '新規アカウント作成はこちら' : '既にアカウントをお持ちの方はこちら'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 10,
  },
  header: { marginTop: 80, marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  mainButton: {
    backgroundColor: '#00F2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    marginTop: 10,
    shadowColor: '#00F2FE',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  switchButton: { marginTop: 20, padding: 10, alignItems: 'center' },
  switchButtonText: { fontSize: 14, fontWeight: '600' },
});
