import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PersonalizedEvent } from '../types';
import { getActiveEvent, markEventAsRead } from '../services/eventService';
import { getCurrentUser } from '../services/authService';
import { Header } from '../components/Header';

export const EventScreen: React.FC = () => {
  const [event, setEvent] = useState<PersonalizedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvent = async () => {
    const user = await getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const activeEvent = await getActiveEvent(user.id);
    setEvent(activeEvent);
    setLoading(false);

    // Mark event as read when displayed (only if not already read)
    // This prevents duplicate entries but allows the event to persist on refresh
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
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
});
