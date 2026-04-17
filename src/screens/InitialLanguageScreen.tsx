import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Languages } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function InitialLanguageScreen() {
  const { setLanguage, hasSetLanguage, isDarkMode } = useAppStore();

  if (hasSetLanguage) return null;

  const handleSelect = (lang: 'ja' | 'en') => {
    setLanguage(lang);
  };

  const bgColor = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#FFFFFF', '#F0F8FF'];
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';

  return (
    <Modal visible={true} animationType="fade" transparent={false}>
      <LinearGradient colors={bgColor as [string, string]} style={styles.container}>
        <SafeAreaView style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Languages color="#6B4EFF" size={48} />
            </View>
            <Text style={[styles.title, { color: textColor }]}>Choose Your Language</Text>
            <Text style={[styles.subtitle, { color: subTextColor }]}>言語を選択してください</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.langButton, { backgroundColor: '#6B4EFF' }]} 
              onPress={() => handleSelect('en')}
            >
              <Text style={styles.flag}>🇺🇸</Text>
              <View>
                <Text style={styles.buttonTextTitle}>English</Text>
                <Text style={styles.buttonTextSub}>Continue in English</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langButton, { backgroundColor: '#6B4EFF' }]} 
              onPress={() => handleSelect('ja')}
            >
              <Text style={styles.flag}>🇯🇵</Text>
              <View>
                <Text style={styles.buttonTextTitle}>日本語</Text>
                <Text style={styles.buttonTextSub}>日本語で利用する</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: subTextColor }]}>
              You can change this later in settings.
            </Text>
            <Text style={[styles.footerText, { color: subTextColor }]}>
              設定からいつでも変更可能です
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(107, 78, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 20,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  flag: {
    fontSize: 32,
    marginRight: 20,
  },
  buttonTextTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonTextSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
  }
});
