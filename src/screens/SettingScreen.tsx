import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Modal, SafeAreaView, Platform, ActivityIndicator, Image, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { FileText, Moon, Sun, HelpCircle, X, Home, Mic, Sparkles, Bell, Cloud, LogOut, Image as ImageIcon, Flame, Share2, Calendar as CalendarIcon, Key, Zap } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { syncToCloud, restoreFromCloud } from '../services/cloudSync';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const { isDarkMode, toggleTheme, isNotificationEnabled, setIsNotificationEnabled, notificationTime, setNotificationTime, bgImageUrl, setBgImageUrl, elevenLabsApiKey, setElevenLabsApiKey, isVisualizationEnabled, setIsVisualizationEnabled, affirmations } = useAppStore();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isProcessingCloud, setIsProcessingCloud] = useState(false);
  const [cloudProgressMsg, setCloudProgressMsg] = useState('');

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('権限エラー', 'カメラロールへのアクセスを許可してください');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      setBgImageUrl(pickerResult.assets[0].uri);
      Alert.alert('完了', 'ホーム画面の背景画像を設定しました！\n（タブから「ホーム」に戻って確認してみてください✨）');
    }
  };

  const handleResetImage = () => {
    Alert.alert('確認', '背景画像をデフォルト状態（グラデーション）に戻しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '戻す', style: 'destructive', onPress: () => setBgImageUrl(null) }
    ]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    Alert.alert('ログアウト', 'ログアウトしますか？ローカルのデータは削除されません。', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: async () => await signOut(auth) }
    ]);
  };

  const handleSyncToCloud = () => {
    if (!user) return;
    Alert.alert(
      'クラウド・バックアップ',
      '現在の端末のデータをクラウドに保存（上書き）しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'バックアップ開始', 
          onPress: async () => {
            try {
              setIsProcessingCloud(true);
              setCloudProgressMsg('データをアップロードしています...\nそのままお待ちください');
              await syncToCloud(user.uid, setCloudProgressMsg);
              setIsProcessingCloud(false);
              Alert.alert('完了', 'クラウドへのバックアップが完了しました！');
            } catch (e: any) {
              setIsProcessingCloud(false);
              Alert.alert('エラー', 'バックアップに失敗しました。\n' + e.message);
            }
          } 
        }
      ]
    );
  };

  const handleRestoreFromCloud = () => {
    if (!user) return;
    Alert.alert(
      'クラウドからの復元',
      'クラウド上のデータをこの端末に復元します。（現在の端末内のデータは上書きされます）',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '復元開始', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessingCloud(true);
              setCloudProgressMsg('データをダウンロードしています...\n音声が多い場合は時間がかかります');
              const hasData = await restoreFromCloud(user.uid, setCloudProgressMsg);
              setIsProcessingCloud(false);
              if (hasData) {
                Alert.alert('完了', 'データの復元が完了しました！');
              } else {
                Alert.alert('お知らせ', 'クラウドにデータが見つかりませんでした。先にバックアップを行ってください。');
              }
            } catch (e: any) {
              setIsProcessingCloud(false);
              Alert.alert('エラー', '復元に失敗しました。\n' + e.message);
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
        title: "アファメーションの時間です✨",
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
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : (bgImageUrl ? 'rgba(255, 255, 255, 0.55)' : '#FFFFFF');
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';
  const activeColor = '#6B4EFF';

  return (
    <LinearGradient colors={themeColors as [string, string]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 10 }}>
          <View>
            <Text style={[styles.title, { color: textColor, marginTop: 0 }]}>設定</Text>
            <Text style={[styles.subtitle, { color: subTextColor, marginTop: 4 }]}>アプリの表示モードや規約を確認できます</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')} style={{ padding: 8, backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor }}>
            <X color={textColor} size={24} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>プレイヤー画面の背景・デザイン</Text>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Sparkles color={textColor} size={24} />
              <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>
                視覚化アニメーションを表示
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

          <Text style={[styles.rowText, { color: textColor, fontSize: 14, marginBottom: 12 }]}>お気に入りの写真を背景に設定</Text>
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
              <Text style={{ color: '#6B4EFF', fontWeight: 'bold' }}>アルバムから写真を選ぶ</Text>
            </TouchableOpacity>
            
            {bgImageUrl && (
              <TouchableOpacity 
                style={[styles.syncButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF3B30', marginTop: 8 }]}
                onPress={handleResetImage}
              >
                <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>写真をリセットする</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
          <Text style={[styles.sectionTitle, { color: textColor }]}>AI音声合成 (ElevenLabs) 設定</Text>
          <Text style={{ color: subTextColor, fontSize: 13, marginBottom: 16, lineHeight: 20 }}>
            自分の声をAIに学習させてアファメーションを作成する場合、ElevenLabsのAPIキーが必要です。
          </Text>
          
          <TextInput
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : '#FFFFFF', 
              color: textColor, 
              padding: 12, 
              borderRadius: 8, 
              borderWidth: 1, 
              borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              marginBottom: 8
            }}
            placeholder="ここにAPIキーを貼り付け (sk_...)"
            placeholderTextColor={subTextColor}
            value={elevenLabsApiKey || ''}
            onChangeText={setElevenLabsApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={{ color: subTextColor, fontSize: 11, marginBottom: 12, lineHeight: 16 }}>
            ※APIキーはあなたの端末内にのみ保存され、開発者には一切送信されません。安心してご利用ください。
          </Text>

          {elevenLabsApiKey ? (
            <Text style={{ color: '#34C759', fontSize: 13, fontWeight: 'bold' }}>✅ APIキー設定済み</Text>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('Generate')}>
              <Text style={{ color: activeColor, fontSize: 13, fontWeight: 'bold' }}>☞ 取得方法をチェックする</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>データ同期・バックアップ</Text>
          {user ? (
            <>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Cloud color={textColor} size={24} />
                  <Text style={[styles.rowText, { color: textColor, marginLeft: 12 }]}>ログイン中</Text>
                </View>
                <Text style={{ color: subTextColor, fontSize: 13 }}>{user.email}</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.syncButton, { backgroundColor: '#00F2FE' }]}
                onPress={handleSyncToCloud}
              >
                <Text style={{ color: '#000', fontWeight: 'bold' }}>今すぐクラウドにバックアップ保存</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.syncButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#00F2FE' }]}
                onPress={handleRestoreFromCloud}
              >
                <Text style={{ color: '#00F2FE', fontWeight: 'bold' }}>クラウドからデータを復元する</Text>
              </TouchableOpacity>
              
              <View style={{ height: 1, backgroundColor: borderColor, marginVertical: 8 }} />
              <TouchableOpacity style={styles.row} onPress={handleLogout}>
                <View style={styles.rowLeft}>
                  <LogOut color="#FF3B30" size={24} />
                  <Text style={[styles.rowText, { color: '#FF3B30', marginLeft: 12 }]}>ログアウト</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.rowText, { color: subTextColor, fontSize: 13, marginBottom: 16, lineHeight: 20 }]}>
                アカウントを作成すると、録音した音声やAIが生成したアファメーションをクラウドにバックアップし、他の端末でも復元できるようになります。
              </Text>
              <TouchableOpacity 
                style={[styles.syncButton, { backgroundColor: '#00F2FE' }]}
                onPress={() => navigation.navigate('Auth')}
              >
                <Text style={{ color: '#000', fontWeight: 'bold' }}>ログイン / アカウント作成</Text>
              </TouchableOpacity>
            </>
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
                  <Sparkles color="#6B4EFF" size={24} style={{ marginLeft: -8 }} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>STEP 1 or 2：音声を作る</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  まず、あなたの潜在意識に届けたい「言葉」を用意します。{'\n'}
                  ・**方法1 (録音)**：自分の声で直接吹き込みます。もっとも熱量が伝わりやすい方法です。{'\n'}
                  ・**方法2 (AI生成)**：自分の声をAIが学習し、無限のアファメーションをあなたの声で代読させます。
                </Text>
              </View>

              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <Zap color="#FF3B30" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>STEP 3：倍速で刻む！</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  録音または生成できたら、プレイヤーで再生しましょう。{'\n'}
                  ・**2倍速〜10倍速**：脳が追いつかないほどの速さで聴くことで、表面的な意識（顕在意識）の批判をすり抜け、ダイレクトに潜在意識へ情報を書き込みます。
                </Text>
              </View>

              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <HelpCircle color="#00F2FE" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>効果的な聴き方のヒント</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  ・**リラックス状態で**：寝起きや寝る前、入浴中など、脳波がアルファ波やシータ波に近いときが最適です。{'\n'}
                  ・**毎日続ける**：潜在意識の書き換えには「繰り返し」が不可欠です。🔥バッジを目指してまずは21日間続けてみましょう。{'\n'}
                  ・**背景をカスタム**：設定から「推し」や「理想の生活」の写真を背景に。視覚と聴覚の両面から自分をプログラミングしてください。
                </Text>
              </View>

              <View style={[styles.tutorialCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.tutorialHeader}>
                  <Flame color="#FF9500" size={24} />
                  <Text style={[styles.tutorialCardTitle, { color: textColor }]}>毎日のモチベーション維持機能</Text>
                </View>
                <Text style={[styles.tutorialText, { color: subTextColor }]}>
                  ・ホーム画面上部に表示される「🔥 〇日連続」のバッジをタップすると、これまでの記録カレンダーを確認できます！{'\n'}
                  ・「設定画面」の「ホーム画面の特別な背景」から、スマホ内の好きな画像を背景に設定できます（推しやペットの写真がおすすめ！）。{'\n'}
                  ・各アファメーションの「シェアアイコン」を押すと、現在の日数入りでおしゃれなカード画像としてInstagramやXなどにシェアできます！
                </Text>
              </View>

              <TouchableOpacity style={styles.tutorialCloseButton} onPress={() => setShowTutorial(false)}>
                <Text style={styles.tutorialCloseText}>使い始める</Text>
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
