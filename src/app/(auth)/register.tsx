import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register } = useAuth();
  const router = useRouter();

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    // Validation
    if (!displayName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await register(email.trim(), password, displayName.trim());
      router.replace('/(tabs)/counter');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    fieldKey: string,
    options: {
      placeholder: string;
      secureTextEntry?: boolean;
      keyboardType?: 'email-address' | 'default';
      autoCapitalize?: 'none' | 'words';
    }
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focusedField === fieldKey && styles.inputFocused,
        ]}
        placeholder={options.placeholder}
        placeholderTextColor="#5A6478"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
        secureTextEntry={options.secureTextEntry}
        keyboardType={options.keyboardType || 'default'}
        autoCapitalize={options.autoCapitalize || 'none'}
        autoCorrect={false}
        editable={!isLoading}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative top accent */}
        <View style={styles.topAccent}>
          <LinearGradient
            colors={['#C9A84C', '#D4B96A', '#C9A84C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />
        </View>

        {/* Header / Branding */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: headerScale }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.crescentIcon}>☪</Text>
          </View>
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.bismillah}>بِسْمِ اللهِ</Text>
          <Text style={styles.subtitle}>Begin your journey of remembrance</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Display Name Input */}
          {renderInput('Display Name', displayName, setDisplayName, 'displayName', {
            placeholder: 'Enter your name',
            autoCapitalize: 'words',
          })}

          {/* Email Input */}
          {renderInput('Email', email, setEmail, 'email', {
            placeholder: 'Enter your email',
            keyboardType: 'email-address',
          })}

          {/* Password Input */}
          {renderInput('Password', password, setPassword, 'password', {
            placeholder: 'Create a password',
            secureTextEntry: true,
          })}

          {/* Confirm Password Input */}
          {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'confirmPassword', {
            placeholder: 'Confirm your password',
            secureTextEntry: true,
          })}

          {/* Create Account Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#C9A84C', '#B8963F', '#A6852F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#060D1B" />
              ) : (
                <Text style={styles.createButtonText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>✦</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign In Link */}
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            disabled={isLoading}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkTextHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom decorative accent */}
        <View style={styles.bottomAccent}>
          <LinearGradient
            colors={['transparent', '#C9A84C20', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomAccentLine}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060D1B',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  topAccent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  accentLine: {
    width: 60,
    height: 3,
    borderRadius: 2,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0D1A2D',
    borderWidth: 2,
    borderColor: '#C9A84C40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  crescentIcon: {
    fontSize: 34,
    color: '#C9A84C',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5F0E8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  bismillah: {
    fontSize: 20,
    color: '#C9A84C',
    marginBottom: 6,
    fontWeight: '300',
  },
  subtitle: {
    fontSize: 13,
    color: '#8A9AB5',
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#2D1015',
    borderWidth: 1,
    borderColor: '#E5484D40',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  errorText: {
    color: '#F5706C',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#C9A84C',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0D1A2D',
    borderWidth: 1.5,
    borderColor: '#1A2744',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: '#F5F0E8',
  },
  inputFocused: {
    borderColor: '#C9A84C',
    backgroundColor: '#0F1E35',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonWrapper: {
    marginTop: 6,
    marginBottom: 22,
  },
  createButton: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonText: {
    color: '#060D1B',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1A2744',
  },
  dividerText: {
    color: '#C9A84C50',
    marginHorizontal: 16,
    fontSize: 12,
  },
  linkContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: '#8A9AB5',
    fontSize: 15,
  },
  linkTextHighlight: {
    color: '#C9A84C',
    fontWeight: '600',
  },
  bottomAccent: {
    alignItems: 'center',
    marginTop: 24,
  },
  bottomAccentLine: {
    width: '80%',
    height: 1,
  },
});
