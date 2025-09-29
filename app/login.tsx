// app/login.tsx
// Email/password login + sign-up using Supabase Auth.
// - Login: signInWithPassword → upsert users → /(tabs)/suggestion
// - Sign-up: signUp → if confirmation required → alert; if session present → upsert → /(tabs)/suggestion

import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const upsertUserAndGo = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Error retrieving user', userError?.message || 'No user found');
      return;
    }

    const { error: upsertError } = await supabase.from('users').upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id' }
    );

    if (upsertError) {
      Alert.alert('User insert failed', upsertError.message);
      return;
    }

    router.replace('/(tabs)/suggestion');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Login failed', error.message);
      return;
    }

    await upsertUserAndGo();
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Sign-up failed', error.message);
      return;
    }

    // If email confirmation is required, there's no session yet.
    if (!data.session) {
      Alert.alert('Check your email', 'We sent a confirmation link. Please verify your email to sign in.');
      return;
    }

    // Session is present → proceed
    await upsertUserAndGo();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.buttons}>
        <Button title="Login" onPress={handleLogin} />
      </View>
      <View style={styles.buttons}>
        <Button title="Create account" onPress={handleSignUp} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, marginBottom: 24, textAlign: 'center', fontWeight: '800' },
  input: {
    height: 48,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  buttons: { marginTop: 8 },
});
