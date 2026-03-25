import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mic, Sparkles, Play, Flame, Zap, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useAppStore } from '../store/useAppStore';

// カレンダーの日本語化設定
LocaleConfig.locales['ja'] = {
  monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
  dayNamesShort: ['日','月','火','水','木','金','土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'ja';

const { width } = Dimensions.get('window');

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { affirmations, currentStreak, listenedDays, isDarkMode } = useAppStore();
  const [showCalendar, setShowCalendar] = useState(false);

  const themeColors = isDarkMode ? ['#0A0A1A', '#1A1A2E'] : ['#F0F8FF', '#E6F4FE'];
  const bgColor = isDarkMode ? '#0A0A1A' : '#F8F9FA';
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const cardBg = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDarkMode ? '#2C2C2E' : '#E5E5EA';

  const recordCount = affirmations.filter(a => !a.title.includes('AI生成')).length;
  const aiCount = affirmations.filter(a => a.title.includes('AI生成')).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: subTextColor }]}>おはようございます</Text>
            <Text style={[styles.title, { color: textColor }]}>倍速アファメーション</Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: isDarkMode ? '#331B1B' : '#FFF3E0' }]}>
            <Flame color="#FF9500" size={20} />
            <Text style={[styles.streakText, { color: isDarkMode ? '#FFB340' : '#E67E22' }]}>{currentStreak} 日</Text>
          </View>
        </View>

        {/* Motivation Banner */}
        <View style={[styles.banner, { backgroundColor: isDarkMode ? '#1A1B33' : '#F0F4FF' }]}>
          <Sparkles color="#6B4EFF" size={24} style={{ marginRight: 16 }} />
          <Text style={[styles.bannerText, { color: isDarkMode ? '#C7C2FF' : '#4A3B99' }]}>
            毎日の積み重ねが{'\n'}奇跡を生む
          </Text>
        </View>

        {/* Start Session Button */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Player')}
          style={styles.mainButton}
        >
          <Play color="#FFFFFF" size={28} fill="#FFFFFF" style={{ marginRight: 16 }} />
          <View>
            <Text style={styles.mainButtonTitle}>セッションを開始</Text>
            <Text style={styles.mainButtonSub}>プレイヤーを開く</Text>
          </View>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => navigation.navigate('Playlists', { initialTab: 'mic' })}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(255,59,48,0.1)' : '#FFEBEB' }]}>
              <Mic color="#FF3B30" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#FF3B30' }]}>{recordCount}</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>録音</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => navigation.navigate('Playlists', { initialTab: 'ai' })}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(0,122,255,0.1)' : '#E5F1FF' }]}>
              <Sparkles color="#007AFF" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#007AFF' }]}>{aiCount}</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>AI生成</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => setShowCalendar(true)}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(255,149,0,0.1)' : '#FFF3E0' }]}>
              <Flame color="#FF9500" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#FF9500' }]}>{currentStreak}</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>連続日数</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>クイックアクション</Text>
        <View style={styles.quickActionRow}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Record')}
            style={[styles.quickCard, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(255,59,48,0.1)' : '#FFEBEB', marginBottom: 12 }]}>
              <Mic color="#FF3B30" size={24} />
            </View>
            <Text style={[styles.quickTitle, { color: textColor }]}>録音する</Text>
            <Text style={[styles.quickSub, { color: subTextColor }]}>自分の声でアファメーション</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Generate')}
            style={[styles.quickCard, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(0,122,255,0.1)' : '#E5F1FF', marginBottom: 12 }]}>
              <Sparkles color="#007AFF" size={24} />
            </View>
            <Text style={[styles.quickTitle, { color: textColor }]}>AI生成</Text>
            <Text style={[styles.quickSub, { color: subTextColor }]}>AIがアファメーションを作成</Text>
          </TouchableOpacity>
        </View>

        {/* How to use */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>使い方</Text>
        
        <View style={[styles.guideCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.guideStepCircle}><Text style={styles.guideStepText}>1</Text></View>
          <Mic color={textColor} size={24} style={{ marginHorizontal: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.guideTitle, { color: textColor }]}>録音する</Text>
            <Text style={[styles.guideDesc, { color: subTextColor }]}>「録音」タブで自分の声でアファメーションを録音</Text>
          </View>
        </View>

        <View style={[styles.guideCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.guideStepCircle}><Text style={styles.guideStepText}>2</Text></View>
          <Sparkles color="#FFCC00" size={24} style={{ marginHorizontal: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.guideTitle, { color: textColor }]}>AI生成</Text>
            <Text style={[styles.guideDesc, { color: subTextColor }]}>「AI生成」タブでAIにアファメーションを作成してもらう</Text>
          </View>
        </View>

        <View style={[styles.guideCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.guideStepCircle}><Text style={styles.guideStepText}>3</Text></View>
          <Zap color="#FF3B30" size={24} style={{ marginHorizontal: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.guideTitle, { color: textColor }]}>倍速再生</Text>
            <Text style={[styles.guideDesc, { color: subTextColor }]}>「プレイヤー」で2〜10倍速で再生して潜在意識に刻む</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* カレンダーモーダル */}
      <Modal visible={showCalendar} animationType="slide" transparent={true}>
        <LinearGradient colors={themeColors as [string, string]} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: borderColor }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: textColor }}>記録カレンダー</Text>
              <TouchableOpacity style={{ padding: 4 }} onPress={() => setShowCalendar(false)}>
                <X color={textColor} size={28} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Flame color="#FF9500" size={48} />
                <Text style={{ color: textColor, fontSize: 24, fontWeight: 'bold', marginTop: 12 }}>
                  現在 {currentStreak || 0} 日連続！
                </Text>
              </View>

              <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor }}>
                <Calendar
                  theme={{
                    backgroundColor: cardBg,
                    calendarBackground: cardBg,
                    textSectionTitleColor: subTextColor,
                    selectedDayBackgroundColor: '#FF9500',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#00F2FE',
                    dayTextColor: textColor,
                    textDisabledColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    monthTextColor: textColor,
                    arrowColor: '#00F2FE',
                    textDayFontWeight: '500',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '500',
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14
                  }}
                  markedDates={Object.keys(listenedDays).reduce((acc: any, date) => {
                    if (listenedDays[date]) {
                      acc[date] = { selected: true, selectedColor: '#FF9500' };
                    }
                    return acc;
                  }, {})}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B4EFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  mainButtonTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mainButtonSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  quickCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  quickSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  guideStepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B4EFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideStepText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  guideDesc: {
    fontSize: 12,
    lineHeight: 18,
  }
});
