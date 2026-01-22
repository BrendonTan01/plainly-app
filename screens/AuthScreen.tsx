import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { signInWithMagicLink, signInWithPassword, signUpWithPassword } from '../services/authService';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'magic-link' | 'password';
type PasswordMode = 'sign-in' | 'sign-up';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [passwordMode, setPasswordMode] = useState<PasswordMode>('sign-in');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMagicLinkSignIn = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await signInWithMagicLink(email.trim());

    if (error) {
      console.error('Sign in error:', error);
      if (error.message) {
        setMessage(error.message);
      } else {
        setMessage('Something went wrong. Please try again.');
      }
      setLoading(false);
    } else {
      setMessage('Check your email for the magic link to sign in.');
      setLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    if (!password.trim()) {
      setMessage('Please enter your password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage('Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    if (passwordMode === 'sign-up') {
      const { error } = await signUpWithPassword(email.trim(), password);
      if (error) {
        console.error('Sign up error:', error);
        setMessage(error.message || 'Failed to create account. Please try again.');
        setLoading(false);
      } else {
        setMessage('Account created! You can now sign in.');
        setPasswordMode('sign-in');
        setLoading(false);
      }
    } else {
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) {
        console.error('Sign in error:', error);
        setMessage(error.message || 'Failed to sign in. Please check your credentials.');
        setLoading(false);
      } else {
        // Success - auth state change will be handled by App.tsx
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Plainly</Text>
            <Text style={styles.subtitle}>
              Understand what matters, without the noise.
            </Text>

            {/* Auth Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, authMode === 'password' && styles.modeButtonActive]}
                onPress={() => {
                  setAuthMode('password');
                  setMessage('');
                }}
              >
                <Text style={[styles.modeButtonText, authMode === 'password' && styles.modeButtonTextActive]}>
                  Email & Password
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, authMode === 'magic-link' && styles.modeButtonActive]}
                onPress={() => {
                  setAuthMode('magic-link');
                  setMessage('');
                }}
              >
                <Text style={[styles.modeButtonText, authMode === 'magic-link' && styles.modeButtonTextActive]}>
                  Magic Link
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {authMode === 'password' && (
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}

              {message ? (
                <Text style={[styles.message, message.includes('created') || message.includes('Check your email') ? styles.messageSuccess : styles.messageError]}>
                  {message}
                </Text>
              ) : null}

              {authMode === 'password' ? (
                <>
                  <Button
                    title={passwordMode === 'sign-in' ? 'Sign In' : 'Sign Up'}
                    onPress={handlePasswordAuth}
                    loading={loading}
                    disabled={loading}
                  />
                  <TouchableOpacity
                    style={styles.switchModeButton}
                    onPress={() => {
                      setPasswordMode(passwordMode === 'sign-in' ? 'sign-up' : 'sign-in');
                      setMessage('');
                    }}
                  >
                    <Text style={styles.switchModeText}>
                      {passwordMode === 'sign-in'
                        ? "Don't have an account? Sign up"
                        : 'Already have an account? Sign in'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Button
                  title="Continue with Email"
                  onPress={handleMagicLinkSignIn}
                  loading={loading}
                  disabled={loading}
                />
              )}
            </View>

            <Text style={styles.footer}>
              {authMode === 'magic-link'
                ? "We'll send you a secure link to sign in. No password needed."
                : 'Sign in with your email and password.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '300',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 26,
  },
  form: {
    width: '100%',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    fontSize: 14,
    color: '#999',
    marginTop: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#000',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  switchModeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
  messageSuccess: {
    color: '#4CAF50',
  },
  messageError: {
    color: '#F44336',
  },
});
