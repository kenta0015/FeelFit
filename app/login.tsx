import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // 🔐 ログイン処理
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      Alert.alert('Login failed', loginError.message);
      return;
    }

    console.log('✅ Login success');

    // 👤 ログインユーザー情報取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Error retrieving user', userError?.message || 'No user found');
      return;
    }

    console.log('👤 User ID:', user.id);

    // ✅ RLS対応：自分のidと一致する場合のみ insert許可がある前提
    const { error: upsertError } = await supabase.from('users').upsert(
      {
        id: user.id,
        email: user.email,
      },
      { onConflict: 'id' } // 明示的にid重複時にupdate（Supabaseはこれで安定）
    );

    if (upsertError) {
      console.error('❌ Failed to upsert user:', upsertError.message);
      Alert.alert('User insert failed', upsertError.message);
      return;
    }

    console.log('✅ User inserted or already exists in users table');

    // 🚀 ログイン後に画面遷移
    router.replace('/stamina');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        autoCapitalize="none"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
});
