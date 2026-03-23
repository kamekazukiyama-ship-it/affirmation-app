import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Modal, SafeAreaView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { FileText, Moon, Sun, HelpCircle, X, Home, Mic, Sparkles, Bell } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
export function SettingScreen() {
  const { isDarkMode, toggleTheme, isNotificationEnabled, setIsNotificationEnabled, notificationTime, setNotificationTime } = useAppStore();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const scheduleDailyNotification = async (time: Date) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    // trigger params required for repeating daily
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "アファメーションの時間です✨",
        body: "今日もポジティブな言葉で、自分をアップデートしましょう！",
      },
      trigger: {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      } as any,
    });
  };

  const handleToggleNotification = async (val: boolean) => {
    setIsNotificationEnabled(val);
    if (val) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('エラー', '通知の権限がありません。本体の設定から許可してください。');
        setIsNotificationEnabled(false);
        return;
      }
      await scheduleDailyNotification(new Date(notificationTime));
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedDate) {
      setNotificationTime(selectedDate);
      if (isNotificationEnabled) {
        await scheduleDailyNotification(selectedDate);
      }
    }
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const m = d.getMinutes();
    return `${d.getHours()}:${m < 10 ? '0' : ''}${m}`;
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'プライバシーポリシー',
      '当アプリはユーザーの皆様のプライバシーを尊重します。\n\n・録音データは一時的にクラウドに保存され、AI音声合成の完了後に即座に消去されます。\n・生成された音声データはご本人専用のバケットに保管され、本人のみがアクセス可能です。\n・個人情報は一切の第三者に提供されません。',
      [{ text: '確認しました', style: 'default' }]
    );
  };

  const themeColors = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#F0F8FF', '#E6F4FE'];
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#A0AEC0' : '#8E8E93';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.title, { color: textColor }]}>設定</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>アプリの表示モードや規約を確認できます</Text>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>テーマ設定</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              {isDarkMode ? <Moon color={textColor} size={24} /> : <Sun color={textColor} size={24} />}
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>
                ダークモード
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#00F2FE' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>習慣化サポート</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Bell color={textColor} size={24} />
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>
                毎日のリマインダー通知
              </Text>
            </View>
            <Switch
              value={isNotificationEnabled}
              onValueChange={handleToggleNotification}
              trackColor={{ false: '#767577', true: '#00F2FE' }}
              thumbColor={isNotificationEnabled ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
          
          {isNotificationEnabled && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <Text style={[styles.rowText, { color: subTextColor, fontSize: 14 }]}>通知時刻</Text>
              
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={new Date(notificationTime)}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                  textColor={textColor}
                />
              ) : (
                <TouchableOpacity 
                  onPress={() => setShowTimePicker(true)}
                  style={{ padding: 8, backgroundColor: borderColor, borderRadius: 8 }}
                >
                  <Text style={{ color: textColor }}>{formatTime(notificationTime)}</Text>
                </TouchableOpacity>
              )}

              {Platform.OS === 'android' && showTimePicker && (
                <DateTimePicker
                  value={new Date(notificationTime)}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>情報・ヘルプ</Text>
          <TouchableOpacity style={styles.row} onPress={() => setShowTutorial(true)}>
            <View style={styles.rowLeft}>
              <HelpCircle color={textColor} size={24} />
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>使い方 (チュートリアル)</Text>
            </View>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: borderColor, marginVertical: 8 }} />
          <TouchableOpacity style={styles.row} onPress={handlePrivacyPolicy}>
            <View style={styles.rowLeft}>
              <FileText color={textColor} size={24} />
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>プライバシーポリシー</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* チュートリアルモーダル */}
      <Modal visible={showTutorial} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTutorial(false)}>
        <LinearGradient colors={themeColors as [string, string]} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>アプリの使い方</Text>
              <TouchableOpacity onPress={() => setShowTutorial(false)} style={styles.closeBtn}>
                <X color={textColor} size={28} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              
              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <Home color="#00F2FE" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>ホーム画面（再生）</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  作成したアファメーションの一覧と再生を行います。{'\n'}
                  ・「すべて」「録音」「AI生成」などで表示を切り替えられます。{'\n'}
                  ・リスト上から再生タイトルを長押しすると、名前を変更できます。{'\n'}
                  ・再生速度やBGMを調整して、最も心地よい状態でお楽しみください。
                </Text>
              </View>

              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <Mic color="#34C759" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>録音画面</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  あなた自身の声で自己暗示ワードを録音できます。{'\n'}
                  ・「自己肯定」や「健康」などのAIボタンをタップすると、台本が自動作成されます。{'\n'}
                  ・台本を読みながら録音できるため、とても簡単です。
                </Text>
              </View>

              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <Sparkles color="#FF9500" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>AI生成画面</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  あなたの声をクローンして、AIが読み上げる機能です。{'\n'}
                  1. 「声のサンプルを録音する」で10秒ほど喋ります。{'\n'}
                  2. 読ませたいテーマを選択（または入力）し、テキスト化します。{'\n'}
                  3. 「音声を合成」を押すと、あなたのクローン声が自動で完成します！
                </Text>
              </View>

              <TouchableOpacity style={styles.tutorialCloseButton} onPress={() => setShowTutorial(false)}>
                <Text style={styles.tutorialCloseText}>使い始める</Text>
              </TouchableOpacity>

            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 32 },
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 16, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowText: { fontSize: 16, fontWeight: '500' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  tutorialCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  tutorialHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tutorialCardTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  tutorialText: { fontSize: 14, lineHeight: 24 },
  tutorialCloseButton: { backgroundColor: '#00F2FE', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  tutorialCloseText: { fontSize: 16, fontWeight: 'bold', color: '#0A0A1A' }
});
