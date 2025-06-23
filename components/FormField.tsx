import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native'

interface FormFieldProps extends TextInputProps {
  label: string
  error?: string
  showPassword?: boolean
  togglePassword?: () => void
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  showPassword,
  togglePassword,
  secureTextEntry,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#999"
          {...props}
          secureTextEntry={secureTextEntry && !showPassword}
        />
        {togglePassword && (
          <TouchableOpacity onPress={togglePassword} style={styles.eyeIcon}>
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={24} 
              color={showPassword ? "#7E57C2" : "#666"} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#ff4444',
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 12,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
})

export default FormField 