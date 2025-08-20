import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { User, Settings, Volume2, TrendingUp } from 'lucide-react-native';
import { getUser, saveUser, createUser } from '@/utils/storage';
import { User as UserType } from '@/types';

export default function ProfileScreen() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [newName, setNewName] = useState(''); // for first-time setup

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await getUser();
    setUser(userData);
    if (userData) {
      setEditedName(userData.name);
    }
  };

  const handleCreateUser = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }
    try {
      const created = await createUser(name);
      setUser(created);
      setEditedName(created.name);
      Alert.alert('Welcome!', 'Your profile has been created.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to create profile.');
    }
  };

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;

    const updatedUser = { ...user, name: editedName.trim() };
    await saveUser(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);
  };

  const handleVoiceChange = async (voice: 'male' | 'female') => {
    if (!user) return;

    const updatedUser = { ...user, audioVoicePreference: voice };
    await saveUser(updatedUser);
    setUser(updatedUser);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your workout history and reset your Mental/Physical Stamina to 0. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            if (user) {
              const resetUser = {
                ...user,
                mentalStamina: 0,
                physicalStamina: 0,
              };
              await saveUser(resetUser);
              setUser(resetUser);
              Alert.alert('Success', 'Your data has been reset.');
            }
          }
        }
      ]
    );
  };

  // ---------- First-time setup (no user) ----------
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.firstRunCard}>
          <View style={styles.avatarContainer}>
            <User size={48} color="#6366f1" />
          </View>
          <Text style={styles.firstRunTitle}>Let’s set up your profile</Text>
          <Text style={styles.firstRunSubtitle}>Enter your name to get started</Text>

          <TextInput
            style={styles.nameInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Your name"
            autoCapitalize="words"
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleCreateUser}>
            <Text style={styles.saveButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Normal profile ----------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <User size={48} color="#6366f1" />
          </View>
          
          <View style={styles.profileInfo}>
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter your name"
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => {
                      setIsEditing(false);
                      setEditedName(user.name);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.editHint}>Tap to edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.staminaPreview}>
            <Text style={styles.staminaText}>
              {user.mentalStamina + user.physicalStamina} Total
            </Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Volume2 size={18} color="#6b7280" />
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Audio Voice</Text>
              <Text style={styles.settingDesc}>Choose the voice used for guidance</Text>
            </View>
            <View style={styles.voiceButtons}>
              <TouchableOpacity 
                style={[styles.voiceButton, user.audioVoicePreference === 'female' && styles.voiceButtonSelected]}
                onPress={() => handleVoiceChange('female')}
              >
                <Text style={[styles.voiceText, user.audioVoicePreference === 'female' && styles.selectedVoiceText]}>Female</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.voiceButton, user.audioVoicePreference === 'male' && styles.voiceButtonSelected]}
                onPress={() => handleVoiceChange('male')}
              >
                <Text style={[styles.voiceText, user.audioVoicePreference === 'male' && styles.selectedVoiceText]}>Male</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <TrendingUp size={18} color="#6b7280" />
            </View>
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Progress & Stamina</Text>
              <Text style={styles.settingDesc}>Your total stamina increases with completed workouts</Text>
            </View>
          </View>
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetData}>
            <Text style={styles.resetButtonText}>Reset all data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  editHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  editContainer: {
    gap: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  staminaPreview: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  staminaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingBody: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  settingDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  voiceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  voiceButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  voiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  selectedVoiceText: {
    color: '#6366f1',
  },
  dangerSection: {
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  // first-time setup styles
  firstRunCard: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
    alignItems: 'stretch',
  },
  firstRunTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'left',
  },
  firstRunSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});

