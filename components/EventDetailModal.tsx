import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { PersonalizedEvent } from '../types';
import { getDaysTillExpiry } from '../utils/dateUtils';

interface EventDetailModalProps {
  event: PersonalizedEvent | null;
  visible: boolean;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  visible,
  onClose,
}) => {
  if (!event) return null;

  const daysTillExpiry = getDaysTillExpiry(event.expiresAt);
  const categoryLabel = event.category.charAt(0).toUpperCase() + event.category.slice(1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.eventHeader}>
            <Text style={styles.category}>{categoryLabel}</Text>
            <View style={styles.metaInfo}>
              <Text style={styles.date}>
                {new Date(event.date).toLocaleDateString()}
              </Text>
              <Text style={styles.daysText}>
                {daysTillExpiry === 0
                  ? 'Expired'
                  : daysTillExpiry === 1
                  ? '1 day left'
                  : `${daysTillExpiry} days left`}
              </Text>
            </View>
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  eventHeader: {
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
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  daysText: {
    fontSize: 14,
    fontWeight: '500',
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
