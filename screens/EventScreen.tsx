import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PersonalizedEvent } from '../types';
import { getEventRecommendations, markEventAsRead } from '../services/eventService';
import { getCurrentUser } from '../services/authService';
import { Header } from '../components/Header';
import { EventTile } from '../components/EventTile';
import { EventDetailModal } from '../components/EventDetailModal';

const { width } = Dimensions.get('window');
const PADDING = 12;
const GAP = 12;
const TILE_WIDTH = (width - PADDING * 2 - GAP) / 2; // 2 columns with padding and gap

export const EventScreen: React.FC = () => {
  const [events, setEvents] = useState<PersonalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PersonalizedEvent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadEvents = async () => {
    const user = await getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const eventRecommendations = await getEventRecommendations(user.id, 20);
    setEvents(eventRecommendations);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleTilePress = async (event: PersonalizedEvent) => {
    const user = await getCurrentUser();
    if (user) {
      // Mark event as read when opened
      await markEventAsRead(user.id, event.id);
    }
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
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

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header />
        <FlatList
          data={[]}
          contentContainerStyle={styles.centerContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <>
              <Text style={styles.emptyTitle}>No new events</Text>
              <Text style={styles.emptyText}>
                Check back later for updates on what matters.
              </Text>
            </>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <FlatList
        data={events}
        renderItem={({ item, index }) => (
          <View style={[
            styles.tileContainer,
            index % 2 === 0 && styles.tileLeft,
            index % 2 === 1 && styles.tileRight,
          ]}>
            <EventTile event={item} onPress={() => handleTilePress(item)} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      <EventDetailModal
        event={selectedEvent}
        visible={modalVisible}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  gridContent: {
    padding: PADDING,
    paddingBottom: 48,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
  tileContainer: {
    width: TILE_WIDTH,
  },
  tileLeft: {
    marginRight: GAP / 2,
  },
  tileRight: {
    marginLeft: GAP / 2,
  },
});
