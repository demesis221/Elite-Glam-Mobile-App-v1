import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Text, View, TouchableOpacity } from 'react-native';
import NotificationSystem from '../../components/NotificationSystem';

const HeaderLogo = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image
      source={require('@/assets/images/logo.png')}
      style={{ width: 36, height: 36, marginRight: 8, borderRadius: 18, backgroundColor: '#fff' }}
      resizeMode="contain"
    />
    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22 }}>
      Elite<Text style={{ color: '#FFD600' }}>G</Text>lam
    </Text>
  </View>
);

export default function RenterTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#7E57C2' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#7E57C2',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#fff',
          elevation: 20,
          zIndex: 100,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          borderTopWidth: 0.5,
          borderTopColor: '#eee',
        },
        tabBarItemStyle: {
          flex: 1,
          padding: 0,
          margin: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
          paddingBottom: 0,
          textAlign: 'center',
        },
        headerTitle: () => <HeaderLogo />,
        headerRight: () => (
          <View style={{ marginRight: 16 }}>
            <NotificationSystem />
          </View>
        ),
      }}
      tabBar={props => (
        <View style={{ flexDirection: 'row', height: 60, backgroundColor: '#fff', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, borderTopWidth: 0.5, borderTopColor: '#eee', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' }}>
          {props.state.routes.map((route, index) => {
            // Exclude screens not meant for tab bar
            if (["edit-profile", "choose-photo", "search", "notifications", "bookings", "booking-details/[id]", "booking-confirmation", "booking-form", "booking-status", "product-details/[id]"].includes(route.name)) {
              return null;
            }
            const { options } = props.descriptors[route.key];
            const label = options.title || route.name;
            const isFocused = props.state.index === index;
            const onPress = () => {
              const event = props.navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                props.navigation.navigate(route.name);
              }
            };
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}
              >
                {options.tabBarIcon && options.tabBarIcon({ focused: isFocused, color: isFocused ? '#7E57C2' : '#666', size: 24 })}
                <Text style={{ fontSize: 12, color: isFocused ? '#7E57C2' : '#666', marginTop: 4 }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rent-later"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-cart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      {/* Screens not in tab bar */}
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="booking-details/[id]" options={{ href: null }} />
      <Tabs.Screen name="booking-confirmation" options={{ href: null }} />
      <Tabs.Screen name="booking-form" options={{ href: null }} />
      <Tabs.Screen name="booking-status" options={{ href: null }} />
      <Tabs.Screen name="choose-photo" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="product-details/[id]" options={{ href: null }} />
    </Tabs>
  );
}
