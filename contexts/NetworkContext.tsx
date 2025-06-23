import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean | null;
  offlineMode: boolean;
  isOfflineSyncPending: () => Promise<boolean>;
  syncOfflineData: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  offlineMode: false,
  isOfflineSyncPending: async () => false,
  syncOfflineData: async () => true,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [offlineMode, setOfflineMode] = useState(false); // Example state

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsConnected(online);
      setOfflineMode(!online);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Placeholder functions for offline sync
  const isOfflineSyncPending = async (): Promise<boolean> => {
    // In a real app, you'd check AsyncStorage for pending data
    return false; 
  };

  const syncOfflineData = async (): Promise<boolean> => {
    // In a real app, you'd send pending data to the server
    console.log('Syncing offline data...');
    return true;
  };

  return (
    <NetworkContext.Provider value={{ isConnected, offlineMode, isOfflineSyncPending, syncOfflineData }}>
      {children}
    </NetworkContext.Provider>
  );
};
