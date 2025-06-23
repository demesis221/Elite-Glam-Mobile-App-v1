import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getBestApiUrl } from '@/config/api.config';
import { useAuth } from '@/contexts/AuthContext';
import authService from '@/services/api';

interface UserData {
  username: string;
  email: string;
  profileImage?: string;
  profile?: {
    photoURL?: string;
    bio?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
}

export default function FreelancerEditProfileScreen() {
  const { checkAuth } = useAuth();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    profilePhoto: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  useEffect(() => {
    loadUserData();

    const unsub = NetInfo.addEventListener(state => setIsOffline(!state.isConnected));
    return unsub;
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserData(parsed);
        setFormData(prev => ({
          ...prev,
          username: parsed.username || '',
          email: parsed.email || '',
          bio: parsed.profile?.bio || '',
          profilePhoto: parsed.profileImage || parsed.profile?.photoURL || '',
          address: {
            street: parsed.profile?.address?.street || '',
            city: parsed.profile?.address?.city || '',
            state: parsed.profile?.address?.state || '',
            zipCode: parsed.profile?.address?.zipCode || '',
            country: parsed.profile?.address?.country || '',
          },
        }));
      }
    } catch (e) {
      console.error('loadUserData', e);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
      if (!res.canceled && res.assets[0]) {
        setFormData(prev => ({ ...prev, profilePhoto: res.assets[0].uri }));
      }
    } catch(e){
      console.error('pickImage', e);
      Alert.alert('Error','Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.email.trim()) {
      Alert.alert('Error','Username and Email required');
      return;
    }
    try {
      setIsSaving(true);
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        const updated = {
          ...userData,
          username: formData.username,
          email: formData.email,
          profileImage: formData.profilePhoto,
          profile: {
            ...userData?.profile,
            bio: formData.bio,
            photoURL: formData.profilePhoto,
            address: { ...formData.address },
          },
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updated));
        await checkAuth();
        Alert.alert('Saved offline','Will sync when online');
        router.back();
        return;
      }

      const payload = {
        username: formData.username,
        profileImage: formData.profilePhoto,
        profile: {
          bio: formData.bio,
          address: { ...formData.address }
        }
      };
      await authService.updateProfile(payload);
      const updatedStored = { ...userData, ...payload };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedStored));
      await checkAuth();
      Alert.alert('Success','Profile updated');
      router.back();
    } catch(e:any){
      console.error('save',e);
      Alert.alert('Error', e.message || 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <View style={styles.loading}><ActivityIndicator size="large" color="#7E57C2" /></View>;

  return (
    <ScrollView style={styles.container}>
      {isOffline && (
        <View style={styles.offline}><MaterialIcons name="wifi-off" size={20} color="#fff" /><Text style={styles.offlineText}>Offline</Text></View>) }
      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
          {formData.profilePhoto ? <Image source={{uri:formData.profilePhoto}} style={styles.photo}/> : <MaterialIcons name="person" size={40} color="#7E57C2" />}
          <View style={styles.editOverlay}><MaterialIcons name="camera-alt" size={24} color="#fff"/></View>
        </TouchableOpacity>
        <Text style={styles.photoText}>Tap to change photo</Text>
      </View>
      {/* Inputs ... reuse etc. */}
      <View style={styles.inputGroup}><Text style={styles.label}>Username</Text><TextInput style={styles.input} value={formData.username} onChangeText={t=>setFormData(p=>({...p,username:t}))}/></View>
      <View style={styles.inputGroup}><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={formData.email} onChangeText={t=>setFormData(p=>({...p,email:t}))} keyboardType="email-address" autoCapitalize="none"/></View>
      <View style={styles.inputGroup}><Text style={styles.label}>Bio</Text><TextInput style={[styles.input,styles.textArea]} multiline numberOfLines={4} value={formData.bio} onChangeText={t=>setFormData(p=>({...p,bio:t}))}/></View>
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}><Text style={styles.saveText}>{isSaving?'Saving...':'Save'}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#fff',padding:16},
  loading:{flex:1,justifyContent:'center',alignItems:'center'},
  offline:{flexDirection:'row',backgroundColor:'#d32f2f',padding:8,justifyContent:'center',alignItems:'center'},
  offlineText:{color:'#fff',marginLeft:8},
  photoSection:{alignItems:'center',marginTop:16},
  photoContainer:{width:100,height:100,borderRadius:50,overflow:'hidden',justifyContent:'center',alignItems:'center',backgroundColor:'#eee'},
  photo:{width:'100%',height:'100%'},
  editOverlay:{position:'absolute',bottom:0,right:0,backgroundColor:'rgba(0,0,0,0.6)',padding:4,borderTopLeftRadius:8},
  photoText:{marginTop:8,color:'#7E57C2'},
  inputGroup:{marginTop:12},
  label:{marginBottom:4,color:'#333'},
  input:{borderWidth:1,borderColor:'#ccc',borderRadius:6,padding:8},
  textArea:{height:100,textAlignVertical:'top'},
  saveBtn:{backgroundColor:'#7E57C2',padding:12,borderRadius:6,alignItems:'center',marginTop:20},
  saveText:{color:'#fff',fontWeight:'bold'},
});
