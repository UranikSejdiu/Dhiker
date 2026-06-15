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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { login, loginWithGoogle, user } = useAuth();
  const router = useRouter();

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
      setError('Please fill in all fields');
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
          <Text style={styles.appTitle}>Dhikr Counter</Text>
          <Text style={styles.bismillah}>بِسْمِ اللهِ</Text>
          <Text style={styles.subtitle}>Remember Allah, find peace</Text>
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
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[
                styles.input,
                emailFocused && styles.inputFocused,
              ]}
              placeholder="Enter your email"
              placeholderTextColor="#5A6478"
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
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={[
                styles.input,
                passwordFocused && styles.inputFocused,
              ]}
              placeholder="Enter your password"
              placeholderTextColor="#5A6478"
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
              colors={['#C9A84C', '#B8963F', '#A6852F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signInButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#060D1B" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
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
                setError(err.message || 'Failed to sign in with Google');
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            style={styles.googleButtonWrapper}
          >
            <View style={styles.googleButton}>
              <Text style={styles.googleButtonIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>✦</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            disabled={isLoading}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkTextHighlight}>Sign Up</Text>
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
    backgroundColor: '#0D1A2D',
    borderWidth: 2,
    borderColor: '#C9A84C40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  crescentIcon: {
    fontSize: 42,
    color: '#C9A84C',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F5F0E8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  bismillah: {
    fontSize: 22,
    color: '#C9A84C',
    marginBottom: 6,
    fontWeight: '300',
  },
  subtitle: {
    fontSize: 14,
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
    marginBottom: 20,
  },
  errorText: {
    color: '#F5706C',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    color: '#C9A84C',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0D1A2D',
    borderWidth: 1.5,
    borderColor: '#1A2744',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
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
    marginTop: 8,
    marginBottom: 24,
  },
  signInButton: {
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
  signInButtonText: {
    color: '#060D1B',
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
    backgroundColor: '#0F1A2E',
    borderWidth: 1,
    borderColor: '#1A2744',
    borderRadius: 14,
    paddingVertical: 16,
  },
  googleButtonIcon: {
    color: '#C9A84C',
    fontSize: 20,
    fontWeight: '800',
    marginRight: 12,
  },
  googleButtonText: {
    color: '#F5F0E8',
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
    marginTop: 32,
  },
  bottomAccentLine: {
    width: '80%',
    height: 1,
  },
});
