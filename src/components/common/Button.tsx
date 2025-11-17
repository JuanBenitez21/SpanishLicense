// src/components/common/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
//import { theme } from '@/theme/theme';
import { theme } from '../../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  subtitle?: string;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  subtitle,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  const getGradientColors = (): [string, string] => {
    if (isPrimary) return [theme.colors.primary.main, theme.colors.primary.dark];
    if (isSecondary) return [theme.colors.secondary.main, theme.colors.secondary.main];
    return ['transparent', 'transparent'];
  };

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text style={[styles.title, isOutline && styles.outlineText]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, isOutline && styles.outlineText]}>
              {subtitle}
            </Text>
          )}
        </>
      )}
    </>
  );

  if (isOutline) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.button, styles.outlineButton, disabled && styles.disabled, style]}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[disabled && styles.disabled, style]}
    >
      <LinearGradient colors={getGradientColors()} style={styles.button}>
        {buttonContent}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 36,
    paddingVertical: 20,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    ...theme.shadows.medium,
  },
  disabled: {
    opacity: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    paddingVertical: 18,
  },
  outlineText: {
    color: theme.colors.primary.main,
  },
});