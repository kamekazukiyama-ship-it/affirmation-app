import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { Mail, Lock, LogIn, UserPlus, Globe } from 'lucide-react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getTranslation } from '../i18n/translations';

export function AuthScreen({ navigation }: any) {
  const store = useAppStore();
  const { language, setLanguage } = store;
  const themeColors = store.isDarkMode ? ['#1A1A2E', '#16213E'] : ['#E0EAFC', '#CFDEF3'];
  const textColor = store.isDarkMode ? '#FFFFFF' : '#333333';
  const subTextColor = store.isDarkMode ? '#A0A0A0' : '#666666';
  const cardBg = store.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)';
  const borderColor = store.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const inputBg = store.isDarkMode ? 'rgba(0,0,0,0.3)' : '#FFFFFF';
  const activeColor = '#6B4EFF';

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = (key: string, param?: string) => {
    let text = getTranslation(language, 'login', key);
    if (param) text = text.replace('{0}', param);
    return text;
  };

  const handleAuth = async () => {
    const normalizedEmail = email
      .replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/　/g, ' ')
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert(getTranslation(language, 'common', 'error'), t('errInput'));
      return;
    }

    setIsLoading(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        Alert.alert(t('successLogin'), t('successLoginMsg'), [
          { text: 'OK', onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          }
        ]);
      } else {
        await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        Alert.alert(t('successRegister'), t('successRegisterMsg'), [
          { text: 'OK', onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          }
        ]);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMsg = t('errAuth');
      if (error.code === 'auth/email-already-in-use') errorMsg = t('errAlreadyInUse');
      if (error.code === 'auth/invalid-email') errorMsg = t('errInvalidEmail', normalizedEmail);
      if (error.code === 'auth/weak-password') errorMsg = t('errWeakPass');
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') errorMsg = t('errWrongCred');
      
      Alert.alert(getTranslation(language, 'common', 'error'), errorMsg);
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
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
            
            {/* 言語切替ボタン */}
            <View style={styles.langSelectorContainer}>
              <View style={[styles.langSelector, { backgroundColor: cardBg, borderColor }]}>
                <Globe color={textColor} size={16} style={{ marginRight: 8 }} />
                <TouchableOpacity 
                  onPress={() => setLanguage('ja')}
                  style={[styles.langBtn, language === 'ja' && { backgroundColor: activeColor }]}
                >
                  <Text style={[styles.langBtnText, { color: language === 'ja' ? '#FFF' : subTextColor }]}>JA</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setLanguage('en')}
                  style={[styles.langBtn, language === 'en' && { backgroundColor: activeColor }]}
                >
                  <Text style={[styles.langBtnText, { color: language === 'en' ? '#FFF' : subTextColor }]}>EN</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>
                {isLoginMode ? t('welcome') : t('createAcct')}
              </Text>
              <Text style={[styles.subtitle, { color: subTextColor }]}>
                {t('subtitle')}
              </Text>
            </View>

            <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor }]}>
              <View style={[styles.inputGroup, { backgroundColor: inputBg, borderColor }]}>
                <Mail color={subTextColor} size={20} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder={t('email')}
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
                  placeholder={t('password')}
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
                      {isLoginMode ? t('btnLogin') : t('btnRegister')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.switchButton} 
                onPress={() => setIsLoginMode(!isLoginMode)}
              >
                <Text style={[styles.switchButtonText, { color: '#BF00FF' }]}>
                  {isLoginMode ? t('switchRegister') : t('switchLogin')}
                </Text>
              </TouchableOpacity>

              {/* --- Apple審査対応: ゲスト利用セクション --- */}
              <View style={{ height: 1.5, backgroundColor: borderColor, marginVertical: 24 }} />
              
              <TouchableOpacity 
                style={[styles.guestButton, { borderColor: store.isDarkMode ? '#00F2FE' : '#6B4EFF' }]} 
                onPress={async () => {
                  setIsLoading(true);
                  try {
                    await signOut(auth);
                    await signInAnonymously(auth);
                    setIsLoading(false);
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                  } catch (e: any) {
                    setIsLoading(false);
                    Alert.alert(getTranslation(language, 'common', 'error'), t('errGuest') + '\n' + e.message);
                  }
                }}
                disabled={isLoading}
              >
                <Text style={[styles.guestButtonText, { color: store.isDarkMode ? '#00F2FE' : '#6B4EFF' }]}>
                  {t('guestBtn')}
                </Text>
              </TouchableOpacity>

              <View style={styles.benefitBox}>
                <Text style={[styles.benefitText, { color: subTextColor }]}>
                   {t('guestBenefit1')}
                </Text>
                <Text style={[styles.benefitText, { color: subTextColor, marginTop: 4 }]}>
                   {t('guestBenefit2')}
                </Text>
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  langSelectorContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    right: 20,
    zIndex: 100,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: { marginTop: 60, marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
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
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  switchButton: { marginTop: 20, padding: 10, alignItems: 'center' },
  switchButtonText: { fontSize: 14, fontWeight: '600' },
  guestButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestButtonText: { fontSize: 16, fontWeight: 'bold' },
  benefitBox: { marginTop: 10 },
  benefitText: { fontSize: 12, textAlign: 'center', lineHeight: 18 }
});
