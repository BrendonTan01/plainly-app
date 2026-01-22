import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { createEvent } from '../services/eventService';
import { EventCategory } from '../types';

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'politics', label: 'Politics' },
  { value: 'economy', label: 'Economy' },
  { value: 'technology', label: 'Technology' },
  { value: 'health', label: 'Health' },
  { value: 'environment', label: 'Environment' },
  { value: 'international', label: 'International' },
  { value: 'social', label: 'Social' },
];

export const AdminScreen: React.FC = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<EventCategory>('politics');
  const [whatHappened, setWhatHappened] = useState('');
  const [whyPeopleCare, setWhyPeopleCare] = useState('');
  const [whatThisMeans, setWhatThisMeans] = useState('');
  const [whatLikelyDoesNotChange, setWhatLikelyDoesNotChange] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!title || !whatHappened || !whyPeopleCare || !whatThisMeans) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays || '7', 10));

    const event = await createEvent({
      title,
      date,
      category,
      whatHappened,
      whyPeopleCare,
      whatThisMeans,
      whatLikelyDoesNotChange: whatLikelyDoesNotChange || undefined,
      expiresAt: expiresAt.toISOString(),
    });

    if (event) {
      setMessage('Event created successfully!');
      // Reset form
      setTitle('');
      setWhatHappened('');
      setWhyPeopleCare('');
      setWhatThisMeans('');
      setWhatLikelyDoesNotChange('');
      // Navigate back to event screen after a short delay
      setTimeout(() => {
        navigation.navigate('Event' as never);
      }, 1500);
    } else {
      setMessage('Failed to create event. Please try again.');
    }

    setLoading(false);
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
            <Text style={styles.title}>Create Event</Text>

            <TextInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
            />

            <TextInput
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.categoryContainer}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryOptions}>
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    title={cat.label}
                    onPress={() => setCategory(cat.value)}
                    variant={category === cat.value ? 'primary' : 'secondary'}
                  />
                ))}
              </View>
            </View>

            <TextInput
              label="What happened *"
              value={whatHappened}
              onChangeText={setWhatHappened}
              placeholder="Factual summary"
              multiline
              numberOfLines={4}
            />

            <TextInput
              label="Why people care *"
              value={whyPeopleCare}
              onChangeText={setWhyPeopleCare}
              placeholder="Context"
              multiline
              numberOfLines={4}
            />

            <TextInput
              label="What this means (base text) *"
              value={whatThisMeans}
              onChangeText={setWhatThisMeans}
              placeholder="Will be personalized for users"
              multiline
              numberOfLines={4}
            />

            <TextInput
              label="What likely does not change (optional)"
              value={whatLikelyDoesNotChange}
              onChangeText={setWhatLikelyDoesNotChange}
              placeholder="Optional fourth section"
              multiline
              numberOfLines={4}
            />

            <TextInput
              label="Expires in (days)"
              value={expiresInDays}
              onChangeText={setExpiresInDays}
              placeholder="7"
              keyboardType="numeric"
            />

            {message ? (
              <Text style={styles.message}>{message}</Text>
            ) : null}

            <Button
              title="Create Event"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
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
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000',
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
});
