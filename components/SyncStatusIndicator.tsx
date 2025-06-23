import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';

const SyncStatusIndicator = () => {
  const { isConnected, offlineMode, syncOfflineData, isOfflineSyncPending } = useNetwork();
  const [isPending, setIsPending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Check for pending syncs
    const checkPending = async () => {
      const pending = await isOfflineSyncPending();
      setIsPending(pending);
    };

    checkPending();
  }, [isOfflineSyncPending, offlineMode]);

  const handleSync = async () => {
    if (!isPending || isSyncing) return;

    try {
      setIsSyncing(true);
      const success = await syncOfflineData();
      setIsSyncing(false);
      
      if (success) {
        setIsPending(false);
      }
    } catch (error) {
      console.error("Sync error:", error);
      setIsSyncing(false);
      Alert.alert("Sync Error", "Failed to sync your account with the server.");
    }
  };

  if (!offlineMode && !isPending) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        {offlineMode ? (
          <MaterialIcons name="cloud-off" size={16} color="#fff" />
        ) : (
          <MaterialIcons name="sync" size={16} color="#fff" />
        )}
        <Text style={styles.text}>
          {offlineMode ? 'Offline Mode' : 'Sync Pending'}
        </Text>
        {isPending && (
          <TouchableOpacity 
            style={styles.syncButton} 
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Text style={styles.buttonText}>Syncing...</Text>
            ) : (
              <>
                <MaterialIcons name="sync" size={14} color="#fff" />
                <Text style={styles.buttonText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#7E57C2',
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    paddingTop: 36, // Account for status bar
  },
  text: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default SyncStatusIndicator; 