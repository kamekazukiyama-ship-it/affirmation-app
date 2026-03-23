import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { GenerateScreen } from '../screens/GenerateScreen';
import { PlaylistScreen } from '../screens/PlaylistScreen';
import { SettingScreen } from '../screens/SettingScreen';
import { Home, Mic, Sparkles, Settings, Library } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const { isDarkMode } = useAppStore();
  const bgColor = isDarkMode ? '#0A0A1A' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const activeColor = isDarkMode ? '#00F2FE' : '#007AFF';

  return (
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
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Playlists" 
        component={PlaylistScreen} 
        options={{
          title: 'ライブラリ',
          tabBarIcon: ({ color, size }) => <Library color={color} size={size} />
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
        name="Settings" 
        component={SettingScreen} 
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}
