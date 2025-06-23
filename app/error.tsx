import { View, Text } from 'react-native';

export default function ErrorScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 20, color: '#d32f2f', fontWeight: 'bold' }}>Something went wrong.</Text>
      <Text style={{ marginTop: 10, color: '#888' }}>Please try again or contact support.</Text>
    </View>
  );
}
