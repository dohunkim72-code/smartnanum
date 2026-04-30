import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Heart, History, User } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import DonationScreen from '../screens/DonationScreen';
import DonationHistoryScreen from '../screens/DonationHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../lib/theme';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          backgroundColor: '#fff',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') {
            return <LayoutDashboard size={size} color={color} />;
          } else if (route.name === 'Donation') {
            return <Heart size={size} color={color} />;
          } else if (route.name === 'DonationHistory') {
            return <History size={size} color={color} />;
          } else if (route.name === 'Profile') {
            return <User size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarLabel: '메인' }}
      />
      <Tab.Screen 
        name="Donation" 
        component={DonationScreen} 
        options={{ tabBarLabel: '기부하기' }}
      />
      <Tab.Screen 
        name="DonationHistory" 
        component={DonationHistoryScreen} 
        options={{ tabBarLabel: '내역' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: '프로필' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
