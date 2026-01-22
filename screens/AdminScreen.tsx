import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { createEvent } from '../services/eventService';
import { getCurrentUser, getUserProfile } from '../services/authService';
import { extractFromUrl, formatAsEvent } from '../services/aiExtractionService';
import { createDraft, updateDraft } from '../services/draftService';
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

type EntryMode = 'manual' | 'url';

export const AdminScreen: React.FC = () => {
  const navigation = useNavigation();
  const [entryMode, setEntryMode] = useState<EntryMode>('manual');
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
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
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        const adminStatus = profile?.isAdmin || false;
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          // Redirect to Event screen if not admin
          navigation.navigate('Event' as never);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [navigation]);

  const handleExtractFromUrl = async () => {
    if (!url || !url.trim()) {
      setMessage('Please enter a valid URL');
      setMessageType('error');
      return;
    }

    setExtracting(true);
    setMessage('');
    setMessageType('info');

    try {
      const extracted = await extractFromUrl(url.trim());
      
      // Populate form fields with extracted data
      setTitle(extracted.title);
      setDate(extracted.date);
      setCategory(extracted.category);
      setWhatHappened(extracted.what_happened);
      setWhyPeopleCare(extracted.why_people_care);
      setWhatThisMeans(extracted.what_this_means);
      setWhatLikelyDoesNotChange(extracted.what_likely_does_not_change || '');

      // Save as draft
      const draft = await createDraft(url.trim(), extracted, {
        title: extracted.title,
        date: extracted.date,
        category: extracted.category,
        whatHappened: extracted.what_happened,
        whyPeopleCare: extracted.why_people_care,
        whatThisMeans: extracted.what_this_means,
        whatLikelyDoesNotChange: extracted.what_likely_does_not_change,
      });

      if (draft) {
        setCurrentDraftId(draft.id);
        setMessage('Content extracted successfully! Review and edit before publishing.');
        setMessageType('success');
      } else {
        setMessage('Content extracted, but failed to save draft.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to extract content from URL. Please try again.');
      setMessageType('error');
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentDraftId) {
      setMessage('No draft to save');
      return;
    }

    setLoading(true);
    setMessage('');

    const updated = await updateDraft(currentDraftId, {
      title,
      date,
      category,
      whatHappened,
      whyPeopleCare,
      whatThisMeans,
      whatLikelyDoesNotChange: whatLikelyDoesNotChange || undefined,
    });

    if (updated) {
      setMessage('Draft saved successfully!');
    } else {
      setMessage('Failed to save draft. Please try again.');
    }

    setLoading(false);
  };

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
      // Update draft status to published if it exists
      if (currentDraftId) {
        await updateDraft(currentDraftId, { status: 'published' });
      }

      setMessage('Event created successfully!');
      // Reset form
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('politics');
      setWhatHappened('');
      setWhyPeopleCare('');
      setWhatThisMeans('');
      setWhatLikelyDoesNotChange('');
      setUrl('');
      setCurrentDraftId(null);
      setEntryMode('manual');
      // Navigate back to event screen after a short delay
      setTimeout(() => {
        navigation.navigate('Event' as never);
      }, 1500);
    } else {
      setMessage('Failed to create event. Please try again.');
    }

    setLoading(false);
  };

  // Show loading or nothing while checking admin status
  if (isAdmin === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If not admin, don't render the form (will redirect)
  if (!isAdmin) {
    return null;
  }

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

            {/* Entry Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, entryMode === 'manual' && styles.modeButtonActive]}
                onPress={() => setEntryMode('manual')}
              >
                <Text style={[styles.modeButtonText, entryMode === 'manual' && styles.modeButtonTextActive]}>
                  Manual Entry
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, entryMode === 'url' && styles.modeButtonActive]}
                onPress={() => setEntryMode('url')}
              >
                <Text style={[styles.modeButtonText, entryMode === 'url' && styles.modeButtonTextActive]}>
                  Extract from URL
                </Text>
              </TouchableOpacity>
            </View>

            {/* URL Extraction Mode */}
            {entryMode === 'url' && (
              <View style={styles.urlSection}>
                <TextInput
                  label="Article URL"
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://example.com/article"
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <Button
                  title={extracting ? "Extracting..." : "Extract Content"}
                  onPress={handleExtractFromUrl}
                  loading={extracting}
                  disabled={extracting || !url.trim()}
                />
                {currentDraftId && (
                  <Button
                    title="Save Draft"
                    onPress={handleSaveDraft}
                    variant="secondary"
                    loading={loading}
                    disabled={loading}
                  />
                )}
              </View>
            )}

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
              <Text style={[
                styles.message,
                messageType === 'error' && styles.messageError,
                messageType === 'success' && styles.messageSuccess
              ]}>{message}</Text>
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
  messageError: {
    color: '#d32f2f',
    fontWeight: '500',
  },
  messageSuccess: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#000',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  urlSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});
