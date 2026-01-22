import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { CountryAutocomplete } from '../components/CountryAutocomplete';
import { getCurrentUser, getUserProfile, updateUserProfile } from '../services/authService';
import { CareerField, Interest, RiskTolerance, OnboardingData } from '../types';

const CAREER_FIELDS: { value: CareerField; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'media', label: 'Media' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
];

const INTERESTS: { value: Interest; label: string }[] = [
  { value: 'money', label: 'Money' },
  { value: 'work', label: 'Work' },
  { value: 'health', label: 'Health' },
  { value: 'environment', label: 'Environment' },
  { value: 'tech', label: 'Technology' },
];

const RISK_TOLERANCES: { value: RiskTolerance; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Prefer cautious, measured updates' },
  { value: 'medium', label: 'Medium', description: 'Balanced perspective' },
  { value: 'high', label: 'High', description: 'Comfortable with broader implications' },
];

export const PreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [country, setCountry] = useState('');
  const [careerField, setCareerField] = useState<CareerField | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        navigation.goBack();
        return;
      }

      const profile = await getUserProfile(user.id);
      if (profile) {
        setCountry(profile.country || '');
        setCareerField(profile.careerField || null);
        setInterests(profile.interests || []);
        setRiskTolerance(profile.riskTolerance || null);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: Interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!country.trim() || !careerField || interests.length === 0 || !riskTolerance) {
      Alert.alert('Incomplete', 'Please fill in all preferences before saving.');
      return;
    }

    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'You must be signed in to save preferences.');
        return;
      }

      const preferences: OnboardingData = {
        country: country.trim(),
        careerField,
        interests,
        riskTolerance,
      };

      const updated = await updateUserProfile(user.id, preferences);
      if (updated) {
        Alert.alert('Success', 'Preferences saved successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.description}>
          Update your preferences to personalize your event updates.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where are you based?</Text>
          <Text style={styles.sectionDescription}>
            This helps us provide relevant context for events.
          </Text>
          <CountryAutocomplete
            value={country}
            onChangeText={setCountry}
            placeholder="Country"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your career field?</Text>
          <Text style={styles.sectionDescription}>
            Select the category that best describes your work.
          </Text>
          <View style={styles.optionsContainer}>
            {CAREER_FIELDS.map((field) => (
              <TouchableOpacity
                key={field.value}
                style={[
                  styles.option,
                  careerField === field.value && styles.optionSelected,
                ]}
                onPress={() => setCareerField(field.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    careerField === field.value && styles.optionTextSelected,
                  ]}
                >
                  {field.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What interests you?</Text>
          <Text style={styles.sectionDescription}>
            Select all that apply. We'll prioritize events in these areas.
          </Text>
          <View style={styles.optionsContainer}>
            {INTERESTS.map((interest) => (
              <TouchableOpacity
                key={interest.value}
                style={[
                  styles.option,
                  interests.includes(interest.value) && styles.optionSelected,
                ]}
                onPress={() => toggleInterest(interest.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    interests.includes(interest.value) && styles.optionTextSelected,
                  ]}
                >
                  {interest.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How do you prefer to receive updates?</Text>
          <Text style={styles.sectionDescription}>
            This affects the tone and scope of personalized content.
          </Text>
          <View style={styles.optionsContainer}>
            {RISK_TOLERANCES.map((risk) => (
              <TouchableOpacity
                key={risk.value}
                style={[
                  styles.riskOption,
                  riskTolerance === risk.value && styles.optionSelected,
                ]}
                onPress={() => setRiskTolerance(risk.value)}
              >
                <Text
                  style={[
                    styles.riskOptionLabel,
                    riskTolerance === risk.value && styles.optionTextSelected,
                  ]}
                >
                  {risk.label}
                </Text>
                <Text
                  style={[
                    styles.riskOptionDescription,
                    riskTolerance === risk.value && styles.optionTextSelected,
                  ]}
                >
                  {risk.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Save Preferences"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        </View>
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
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 24,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  optionTextSelected: {
    fontWeight: '500',
  },
  riskOption: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  riskOptionLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  riskOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
});
