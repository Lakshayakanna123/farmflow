import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';

const LoginScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>FarmFlow</Text>
          <Text style={styles.tagline}>Care. Track. Grow.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={[TYPOGRAPHY.h1, styles.title]}>Welcome Back!</Text>
          <Text style={[TYPOGRAPHY.body, styles.subtitle]}>Login to continue</Text>

          <TextInput 
            style={styles.input} 
            placeholder="Email / Username" 
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry 
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={() => {}}>
            <Text style={TYPOGRAPHY.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => {}}>
            <Text style={styles.secondaryButtonText}>Login as Employee</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.brown,
    marginTop: 6,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 24,
    ...SHADOWS.card,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.button,
    padding: 16,
    marginBottom: 16,
    fontSize: 14,
    color: COLORS.textMain,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: COLORS.brown,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default LoginScreen;
