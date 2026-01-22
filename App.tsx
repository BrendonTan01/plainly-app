import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet, Linking } from 'react-native';
import { supabase } from './config/supabase';
import { getCurrentUser, getUserProfile } from './services/authService';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { EventScreen } from './screens/EventScreen';
import { AdminScreen } from './screens/AdminScreen';
import { PreferencesScreen } from './screens/PreferencesScreen';
import { UserProfile } from './types';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Event: undefined;
  Admin: undefined;
  Preferences: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Helper function to add timeout to async operations
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ]);
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Safety timeout - ensure loading is always set to false after max 15 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout: Forcing loading to false');
      setLoading(false);
    }, 15000);

    // Check initial session
    checkSession().finally(() => {
      clearTimeout(safetyTimeout);
    });

    // Handle deep linking for magic link authentication
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      
      // Check if this is a Supabase auth callback
      if (url.includes('#access_token=') || url.includes('?access_token=')) {
        console.log('Handling auth callback from deep link:', url);
        // Supabase will automatically handle the session from the URL
        // when detectSessionInUrl is enabled
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then(handleDeepLink).catch(err => {
      console.error('Error getting initial URL:', err);
    });

    // Listen for deep links while app is running
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        try {
          if (session?.user) {
            setUser(session.user);
            try {
              const profile = await withTimeout(getUserProfile(session.user.id), 10000);
              setUserProfile(profile);
            } catch (error) {
              console.error('Error fetching user profile in auth state change:', error);
              // Continue without profile - user can still proceed
            }
          } else {
            setUser(null);
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      linkingSubscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      // Add timeout to prevent hanging
      const currentUser = await withTimeout(getCurrentUser(), 10000);
      if (currentUser) {
        setUser(currentUser);
        try {
          const profile = await withTimeout(getUserProfile(currentUser.id), 10000);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Continue without profile - user can still proceed
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // If there's a timeout or error, still allow the app to proceed
    } finally {
      // Always set loading to false, even if operations fail or timeout
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    try {
      const currentUser = await withTimeout(getCurrentUser(), 10000);
      if (currentUser) {
        setUser(currentUser);
        try {
          const profile = await withTimeout(getUserProfile(currentUser.id), 10000);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile in handleAuthSuccess:', error);
          // Continue without profile - user can still proceed
        }
      }
    } catch (error) {
      console.error('Error in handleAuthSuccess:', error);
    }
  };

  const handleOnboardingComplete = async (onboardingData: any) => {
    if (user) {
      const { updateUserProfile } = await import('./services/authService');
      const updatedProfile = await updateUserProfile(user.id, onboardingData);
      setUserProfile(updatedProfile);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        {!user ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuthSuccess={handleAuthSuccess} />}
          </Stack.Screen>
        ) : !userProfile?.onboardingCompleted ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen {...props} onComplete={handleOnboardingComplete} />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Event" component={EventScreen} />
            <Stack.Screen
              name="Preferences"
              component={PreferencesScreen}
              options={{
                headerShown: true,
                title: 'Preferences',
                headerStyle: { backgroundColor: '#fff' },
                headerTintColor: '#000',
              }}
            />
            {userProfile?.isAdmin && (
              <Stack.Screen
                name="Admin"
                component={AdminScreen}
                options={{
                  headerShown: true,
                  title: 'Admin',
                  headerStyle: { backgroundColor: '#fff' },
                  headerTintColor: '#000',
                }}
              />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
