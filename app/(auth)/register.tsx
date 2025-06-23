import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import FormField from '../../components/FormField'
import { useAuth } from '@/contexts/AuthContext'

interface FormData {
  username: string
  email: string
  password: string
  passwordConfirm: string
  firstName: string
  lastName: string
  role?: 'user' | 'freelancer'
}

interface FormErrors {
  username?: string
  email?: string
  password?: string
  passwordConfirm?: string
  firstName?: string
  lastName?: string
  general?: string
  role?: string
}

interface PasswordValidation {
  isValid: boolean
  errors: string[]
}

const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('At least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('One number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('One special character (!@#$%^&*(),.?":{}|<>)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const Register = () => {
  const { register, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordRequirements, setPasswordRequirements] = useState<string[]>([])
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [verificationModalVisible, setVerificationModalVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'user' | 'freelancer' | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 2) {
      newErrors.username = 'Username must be at least 2 characters long'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (!passwordValidation.isValid) {
      newErrors.password = `Password requirements missing: ${passwordValidation.errors.join(', ')}`
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Please confirm your password'
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData) => (text: string) => {
    setFormData(prev => ({ ...prev, [field]: text }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    
    // Update password requirements as user types
    if (field === 'password') {
      const { errors } = validatePassword(text);
      setPasswordRequirements(errors);
    }
  }

  const handleRoleSelect = (role: 'user' | 'freelancer') => {
    setSelectedRole(role);
    setRoleModalVisible(false);
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      setRoleModalVisible(true);
      return;
    }
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      console.log('Form validation passed, sending registration data:', {
        ...formData,
        password: '***',
        passwordConfirm: '***'
      });
      
      const { passwordConfirm, ...registrationData } = formData;
      registrationData.role = selectedRole;
      
      // Use the register function from AuthContext
      await register(registrationData);
      
      setErrors({});
      setVerificationModalVisible(true);
      // AuthContext will handle redirection to login
    } catch (error: any) {
      // Enhanced error logging
      console.error('Registration error details:', {
        message: error.message,
        response: {
          data: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
        },
        requestData: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: {
            ...error.config?.data,
            password: '[REDACTED]',
            passwordConfirm: '[REDACTED]'
          }
        }
      });

      // Show more detailed error message
      let errorMessage = 'Registration failed. ';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage += error.response.data;
        } else if (error.response.data.message) {
          errorMessage += error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage += error.response.data.error;
        }
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      console.log('Setting error message:', errorMessage);
      setErrors({
        general: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sign up now</Text>
      <Text style={styles.subtitle}>Please fill the details and create account</Text>

      {errors.general && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={20} color="#fff" />
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}

      <View style={styles.form}>
        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => setRoleModalVisible(true)}
        >
          <Text style={styles.roleButtonText}>
            {selectedRole === 'user' ? 'User (for renting)' : selectedRole === 'freelancer' ? 'Freelancer (listing services)' : 'Select Role'}
          </Text>
        </TouchableOpacity>
        <FormField
          label="First Name"
          value={formData.firstName}
          onChangeText={handleChange('firstName')}
          error={errors.firstName}
          autoCapitalize="words"
        />
        
        <FormField
          label="Last Name"
          value={formData.lastName}
          onChangeText={handleChange('lastName')}
          error={errors.lastName}
          autoCapitalize="words"
        />

        <FormField
          label="Username"
          value={formData.username}
          onChangeText={handleChange('username')}
          error={errors.username}
          autoCapitalize="none"
        />
        
        <FormField
          label="Email Address"
          value={formData.email}
          onChangeText={handleChange('email')}
          keyboardType="email-address"
          error={errors.email}
          autoCapitalize="none"
        />
        
        <FormField
          label="Password"
          value={formData.password}
          onChangeText={handleChange('password')}
          secureTextEntry={!showPassword}
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          error={errors.password}
        />

        {passwordRequirements.length > 0 && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password must have:</Text>
            {passwordRequirements.map((req, index) => (
              <Text key={index} style={styles.requirement}>• {req}</Text>
            ))}
          </View>
        )}

        <FormField
          label="Confirm Password"
          value={formData.passwordConfirm}
          onChangeText={handleChange('passwordConfirm')}
          secureTextEntry={!showPassword}
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          error={errors.passwordConfirm}
        />

        <TouchableOpacity 
          style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signUpText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
        </View>
      </View>
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.roleModalContainer}>
            <Text style={styles.roleModalTitle}>Select your role</Text>
            <TouchableOpacity
              style={[styles.roleOption, selectedRole === 'user' && styles.roleOptionSelected]}
              onPress={() => handleRoleSelect('user')}
            >
              <Text style={[styles.roleOptionText, selectedRole === 'user' && styles.roleOptionTextSelected]}>User (for renting)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleOption, selectedRole === 'freelancer' && styles.roleOptionSelected]}
              onPress={() => handleRoleSelect('freelancer')}
            >
              <Text style={[styles.roleOptionText, selectedRole === 'freelancer' && styles.roleOptionTextSelected]}>Freelancer (listing services)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.roleModalClose}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.roleModalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={verificationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVerificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.verificationModalContainer}>
            <Text style={styles.verificationTitle}>Verify Your Account</Text>
            <Text style={styles.verificationMessage}>
              Please check your email for a verification link or wait for admin approval before logging in.
            </Text>
            <TouchableOpacity
              style={styles.verificationButton}
              onPress={() => {
                setVerificationModalVisible(false);
                router.push('/login');
              }}
            >
              <Text style={styles.verificationButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: 'white',
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7E57C2',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 30,
  },
  form: {
    gap: 16,
  },
  passwordHint: {
    fontSize: 14,
    color: '#666',
    marginTop: -8,
  },
  signUpButton: {
    backgroundColor: '#7E57C2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#7E57C2',
    fontSize: 16,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  generalError: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  requirementsContainer: {
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  requirementsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requirement: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  roleButton: {
    backgroundColor: '#f3e8ff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#7E57C2',
  },
  roleButtonText: {
    color: '#7E57C2',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: 320,
    shadowColor: '#7E57C2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  roleModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7E57C2',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleOption: {
    backgroundColor: '#f3e8ff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginVertical: 8,
    width: 220,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7E57C2',
  },
  roleOptionSelected: {
    backgroundColor: '#7E57C2',
  },
  roleOptionText: {
    color: '#7E57C2',
    fontSize: 16,
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
  roleModalClose: {
    marginTop: 18,
    alignItems: 'center',
  },
  roleModalCloseText: {
    color: '#666',
    fontSize: 16,
  },
  verificationModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: 340,
    shadowColor: '#7E57C2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  verificationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#7E57C2',
    marginBottom: 16,
    textAlign: 'center',
  },
  verificationMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  verificationButton: {
    backgroundColor: '#7E57C2',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: 220,
    shadowColor: '#7E57C2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  verificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})

export default Register 