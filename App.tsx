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
import { UserProfile } from './types';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Event: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Check initial session
    checkSession();

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
    Linking.getInitialURL().then(handleDeepLink);

    // Listen for deep links while app is running
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (session?.user) {
          setUser(session.user);
          const profile = await getUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      linkingSubscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const profile = await getUserProfile(currentUser.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const profile = await getUserProfile(currentUser.id);
      setUserProfile(profile);
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
              name="Admin"
              component={AdminScreen}
              options={{
                headerShown: true,
                title: 'Admin',
                headerStyle: { backgroundColor: '#fff' },
                headerTintColor: '#000',
              }}
            />
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
