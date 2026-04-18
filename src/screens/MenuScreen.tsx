import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Settings, Library, ChevronRight, Zap, Star } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';

const { width } = Dimensions.get('window');

export function MenuScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode, language } = useAppStore();

  const bgColor = isDarkMode ? '#0A0A1A' : '#F8F9FA';
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const cardBg = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDarkMode ? '#2C2C2E' : '#E5E5EA';

  const menuItems = [
    {
      title: getTranslation(language, 'menu', 'libraryTitle'),
      description: getTranslation(language, 'menu', 'libraryDesc'),
      icon: <Library color="#007AFF" size={32} />,
      route: 'Playlists',
      color: '#007AFF',
      bgColor: isDarkMode ? 'rgba(0, 122, 255, 0.1)' : '#E5F1FF',
      isPremium: false
    },
    {
      title: getTranslation(language, 'menu', 'settingsTitle'),
      description: getTranslation(language, 'menu', 'settingsDesc'),
      icon: <Settings color="#34C759" size={32} />,
      route: 'Settings',
      color: '#34C759',
      bgColor: isDarkMode ? 'rgba(52, 199, 89, 0.1)' : '#E8F5E9',
      isPremium: false
    },
    {
      title: getTranslation(language, 'menu', 'premiumTitle'),
      description: getTranslation(language, 'menu', 'premiumDesc'),
      icon: <Star color="#FFD700" size={32} />,
      route: 'Premium',
      color: '#FFD700',
      bgColor: isDarkMode ? 'rgba(255, 215, 0, 0.15)' : '#FFF9C4',
      isPremium: true
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: textColor, marginBottom: 8, marginTop: 24 }}>
          {getTranslation(language, 'menu', 'title')}
        </Text>
        <Text style={{ fontSize: 15, color: subTextColor, marginBottom: 32 }}>
          {getTranslation(language, 'menu', 'subtitle')}
        </Text>

        <View style={{ gap: 16 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(item.route)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: cardBg,
                padding: 20,
                borderRadius: 16,
                borderWidth: item.isPremium ? 2 : 1,
                borderColor: item.isPremium ? '#FFD700' : borderColor,
                shadowColor: item.isPremium ? '#FFD700' : '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: item.isPremium ? 0.4 : (isDarkMode ? 0.3 : 0.05),
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <View style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 16, 
                backgroundColor: item.bgColor, 
                justifyContent: 'center', 
                alignItems: 'center',
                marginRight: 16
              }}>
                {item.icon}
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: textColor, marginBottom: 4 }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 13, color: subTextColor, lineHeight: 18 }}>
                  {item.description}
                </Text>
              </View>
              
              <ChevronRight color={subTextColor} size={24} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
