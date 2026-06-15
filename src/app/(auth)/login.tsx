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
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeColors } from '../../utils/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { login, loginWithGoogle, user } = useAuth();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const styles = getStyles(colors);

  // Redirect to counter when user becomes authenticated (e.g. after Google OAuth callback)
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/counter');
    }
  }, [user]);

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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('fillAllFields'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/counter');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.appTitle}>{t('appTitle')}</Text>
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

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{t('emailLabel')}</Text>
            <TextInput
              style={[
                styles.input,
                emailFocused && styles.inputFocused,
              ]}
              placeholder={t('emailLabel')}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{t('passwordLabel')}</Text>
            <TextInput
              style={[
                styles.input,
                passwordFocused && styles.inputFocused,
              ]}
              placeholder={t('passwordLabel')}
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signInButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.signInButtonText}>{t('signInBtn')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>



          {/* Sign Up Link */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            disabled={isLoading}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              {t('noAccount')}{' '}
              <Text style={styles.linkTextHighlight}>{t('signUpBtn')}</Text>
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
    paddingVertical: 40,
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
    marginBottom: 40,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  crescentIcon: {
    fontSize: 42,
    color: colors.primary,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
    marginBottom: 8,
  },
  bismillah: {
    fontSize: 22,
    color: colors.primary,
    marginBottom: 6,
    fontWeight: '300',
  },
  subtitle: {
    fontSize: 14,
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
    marginBottom: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
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
    marginTop: 8,
    marginBottom: 24,
  },
  signInButton: {
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
  signInButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  googleButtonWrapper: {
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.card,
    borderRadius: 14,
    paddingVertical: 16,
  },
  googleButtonIcon: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    marginRight: 12,
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    marginTop: 32,
  },
  bottomAccentLine: {
    width: '80%',
    height: 1,
  },
});
