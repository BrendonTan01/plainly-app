import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PersonalizedEvent } from '../types';
import { getDaysTillExpiry } from '../utils/dateUtils';

interface EventTileProps {
  event: PersonalizedEvent;
  onPress: () => void;
}

export const EventTile: React.FC<EventTileProps> = ({ event, onPress }) => {
  const daysTillExpiry = getDaysTillExpiry(event.expiresAt);
  const categoryLabel = event.category.charAt(0).toUpperCase() + event.category.slice(1);

  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.category}>{categoryLabel}</Text>
        <Text style={styles.daysText}>
          {daysTillExpiry === 0 
            ? 'Expired' 
            : daysTillExpiry === 1 
            ? '1 day left' 
            : `${daysTillExpiry} days left`}
        </Text>
      </View>
      <Text style={styles.title} numberOfLines={3}>
        {event.title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  daysText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
    textAlign: 'right',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    lineHeight: 22,
    flex: 1,
  },
});
