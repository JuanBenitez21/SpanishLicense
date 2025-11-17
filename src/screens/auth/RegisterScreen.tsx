// src/screens/auth/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../services/auth/AuthContext';
import { RegisterData } from '../../types/auth.types';

type RegisterScreenProps = {
  navigation: StackNavigationProp<any>;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Partial<RegisterData>>({
    firstName: '',
    lastName: '',
    birthDate: '',
    email: '',
    password: '',
    confirmPassword: '',
    accessCode: '',
    acceptTerms: false,
  });

  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterData, string>>>({});

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);

  const formatBirthDate = (text: string) => {
    // Remover todo excepto números
    const cleaned = text.replace(/\D/g, '');

    // Formatear como DD/MM/YYYY
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    }

    return formatted;
  };

  const updateFormData = (field: keyof RegisterData, value: any) => {
    // Formatear fecha automáticamente
    if (field === 'birthDate') {
      value = formatBirthDate(value);
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Calculate password strength
    if (field === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return theme.colors.error;
    if (passwordStrength < 75) return theme.colors.warning;
    return theme.colors.success;
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 50) return 'Débil';
    if (passwordStrength < 75) return 'Media';
    return 'Fuerte';
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterData, string>> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.birthDate?.trim()) {
      newErrors.birthDate = 'La fecha de nacimiento es requerida';
    } else {
      // Validar formato de fecha (DD/MM/YYYY)
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(formData.birthDate)) {
        newErrors.birthDate = 'Formato inválido (DD/MM/YYYY)';
      } else {
        // Validar que sea mayor de 13 años
        const [day, month, year] = formData.birthDate.split('/').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 13) {
          newErrors.birthDate = 'Debes tener al menos 13 años';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterData, string>> = {};

    if (!formData.email?.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Correo electrónico inválido';
      }
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterData, string>> = {};

    if (!formData.accessCode?.trim()) {
      newErrors.accessCode = 'El código de acceso es requerido';
    } else {
      // Validar formato del código (SPAN-2025-XXXX)
      const codeRegex = /^SPAN-2025-[A-Z0-9]{4}$/;
      if (!codeRegex.test(formData.accessCode)) {
        newErrors.accessCode = 'Formato inválido (SPAN-2025-XXXX)';
      }
    }

    if (!formData.acceptTerms) {
      Alert.alert('Términos y Condiciones', 'Debes aceptar los términos y condiciones');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    if (step === 1) {
      isValid = validateStep1();
    } else if (step === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    
    const { error } = await signUp(formData as RegisterData);
    
    setLoading(false);

    if (error) {
      Alert.alert(
        'Error al registrarse',
        error.message || 'Ocurrió un error al crear tu cuenta'
      );
    } else {
      Alert.alert(
        '¡Registro exitoso!',
        'Tu cuenta ha sido creada. Por favor verifica tu correo electrónico.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressDots}>
        {[1, 2, 3].map((dotStep) => (
          <View
            key={dotStep}
            style={[
              styles.progressDot,
              step >= dotStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>Paso {step} de 3</Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Información Personal</Text>

      <Input
        label="Nombre"
        placeholder="Juan"
        value={formData.firstName || ''}
        onChangeText={(value) => updateFormData('firstName', value)}
        icon="person-outline"
        error={errors.firstName}
      />

      <Input
        label="Apellido"
        placeholder="Pérez"
        value={formData.lastName || ''}
        onChangeText={(value) => updateFormData('lastName', value)}
        icon="person-outline"
        error={errors.lastName}
      />

      <Input
        label="Fecha de Nacimiento"
        placeholder="DD/MM/YYYY"
        value={formData.birthDate || ''}
        onChangeText={(value) => updateFormData('birthDate', value)}
        icon="calendar-outline"
        error={errors.birthDate}
        keyboardType="number-pad"
        maxLength={10}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Credenciales de Acceso</Text>

      <Input
        label="Correo Electrónico"
        placeholder="tu@email.com"
        value={formData.email || ''}
        onChangeText={(value) => updateFormData('email', value)}
        icon="mail-outline"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View>
        <Input
          label="Contraseña"
          placeholder="••••••••"
          value={formData.password || ''}
          onChangeText={(value) => updateFormData('password', value)}
          icon="lock-closed-outline"
          showPasswordToggle
          error={errors.password}
          autoCapitalize="none"
        />

        {formData.password && (
          <View style={styles.passwordStrength}>
            <View style={styles.strengthBar}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    width: `${passwordStrength}%`,
                    backgroundColor: getPasswordStrengthColor(),
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.strengthText,
                { color: getPasswordStrengthColor() },
              ]}
            >
              {getPasswordStrengthText()}
            </Text>
          </View>
        )}
      </View>

      <Input
        label="Confirmar Contraseña"
        placeholder="••••••••"
        value={formData.confirmPassword || ''}
        onChangeText={(value) => updateFormData('confirmPassword', value)}
        icon="lock-closed-outline"
        showPasswordToggle
        error={errors.confirmPassword}
        autoCapitalize="none"
      />

      {formData.confirmPassword &&
        formData.password === formData.confirmPassword && (
          <View style={styles.matchIndicator}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.matchText}>Las contraseñas coinciden</Text>
          </View>
        )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Código de Acceso</Text>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={24} color={theme.colors.info} />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>¿Dónde encuentro mi código?</Text>
          <Text style={styles.infoText}>
            Ingresa el código que recibiste por email de tu institución
          </Text>
        </View>
      </View>

      <Input
        label="Código de Acceso"
        placeholder="SPAN-2025-XXXX"
        value={formData.accessCode || ''}
        onChangeText={(value) => updateFormData('accessCode', value.toUpperCase())}
        icon="key-outline"
        error={errors.accessCode}
        autoCapitalize="characters"
      />

      <TouchableOpacity
        style={styles.termsContainer}
        onPress={() => updateFormData('acceptTerms', !formData.acceptTerms)}
      >
        <View
          style={[
            styles.checkbox,
            formData.acceptTerms && styles.checkboxChecked,
          ]}
        >
          {formData.acceptTerms && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
        <Text style={styles.termsText}>
          Acepto los{' '}
          <Text style={styles.termsLink}>términos y condiciones</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registro</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Indicator */}
        {renderProgressIndicator()}

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomContainer}>
          {step < 3 ? (
            <Button
              title="Continuar →"
              onPress={handleNext}
              variant="primary"
            />
          ) : (
            <Button
              title="Crear mi cuenta"
              onPress={handleRegister}
              loading={loading}
              variant="primary"
            />
          )}

          {step === 3 && (
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary.main,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 24,
  },
  passwordStrength: {
    marginTop: -16,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  strengthBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
    //transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -16,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  matchText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  termsLink: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    backgroundColor: theme.colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  loginLinkBold: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
});