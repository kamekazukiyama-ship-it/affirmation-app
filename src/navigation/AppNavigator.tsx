import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { GenerateScreen } from '../screens/GenerateScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { PlaylistScreen } from '../screens/PlaylistScreen';
import { SettingScreen } from '../screens/SettingScreen';
import { Home, Mic, Sparkles, Settings, Play, Circle } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const { isDarkMode } = useAppStore();
  const bgColor = isDarkMode ? '#0A0A1A' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const activeColor = isDarkMode ? '#00F2FE' : '#007AFF';

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: bgColor,
            borderTopWidth: 0,
            elevation: 0,
          },
          headerStyle: {
            backgroundColor: bgColor,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: textColor,
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{
            title: 'ホーム',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Player" 
          component={PlayerScreen} 
          options={{
            title: 'プレイヤー',
            tabBarIcon: ({ color, size }) => <Play color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Record" 
          component={RecordScreen} 
          options={{
            title: '録音',
            tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Generate" 
          component={GenerateScreen} 
          options={{
            title: 'AI生成',
            tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Menu" 
          component={MenuScreen} 
          options={{
            title: 'メニュー',
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Playlists" 
          component={PlaylistScreen} 
          options={{
            tabBarItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingScreen} 
          options={{
            tabBarItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
      </Tab.Navigator>
    </>
  );
}
