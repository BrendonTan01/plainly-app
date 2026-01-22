import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { CountryAutocomplete } from '../components/CountryAutocomplete';
import { OnboardingData, CareerField, Interest, RiskTolerance } from '../types';

interface OnboardingScreenProps {
  onComplete: (data: OnboardingData) => void;
}

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

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [careerField, setCareerField] = useState<CareerField | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance | null>(null);

  const toggleInterest = (interest: Interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      if (country && careerField && interests.length > 0 && riskTolerance) {
        onComplete({
          country,
          careerField,
          interests,
          riskTolerance,
        });
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return country.trim().length > 0;
      case 2:
        return careerField !== null;
      case 3:
        return interests.length > 0;
      case 4:
        return riskTolerance !== null;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Where are you based?</Text>
            <Text style={styles.stepDescription}>
              This helps us provide relevant context for events.
            </Text>
            <CountryAutocomplete
              value={country}
              onChangeText={setCountry}
              placeholder="Country"
            />
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>What's your career field?</Text>
            <Text style={styles.stepDescription}>
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
        );

      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>What interests you?</Text>
            <Text style={styles.stepDescription}>
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
        );

      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>How do you prefer to receive updates?</Text>
            <Text style={styles.stepDescription}>
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
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
          </View>

          <View style={styles.stepContent}>{renderStep()}</View>

          <View style={styles.buttons}>
            {step > 1 && (
              <Button
                title="Back"
                onPress={handleBack}
                variant="secondary"
              />
            )}
            <Button
              title={step === 4 ? 'Complete' : 'Next'}
              onPress={handleNext}
              disabled={!canProceed()}
            />
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  progressBar: {
    height: 2,
    backgroundColor: '#eee',
    borderRadius: 1,
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 1,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 24,
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
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
});
