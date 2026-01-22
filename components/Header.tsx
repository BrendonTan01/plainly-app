import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from '../services/authService';

export const Header: React.FC = () => {
  const navigation = useNavigation();

  const handleSignOut = async () => {
    await signOut();
    // Navigation will handle redirecting to auth screen via auth state change
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plainly</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Admin' as never)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Admin</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut} style={styles.button}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
  },
});
