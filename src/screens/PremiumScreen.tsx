import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, TextInput, Linking, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { Sparkles, X, Zap, ChevronRight } from 'lucide-react-native';
import { getTranslation } from '../i18n/translations';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import Purchases from 'react-native-purchases';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function PremiumScreen({ navigation }: any) {
  const { 
    isDarkMode, 
    elevenLabsApiKey, 
    setElevenLabsApiKey, 
    pointBalance, 
    membershipType, 
    bgImageUrl,
    language
  } = useAppStore();

  const [user, setUser] = useState<User | null>(null);
   const [isPurchasing, setIsPurchasing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handlePurchase = async (pkgId: string) => {
    // Apple 5.1.1(v) に対応するため、ログイン(登録)チェックを削除
    // 匿名ユーザーの状態でも購入を許可する

    try {
      setIsPurchasing(true);

      if (pkgId === 'subscription_monthly') {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.monthly !== null) {
          const { customerInfo } = await Purchases.purchasePackage(offerings.current.monthly);
          
          if (customerInfo.entitlements.active['premium'] !== undefined) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              membership: 'premium',
              points: increment(3000)
            });
            Alert.alert(
              getTranslation(language, 'common', 'thankYou') || 'Thank You!',
              getTranslation(language, 'premium', 'subSuccess')
            );
          }
        } else {
          throw new Error(getTranslation(language, 'premium', 'productNotFound'));
        }
      } else {
        const products = await Purchases.getProducts([pkgId]);
        if (products.length > 0) {
          await Purchases.purchaseStoreProduct(products[0]);
          
          let addedPoints = 0;
          if (pkgId === 'points_200') addedPoints = 200;
          else if (pkgId === 'points_1200') addedPoints = 1200;
          else if (pkgId === 'points_3000') addedPoints = 3000;

          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            points: increment(addedPoints)
          });
          Alert.alert(
            getTranslation(language, 'common', 'success') || 'Success',
            getTranslation(language, 'premium', 'pointsAdded').replace('{0}', addedPoints.toString())
          );
        } else {
          throw new Error(getTranslation(language, 'premium', 'packNotFound'));
        }
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert(
          getTranslation(language, 'common', 'error') || 'Error',
          (getTranslation(language, 'premium', 'purchaseFailed') || 'Purchase failed.') + '\n' + e.message
        );
      }
    } finally {
      setIsPurchasing(false);
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>{getTranslation(language, 'premium', 'title')}</Text>
            <Text style={[styles.subtitle, { color: subTextColor }]}>{getTranslation(language, 'premium', 'subtitle')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')} style={[styles.closeButton, { backgroundColor: cardBg, borderColor }]}>
            <X color={textColor} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* プレミアム・ポイントセクション */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: activeColor }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: activeColor }]}>{getTranslation(language, 'premium', 'sectionTitle')}</Text>
              <View style={[styles.badge, { backgroundColor: membershipType === 'premium' ? '#34C759' : subTextColor }]}>
                <Text style={styles.badgeText}>{membershipType === 'premium' ? 'PREMIUM' : 'FREE USER'}</Text>
              </View>
            </View>

            <View style={styles.balanceRow}>
              <View style={[styles.balanceCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Text style={[styles.balanceLabel, { color: subTextColor }]}>{getTranslation(language, 'premium', 'balanceLabel')}</Text>
                <Text style={[styles.balanceValue, { color: textColor }]}>{pointBalance} <Text style={styles.ptUnit}>pt</Text></Text>
              </View>
              <View style={styles.balanceInfo}>
                <Text style={[styles.infoText, { color: subTextColor }]}>
                  {getTranslation(language, 'premium', 'infoText')}
                </Text>
              </View>
            </View>

            <View style={styles.purchaseContainer}>
              {membershipType !== 'premium' && (
                <TouchableOpacity 
                   style={[styles.mainPurchaseBtn, { backgroundColor: activeColor }]}
                   onPress={() => handlePurchase('subscription_monthly')}
                 >
                   <View style={{ flex: 1 }}>
                     <Text style={styles.purchaseTitle}>{getTranslation(language, 'premium', 'subBtn')}</Text>
                     <Text style={styles.purchaseDesc}>{getTranslation(language, 'premium', 'subDesc')}</Text>
                   </View>
                  <ChevronRight color="#FFF" size={20} />
                </TouchableOpacity>
              )}

              <View style={styles.pointsGrid}>
                 <TouchableOpacity 
                   style={[styles.pointPackBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}
                   onPress={() => handlePurchase('points_200')}
                 >
                   <Text style={[styles.pointPackTitle, { color: textColor }]}>{getTranslation(language, 'premium', 'pointPack').replace('{0}', '200').replace('{1}', language === 'ja' ? '100' : '0.7')}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.pointPackBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}
                   onPress={() => handlePurchase('points_1200')}
                 >
                   <Text style={[styles.pointPackTitle, { color: textColor }]}>{getTranslation(language, 'premium', 'pointPack').replace('{0}', '1200').replace('{1}', language === 'ja' ? '500' : '3.5')}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.pointPackBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}
                   onPress={() => handlePurchase('points_3000')}
                 >
                   <Text style={[styles.pointPackTitle, { color: textColor }]}>{getTranslation(language, 'premium', 'pointPack').replace('{0}', '3000').replace('{1}', language === 'ja' ? '1000' : '7.0')}</Text>
                 </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* AI音声合成設定セクション */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>{getTranslation(language, 'premium', 'aiTitle')}</Text>
            </View>
            <Text style={[styles.introText, { color: subTextColor }]}>
              {getTranslation(language, 'premium', 'aiIntro')}
            </Text>

            {/* 💡 お得情報ボックス */}
             <View style={[styles.benefitBox, { backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : '#FFF9E6', borderColor: '#FFD700' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Sparkles color="#FFD700" size={18} />
                  <Text style={[styles.benefitTitle, { color: isDarkMode ? '#FFD700' : '#B8860B' }]}>{getTranslation(language, 'premium', 'benefitTitle')}</Text>
                </View>
                <View style={styles.benefitList}>
                  <Text style={[styles.benefitItem, { color: textColor }]}>{getTranslation(language, 'premium', 'benefit1')}</Text>
                  <Text style={[styles.benefitItem, { color: textColor }]}>{getTranslation(language, 'premium', 'benefit2')}</Text>
                  <Text style={[styles.benefitItem, { color: textColor }]}>{getTranslation(language, 'premium', 'benefit3')}</Text>
                </View>
                <Text style={[styles.benefitFooter, { color: subTextColor }]}>{getTranslation(language, 'premium', 'benefitFooter')}</Text>
             </View>
            
            <TextInput
              style={[
                styles.apiKeyInput,
                { 
                  backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : '#FFFFFF', 
                  color: textColor, 
                 borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                }
              ]}
              placeholder={getTranslation(language, 'premium', 'inputPlaceholder')}
              placeholderTextColor={subTextColor}
              value={elevenLabsApiKey || ''}
              onChangeText={setElevenLabsApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.inputHint, { color: subTextColor }]}>
              {getTranslation(language, 'premium', 'inputHint')}
            </Text>

            {elevenLabsApiKey ? (
              <View style={styles.statusRow}>
                <Text style={styles.statusOk}>{getTranslation(language, 'premium', 'statusOk')}</Text>
              </View>
            ) : (
              <View>
                <TouchableOpacity 
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setShowTutorial(!showTutorial);
                  }}
                  style={{ marginTop: 4 }}
                >
                  <Text style={[styles.linkText, { color: activeColor }]}>
                    {showTutorial ? getTranslation(language, 'premium', 'tutorialClose') : getTranslation(language, 'premium', 'tutorialCheck')}
                  </Text>
                </TouchableOpacity>

                 {showTutorial && (
                   <View style={[styles.tutorialContent, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,122,255,0.03)', borderColor }]}>
                     <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 13, marginBottom: 16 }}>{getTranslation(language, 'premium', 'tutorialStepTitle')}</Text>
                     
                     <View style={styles.stepContainer}>
                       <Text style={[styles.stepTitle, { color: textColor }]}>{getTranslation(language, 'premium', 'step1Title')}</Text>
                       <Text style={[styles.stepDesc, { color: subTextColor }]}>
                         {getTranslation(language, 'premium', 'step1Desc').replace('elevenlabs.io', '')}
                         <Text 
                           style={{ color: activeColor, textDecorationLine: 'underline' }} 
                           onPress={() => Linking.openURL('https://elevenlabs.io/')}
                         >
                           elevenlabs.io
                         </Text>
                         {language === 'ja' ? 'にアクセスし、アカウントを作成後、利用したいプラン（無料プランもあります）に登録します。' : ' and register for a plan.'}
                       </Text>
                     </View>
 
                     <View style={styles.stepContainer}>
                       <Text style={[styles.stepTitle, { color: textColor }]}>{getTranslation(language, 'premium', 'step2Title')}</Text>
                       <Text style={[styles.stepDesc, { color: subTextColor }]}>
                         {getTranslation(language, 'premium', 'step2Desc')}
                       </Text>
                       <Text style={[styles.stepWarning, { color: '#FF3B30' }]}>{getTranslation(language, 'premium', 'step2Warn')}</Text>
                       <View style={[styles.stepAlert, { backgroundColor: isDarkMode ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.05)' }]}>
                         <Text style={{ color: subTextColor, fontSize: 11, fontStyle: 'italic' }}>{getTranslation(language, 'premium', 'step2Safety')}</Text>
                       </View>
                     </View>
 
                     <View style={[styles.stepContainer, { borderBottomWidth: 0 }]}>
                       <Text style={[styles.stepTitle, { color: textColor }]}>{getTranslation(language, 'premium', 'step3Title')}</Text>
                       <Text style={[styles.stepDesc, { color: subTextColor }]}>
                         {getTranslation(language, 'premium', 'step3Desc')}
                       </Text>
                       <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: 'bold', marginTop: 8 }}>{getTranslation(language, 'premium', 'step3Note')}</Text>
                     </View>
                   </View>
                 )}
              </View>
            )}
          </View>

          {/* 規約・ポリシーリンク (Apple審査用) */}
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => {
              // Apple公式の標準規約 (EULA) URL
              const eulaUrl = 'https://www.apple.com/legal/internet-services/itunes/appstore/dev/stdeula/';
              Linking.openURL(eulaUrl);
            }}>
              <Text style={[styles.footerLinkText, { color: activeColor }]}>
                {getTranslation(language, 'premium', 'termsOfUse')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.footerDivider, { color: subTextColor }]}>|</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://kamekazukiyama-ship-it.github.io/affirmation-app/support.html')}>
              <Text style={[styles.footerLinkText, { color: activeColor }]}>
                {getTranslation(language, 'premium', 'privacyPolicy')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isPurchasing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>{getTranslation(language, 'premium', 'loadingPurchase')}</Text>
          </View>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    padding: 20, 
    paddingBottom: 10 
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },
  closeButton: { padding: 8, borderRadius: 20, borderWidth: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  balanceCard: { flex: 1, padding: 16, borderRadius: 12, marginRight: 8 },
  balanceLabel: { fontSize: 11, marginBottom: 4 },
  balanceValue: { fontSize: 24, fontWeight: 'bold' },
  ptUnit: { fontSize: 13, fontWeight: 'normal' },
  balanceInfo: { flex: 1.2 },
  infoText: { fontSize: 11, lineHeight: 16 },
  purchaseContainer: { gap: 10 },
  mainPurchaseBtn: { 
    borderRadius: 12, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  purchaseTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  purchaseDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  pointsGrid: { flexDirection: 'row', gap: 8 },
  pointPackBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  pointPackTitle: { fontSize: 13, textAlign: 'center', fontWeight: 'bold' },
  introText: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  apiKeyInput: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  inputHint: { fontSize: 11, marginBottom: 12, lineHeight: 16 },
  statusRow: { marginTop: 4 },
  statusOk: { color: '#34C759', fontSize: 13, fontWeight: 'bold' },
  linkText: { fontSize: 13, fontWeight: 'bold' },
  benefitBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  benefitList: {
    gap: 4,
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  benefitFooter: {
    fontSize: 10,
    fontStyle: 'italic',
  },
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
  },
  tutorialContent: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  stepWarning: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  stepAlert: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 20,
    gap: 10,
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footerDivider: {
    fontSize: 12,
  }
});
