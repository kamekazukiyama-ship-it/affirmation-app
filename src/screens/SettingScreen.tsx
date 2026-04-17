import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Modal, SafeAreaView, Platform, ActivityIndicator, Image, TextInput, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { FileText, Moon, Sun, HelpCircle, X, Home, Mic, Sparkles, Bell, Cloud, LogOut, Image as ImageIcon, Flame, Zap, Trash2, Globe } from 'lucide-react-native';
import { getTranslation } from '../i18n/translations';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged, signOut, User, deleteUser } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { syncToCloud, restoreFromCloud } from '../services/cloudSync';
import { doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import Purchases from 'react-native-purchases';
import * as ImagePicker from 'expo-image-picker';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const INSPIRING_MESSAGES = [
  "私は、今日も一日頑張れる人だ！！",
  "私は、日々の習慣を大切にします！",
  "私は、アファメーションで人生を変える！！",
  "私はここで頑張れる存在だ！！",
  "私は日々成長を楽しみます！",
  "あなたならできる！！",
  "あなたはとても頼りになる人だよ！！",
  "カズ、あなたはやればできる人だわ！",
  "私は、自分の無限の可能性を信じています。",
  "今日も最高の一日にすることを自分に誓います。",
  "私は、どんな困難も乗り越える力を持っています。",
  "私は、まわりの人々に愛と感謝を届けます。",
  "今、この瞬間から私の人生は輝き始めます。",
  "私は、成功を手にするにふさわしい人間です。",
  "毎日、少しずつ、確実に良くなっています。",
  "私は、健康で活力に満ち溢れています。",
  "私は、自分の夢を形にする行動力があります。",
  "今日出会うすべての出来事が、私の成長の糧になります。",
  "私は、自分の直感を信じて進みます。",
  "私は、豊かな富とチャンスを引き寄せる磁石です。",
  "私は、自分自身を深く愛し、受け入れています。",
  "私は、常にポジティブなエネルギーを発信しています。",
  "私の未来は、希望と成功で満ちています。",
  "私は、今日という日を全力で楽しみます。",
  "私は、失敗を恐れず挑戦し続ける勇者です。",
  "私は、心が穏やかで、常に平安を感じています。",
  "私は、目標に向かって迷わず突き進みます。",
  "私は、世界に一つだけの価値ある存在です。",
  "私の努力は、必ず実を結びます。",
  "カズ、あなたはすでに成功への道を歩いています！",
  "今日もアプリを開いて自分と向き合うあなたは素晴らしい！",
  "私は、昨日よりもさらに輝いています。",
  "私は、すべてに感謝し、すべてを味方にします。",
  "新しい自分に出会う準備はできていますか？"
];

export function SettingScreen({ navigation }: any) {
  const { isDarkMode, toggleTheme, isNotificationEnabled, setIsNotificationEnabled, notificationTime, setNotificationTime, bgImageUrl, setBgImageUrl, elevenLabsApiKey, setElevenLabsApiKey, isVisualizationEnabled, setIsVisualizationEnabled, affirmations, pointBalance, membershipType, userId, language, setLanguage } = useAppStore();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isProcessingCloud, setIsProcessingCloud] = useState(false);
  const [cloudProgressMsg, setCloudProgressMsg] = useState('');

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(language === 'ja' ? '権限エラー' : 'Permission Error', language === 'ja' ? 'カメラロールへのアクセスを許可してください' : 'Please allow camera roll access');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      setBgImageUrl(pickerResult.assets[0].uri);
      Alert.alert(language === 'ja' ? '完了' : 'Success', language === 'ja' ? 'ホーム画面の背景画像を設定しました！\n（タブから「ホーム」に戻って確認してみてください✨）' : 'Background image set! Check home screen ✨');
    }
  };

  const handleResetImage = () => {
    Alert.alert(language === 'ja' ? '確認' : 'Reset', language === 'ja' ? '背景画像をデフォルト状態（グラデーション）に戻しますか？' : 'Reset background image?', [
      { text: getTranslation(language, 'player', 'cancel'), style: 'cancel' },
      { text: language === 'ja' ? '戻す' : 'Reset', style: 'destructive', onPress: () => setBgImageUrl(null) }
    ]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    Alert.alert(getTranslation(language, 'settings', 'logout'), language === 'ja' ? 'ログアウトしますか？ローカルのデータは削除されません。' : 'Logout now? Local data will not be deleted.', [
      { text: getTranslation(language, 'player', 'cancel'), style: 'cancel' },
      { text: getTranslation(language, 'settings', 'logout'), style: 'destructive', onPress: async () => await signOut(auth) }
    ]);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    Alert.alert(
      language === 'ja' ? '⚠️ 退会（アカウント削除）' : '⚠️ Delete Account',
      language === 'ja' ? 'クラウド上のバックアップデータとアカウントを完全に削除しますか？\n（この操作は取り消せません）' : 'Delete cloud backup and account completely? (Cannot be undone)',
      [
        { text: getTranslation(language, 'player', 'cancel'), style: 'cancel' },
        { 
          text: getTranslation(language, 'settings', 'deleteAcct'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              setIsProcessingCloud(true);
              setCloudProgressMsg(language === 'ja' ? 'アカウント情報を削除しています...' : 'Deleting account data...');
              
              const docRef = doc(db, 'users', user.uid);
              await deleteDoc(docRef);
              await deleteUser(user);
              
              setIsProcessingCloud(false);
              Alert.alert(language === 'ja' ? '完了' : 'Success', language === 'ja' ? 'アカウントの削除が完了しました。ご利用ありがとうございました。' : 'Account deleted.');
            } catch (e: any) {
              setIsProcessingCloud(false);
              if (e.code === 'auth/requires-recent-login') {
                Alert.alert(
                  language === 'ja' ? '再ログインが必要です' : 'Recent login required',
                  language === 'ja' ? 'セキュリティ保護のため、アカウント削除には最近のログインが必要です。一度ログアウトしてから再度ログインして実行してください。' : 'For security, please logout and login again before deleting your account.'
                );
              } else {
                Alert.alert(language === 'ja' ? 'エラー' : 'Error', language === 'ja' ? 'アカウントの削除に失敗しました。\n' : 'Failed to delete account.\n' + e.message);
              }
            }
          } 
        }
      ]
    );
  };

  const handleSyncToCloud = () => {
    if (!user) return;
    Alert.alert(
      getTranslation(language, 'settings', 'syncTitle'),
      language === 'ja' ? '現在の端末のデータをクラウドに保存（上書き）しますか？' : 'Backup current device data to cloud?',
      [
        { text: getTranslation(language, 'player', 'cancel'), style: 'cancel' },
        { 
          text: language === 'ja' ? 'バックアップ開始' : 'Start Backup', 
          onPress: async () => {
            try {
              setIsProcessingCloud(true);
              setCloudProgressMsg(language === 'ja' ? 'データをアップロードしています...\nそのままお待ちください' : 'Uploading data...\nPlease wait');
              await syncToCloud(user.uid, setCloudProgressMsg);
              setIsProcessingCloud(false);
              Alert.alert(language === 'ja' ? '完了' : 'Success', language === 'ja' ? 'クラウドへのバックアップが完了しました！' : 'Cloud backup complete!');
            } catch (e: any) {
              setIsProcessingCloud(false);
              Alert.alert(language === 'ja' ? 'エラー' : 'Error', language === 'ja' ? 'バックアップに失敗しました。\n' : 'Backup failed.\n' + e.message);
            }
          } 
        }
      ]
    );
  };

  const handleRestoreFromCloud = () => {
    if (!user) return;
    Alert.alert(
      language === 'ja' ? 'クラウドからの復元' : 'Cloud Restore',
      language === 'ja' ? 'クラウド上のデータをこの端末に復元します。（現在の端末内のデータは上書きされます）' : 'Restore from cloud? (Current data will be overwritten)',
      [
        { text: getTranslation(language, 'player', 'cancel'), style: 'cancel' },
        { 
          text: language === 'ja' ? '復元開始' : 'Start Restore', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessingCloud(true);
              setCloudProgressMsg(language === 'ja' ? 'データをダウンロードしています...\n音声が多い場合は時間がかかります' : 'Downloading data...\nThis may take a while');
              const hasData = await restoreFromCloud(user.uid, setCloudProgressMsg);
              setIsProcessingCloud(false);
              if (hasData) {
                Alert.alert(language === 'ja' ? '完了' : 'Success', language === 'ja' ? 'データの復元が完了しました！' : 'Data restored!');
              } else {
                Alert.alert(language === 'ja' ? 'お知らせ' : 'Info', language === 'ja' ? 'クラウドにデータが見つかりませんでした。先にバックアップを行ってください。' : 'No data found in cloud.');
              }
            } catch (e: any) {
              setIsProcessingCloud(false);
              Alert.alert(language === 'ja' ? 'エラー' : 'Error', language === 'ja' ? '復元に失敗しました。\n' : 'Restore failed.\n' + e.message);
            }
          } 
        }
      ]
    );
  };

  const scheduleDailyNotification = async (time: Date) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // カズさんの要望メッセージとユーザーのアファメーションを組み合わせてランダムに選ぶ
    let notificationBody = INSPIRING_MESSAGES[Math.floor(Math.random() * INSPIRING_MESSAGES.length)];
    
    if (affirmations.length > 0 && Math.random() > 0.5) {
      const randomIndex = Math.floor(Math.random() * affirmations.length);
      const randomAff = affirmations[randomIndex];
      notificationBody = `今日の一言： ${randomAff.text || randomAff.title}`;
    }

    // trigger params required for repeating daily
    await Notifications.scheduleNotificationAsync({
      content: {
        title: language === 'ja' ? "アファメーションの時間です✨" : "Affirmation Time ✨",
        body: notificationBody,
        android: {
          channelId: 'default',
        },
      } as any,
      trigger: {
        type: 'daily',
        hour: time.getHours(),
        minute: time.getMinutes(),
      } as any,
    });
  };

  const handleToggleNotification = async (val: boolean) => {
    setIsNotificationEnabled(val);
    if (val) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(language === 'ja' ? 'エラー' : 'Error', language === 'ja' ? '通知の権限がありません。本体の設定から許可してください。' : 'No notification permission. Please enable in settings.');
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
    const h = d.getHours();
    if (language === 'en') {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m < 10 ? '0' : ''}${m} ${ampm}`;
    }
    return `${h}:${m < 10 ? '0' : ''}${m}`;
  };

  const handlePrivacyPolicy = () => {
    if (language === 'en') {
      Alert.alert(
        'Privacy Policy',
        'We respect your privacy.\n\n[Use of External Services]\nFor text and speech synthesis, we use third-party AI (OpenAI, ElevenLabs). Data is used solely for generation.\n\n[Data Handling]\n- Recordings are temporarily stored in the cloud and deleted immediately after synthesis.\n- Generated audio is stored in your private bucket.\n- Personal info is never shared.',
        [
          { text: 'Full Policy (Web)', onPress: () => Linking.openURL('https://docs.google.com/document/d/e/2PACX-1vRXwLvJzuRj_zVqkd-OmA0k-jHqQ9de6r_R1aFrOdDd0VeYtgvLY6vEaUxDa06wi9ecIxLnm-1wg8vm/pub') },
          { text: 'OK', style: 'default' }
        ]
      );
    } else {
      Alert.alert(
        'プライバシーポリシー',
        '当アプリはユーザーの皆様のプライバシーを尊重します。\n\n【外部サービスの利用について】\nアファメーションの生成および音声合成のため、第三者AIサービス（OpenAI, ElevenLabs）を利用しています。送信されたデータは生成の目的のみに使用されます。\n\n【データの取り扱いについて】\n・録音データは一時的にクラウドに保存され、AI音声合成の完了後に即座に消去されます。\n・生成された音声データはご本人専用のバケットに保管され、本人のみがアクセス可能です。\n・個人情報は一切の第三者に提供されません。',
        [
          { text: 'Webで全文を確認', onPress: () => Linking.openURL('https://docs.google.com/document/d/e/2PACX-1vRXwLvJzuRj_zVqkd-OmA0k-jHqQ9de6r_R1aFrOdDd0VeYtgvLY6vEaUxDa06wi9ecIxLnm-1wg8vm/pub') },
          { text: '確認しました', style: 'default' }
        ]
      );
    }
  };
  

  const themeColors = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#F0F8FF', '#E6F4FE'];
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#A0AEC0' : '#8E8E93';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : (bgImageUrl ? 'rgba(255, 255, 255, 0.55)' : '#FFFFFF');
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';
  const activeColor = '#6B4EFF';

  return (
    <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 10 }}>
          <View>
            <Text style={[styles.title, { color: textColor, marginTop: 0 }]}>{getTranslation(language, 'settings', 'title')}</Text>
            <Text style={[styles.subtitle, { color: subTextColor, marginTop: 4 }]}>{getTranslation(language, 'settings', 'subtitle')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')} style={{ padding: 8, backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor }}>
            <X color={textColor} size={24} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {/* 言語設定セクションを追加 */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'langTitle')}</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Globe color={textColor} size={24} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.rowText, { color: textColor }]}>
                  {getTranslation(language, 'settings', 'langLabel')}
                </Text>
                <Text style={{ color: subTextColor, fontSize: 12 }}>
                  {language === 'ja' ? '日本語' : 'English'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F2F2F7', borderRadius: 8, padding: 4 }}>
              <TouchableOpacity 
                onPress={() => setLanguage('ja')}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: language === 'ja' ? activeColor : 'transparent' }}
              >
                <Text style={{ color: language === 'ja' ? 'white' : subTextColor, fontWeight: 'bold' }}>JA</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setLanguage('en')}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: language === 'en' ? activeColor : 'transparent' }}
              >
                <Text style={{ color: language === 'en' ? 'white' : subTextColor, fontWeight: 'bold' }}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'visTitle')}</Text>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Sparkles color={textColor} size={24} />
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>
                {getTranslation(language, 'settings', 'visToggle')}
              </Text>
            </View>
            <Switch
              value={isVisualizationEnabled}
              onValueChange={setIsVisualizationEnabled}
              trackColor={{ false: '#767577', true: '#00F2FE' }}
              thumbColor={isVisualizationEnabled ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>

          <View style={{ height: 1, backgroundColor: borderColor, marginVertical: 8 }} />

          <Text style={[styles.rowText, { color: textColor, fontSize: 14, marginBottom: 12 }]}>{getTranslation(language, 'settings', 'bgImgTitle')}</Text>
          <View style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            {bgImageUrl && (
              <View style={{ width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                <Image source={{ uri: bgImageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            )}
            <TouchableOpacity 
              style={[styles.syncButton, { backgroundColor: isDarkMode ? '#1A1B33' : '#F0F4FF', marginTop: 4, flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#6B4EFF' }]}
              onPress={handlePickImage}
            >
              <ImageIcon color="#6B4EFF" size={20} style={{ marginRight: 8 }} />
              <Text style={{ color: '#6B4EFF', fontWeight: 'bold' }}>{getTranslation(language, 'settings', 'btnPickImg')}</Text>
            </TouchableOpacity>
            
            {bgImageUrl && (
              <TouchableOpacity 
                style={[styles.syncButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF3B30', marginTop: 8 }]}
                onPress={handleResetImage}
              >
                <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>{getTranslation(language, 'settings', 'btnResetImg')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'themeTitle')}</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              {isDarkMode ? <Moon color={textColor} size={24} /> : <Sun color={textColor} size={24} />}
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>
                {getTranslation(language, 'settings', 'darkToggle')}
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
          <Text style={[styles.sectionTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'habTitle')}</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Bell color={textColor} size={24} />
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>
                {getTranslation(language, 'settings', 'notifToggle')}
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
              <Text style={[styles.rowText, { color: subTextColor, fontSize: 14 }]}>{getTranslation(language, 'settings', 'notifTime')}</Text>
              
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
          <Text style={[styles.sectionTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'syncTitle')}</Text>
          {user ? (
            <>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Cloud color={textColor} size={24} />
                  <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>{getTranslation(language, 'settings', 'loggedIn')}</Text>
                </View>
                <Text style={{ color: subTextColor, fontSize: 13 }}>{user.email}</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.syncButton, { backgroundColor: '#00F2FE' }]}
                onPress={handleSyncToCloud}
              >
                <Text style={{ color: '#000', fontWeight: 'bold' }}>{getTranslation(language, 'settings', 'btnSync')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.syncButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#00F2FE' }]}
                onPress={handleRestoreFromCloud}
              >
                <Text style={{ color: '#00F2FE', fontWeight: 'bold' }}>{getTranslation(language, 'settings', 'btnRestore')}</Text>
              </TouchableOpacity>
              
              <View style={{ height: 1, backgroundColor: borderColor, marginVertical: 8 }} />
              <TouchableOpacity style={styles.row} onPress={handleLogout}>
                <View style={styles.rowLeft}>
                  <LogOut color="#FF3B30" size={24} />
                  <Text style={[styles.rowText, { color: '#FF3B30', marginLeft: 12 }]}>{getTranslation(language, 'settings', 'logout')}</Text>
                </View>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: borderColor, marginVertical: 8 }} />
              <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
                <View style={styles.rowLeft}>
                  <Trash2 color={subTextColor} size={24} />
                  <Text style={[styles.rowText, { color: subTextColor, marginLeft: 12, fontSize: 13 }]}>{getTranslation(language, 'settings', 'deleteAcct')}</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.rowText, { color: subTextColor, fontSize: 13, marginBottom: 16, lineHeight: 20 }]}>
                {getTranslation(language, 'settings', 'loginPrompt')}
              </Text>
              <TouchableOpacity 
                style={[styles.syncButton, { backgroundColor: '#00F2FE' }]}
                onPress={() => navigation.navigate('Auth')}
              >
                <Text style={{ color: '#000', fontWeight: 'bold' }}>{getTranslation(language, 'settings', 'btnLogin')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'infoTitle')}</Text>
          <TouchableOpacity style={styles.row} onPress={() => setShowTutorial(true)}>
            <View style={styles.rowLeft}>
              <HelpCircle color={textColor} size={24} />
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>{getTranslation(language, 'settings', 'tutorial')}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: borderColor, marginVertical: 8 }} />
          <TouchableOpacity style={styles.row} onPress={handlePrivacyPolicy}>
            <View style={styles.rowLeft}>
              <FileText color={textColor} size={24} />
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>{getTranslation(language, 'settings', 'privacy')}</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* チュートリアルモーダル */}
      <Modal visible={showTutorial} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTutorial(false)}>
        <LinearGradient colors={themeColors as [string, string]} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'tutorialTitle')}</Text>
              <TouchableOpacity onPress={() => setShowTutorial(false)} style={styles.closeBtn}>
                <X color={textColor} size={28} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              
              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <Home color="#00F2FE" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'tutoHomeTitle')}</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  {getTranslation(language, 'settings', 'tutoHomeText')}
                </Text>
              </View>

              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <Mic color="#34C759" size={24} />
                  <Sparkles color="#6B4EFF" size={24} style={{ marginLeft: -8 }} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'tutoStep1Title')}</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  {getTranslation(language, 'settings', 'tutoStep1Text')}
                </Text>
              </View>

              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <Zap color="#FF3B30" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'tutoStep3Title')}</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  {getTranslation(language, 'settings', 'tutoStep3Text')}
                </Text>
              </View>

              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <HelpCircle color="#00F2FE" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'tutoTipTitle')}</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  {getTranslation(language, 'settings', 'tutoTipText')}
                </Text>
              </View>

              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <Flame color="#FF9500" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>{getTranslation(language, 'settings', 'tutoMotivTitle')}</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  {getTranslation(language, 'settings', 'tutoMotivText')}
                </Text>
              </View>

              <TouchableOpacity style={styles.tutorialCloseButton} onPress={() => setShowTutorial(false)}>
                <Text style={styles.tutorialCloseText}>{getTranslation(language, 'settings', 'tutorialStart')}</Text>
              </TouchableOpacity>

            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
      {/* Cloud Processing Overlay */}
      {isProcessingCloud && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00F2FE" />
          <Text style={styles.loadingText}>{cloudProgressMsg}</Text>
        </View>
      )}

      </SafeAreaView>
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
  syncButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  purchaseBtn: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchaseTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  purchaseDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  tutorialCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  tutorialHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tutorialCardTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  tutorialText: { fontSize: 14, lineHeight: 24 },
  tutorialCloseButton: { backgroundColor: '#00F2FE', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  tutorialCloseText: { fontSize: 16, fontWeight: 'bold', color: '#0A0A1A' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 24,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  }
});
