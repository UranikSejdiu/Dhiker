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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeColors } from '../../utils/theme';

const GOOGLE_G_URI = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>'
);

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register, loginWithGoogle } = useAuth();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const styles = getStyles(colors);

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
    if (!displayName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t('fillAllFields'));
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
          placeholderTextColor={colors.textSecondary}
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
            colors={colors.gradientPrimary}
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
          <Text style={styles.appTitle}>{t('signUpBtn')}</Text>
          <Text style={styles.bismillah}>بِسْمِ اللهِ</Text>
          <Text style={styles.subtitle}>{t('subtitle')}</Text>
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
          {renderInput(t('displayNameLabel'), displayName, setDisplayName, 'displayName', {
            placeholder: t('displayNameLabel'),
            autoCapitalize: 'words',
          })}

          {/* Email Input */}
          {renderInput(t('emailLabel'), email, setEmail, 'email', {
            placeholder: t('emailLabel'),
            keyboardType: 'email-address',
          })}

          {/* Password Input */}
          {renderInput(t('passwordLabel'), password, setPassword, 'password', {
            placeholder: t('passwordLabel'),
            secureTextEntry: true,
          })}

          {/* Confirm Password Input */}
          {renderInput(t('passwordLabel'), confirmPassword, setConfirmPassword, 'confirmPassword', {
            placeholder: t('passwordLabel'),
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
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.createButtonText}>{t('signUpBtn')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

           {/* Google Auth Button */}
           <TouchableOpacity
             activeOpacity={0.85}
             onPress={async () => {
               setIsLoading(true);
               try {
                 await loginWithGoogle();
               } catch (err: any) {
                 setError(err.message || 'Failed to sign up with Google');
                 setIsLoading(false);
               }
             }}
             disabled={isLoading}
             style={styles.googleButtonWrapper}
           >
             <View style={styles.googleButton}>
               <View style={styles.googleIconContainer}>
                 <Image source={{ uri: GOOGLE_G_URI }} style={styles.googleIconImage} />
               </View>
               <Text style={styles.googleButtonText}>{t('continueGoogle')}</Text>
             </View>
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
              {t('hasAccount')}{' '}
              <Text style={styles.linkTextHighlight}>{t('signInBtn')}</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom decorative accent */}
        <View style={styles.bottomAccent}>
          <LinearGradient
            colors={['transparent', colors.primary + '20', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomAccentLine}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  crescentIcon: {
    fontSize: 34,
    color: colors.primary,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  bismillah: {
    fontSize: 20,
    color: colors.primary,
    marginBottom: 6,
    fontWeight: '300',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error + '40',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
    shadowColor: colors.primary,
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  googleButtonWrapper: {
    marginBottom: 22,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  googleIconImage: {
    width: 22,
    height: 22,
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.card,
  },
  dividerText: {
    color: colors.primary + '50',
    marginHorizontal: 16,
    fontSize: 12,
  },
  linkContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  linkTextHighlight: {
    color: colors.primary,
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
