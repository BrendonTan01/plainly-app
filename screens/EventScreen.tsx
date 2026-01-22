import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PersonalizedEvent } from '../types';
import { getActiveEvent, markEventAsRead } from '../services/eventService';
import { getCurrentUser, getUserProfile, signOut } from '../services/authService';
import { Header } from '../components/Header';
import { Button } from '../components/Button';

export const EventScreen: React.FC = () => {
  const navigation = useNavigation();
  const [event, setEvent] = useState<PersonalizedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  const loadEvent = async () => {
    const user = await getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setUserEmail(user.email || '');
    const profile = await getUserProfile(user.id);
    setIsAdmin(profile?.isAdmin || false);

    const activeEvent = await getActiveEvent(user.id);
    setEvent(activeEvent);
    setLoading(false);

    // Mark event as read when displayed
    if (activeEvent) {
      await markEventAsRead(user.id, activeEvent.id);
    }
  };

  useEffect(() => {
    loadEvent();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvent();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // Navigation will handle redirecting to auth screen via auth state change
          },
        },
      ]
    );
  };

  const handleViewProfile = () => {
    Alert.alert(
      'Account Information',
      `Email: ${userEmail}\n${isAdmin ? 'Role: Administrator' : 'Role: User'}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Refresh" onPress={handleRefresh} variant="secondary" />
          <Button title="Sign Out" onPress={handleLogout} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header />
        <ScrollView
          contentContainerStyle={styles.centerContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Text style={styles.emptyTitle}>No new events</Text>
          <Text style={styles.emptyText}>
            Check back later for updates on what matters.
          </Text>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button title="Refresh" onPress={handleRefresh} variant="secondary" />
          <Button title="Account" onPress={handleViewProfile} variant="secondary" />
          {isAdmin && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Admin' as never)}
              style={styles.adminButton}
            >
              <Text style={styles.adminButtonText}>Admin</Text>
            </TouchableOpacity>
          )}
          <Button title="Sign Out" onPress={handleLogout} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.category}>{event.category}</Text>
          <Text style={styles.date}>{new Date(event.date).toLocaleDateString()}</Text>
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What happened</Text>
          <Text style={styles.sectionContent}>{event.whatHappened}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why people care</Text>
          <Text style={styles.sectionContent}>{event.whyPeopleCare}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What this might mean for you</Text>
          <Text style={styles.sectionContent}>
            {event.personalizedWhatThisMeans}
          </Text>
        </View>

        {event.whatLikelyDoesNotChange && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What likely does not change</Text>
            <Text style={styles.sectionContent}>
              {event.whatLikelyDoesNotChange}
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button title="Refresh" onPress={handleRefresh} variant="secondary" />
        <Button title="Account" onPress={handleViewProfile} variant="secondary" />
        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Admin' as never)}
            style={styles.adminButton}
          >
            <Text style={styles.adminButtonText}>Admin</Text>
          </TouchableOpacity>
        )}
        <Button title="Sign Out" onPress={handleLogout} variant="primary" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000',
    marginBottom: 32,
    lineHeight: 40,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  adminButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});
