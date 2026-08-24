import { View, Text, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import api from '../../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    console.log('URL utilisée :', api.defaults.baseURL);
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="ton@email.com"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
      />

      <Pressable onPress={handleLogin}>
        <Text>Se connecter</Text>
      </Pressable>
    </View>
  );
}
