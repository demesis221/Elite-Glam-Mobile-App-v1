import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { api } from '@/services/api';

export default function ApiTestScreen() {
  const [endpoint, setEndpoint] = useState('/bookings');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      // We use the api.get method which will use the configured base URL and token
      const result = await api.get(endpoint);
      setResponse(result.data);
    } catch (e: any) {
      setError(`Status: ${e.message} - ${JSON.stringify(e)}`);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>API Endpoint Tester</Text>
        <Text style={styles.description}>
          Enter an API endpoint path to test (e.g., /users/me, /bookings, /api/bookings). The base URL and authentication token will be automatically included.
        </Text>
        <TextInput
          style={styles.input}
          value={endpoint}
          onChangeText={setEndpoint}
          placeholder="Enter endpoint (e.g., /cart)"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button title="Send GET Request" onPress={handleSendRequest} disabled={loading} />

        {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

        {response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>Success Response:</Text>
            <Text style={styles.responseText}>{JSON.stringify(response, null, 2)}</Text>
          </View>
        )}

        {error && (
          <View style={styles.responseContainer}>
            <Text style={[styles.responseTitle, styles.errorTitle]}>Error Response:</Text>
            <Text style={styles.responseText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  loader: {
    marginTop: 20,
  },
  responseContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'green',
  },
  errorTitle: {
    color: 'red',
  },
  responseText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
});
