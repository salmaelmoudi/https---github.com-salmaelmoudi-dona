"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import CustomInput from "../../components/CustomInput"
import CustomButton from "../../components/CustomButton"

const RegisterScreen = ({ navigation }) => {
  const { signUp } = useAuth()
  const { colors } = useTheme()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "donor", // Default role
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleRegister = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    setIsLoading(true)
    const result = await signUp(formData)
    setIsLoading(false)

    if (!result.success) {
      Alert.alert("Registration Failed", result.error)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: colors.primary }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>Join our community to make a difference</Text>
          </View>

          <View style={styles.formContainer}>
            <CustomInput
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              iconName="person-outline"
            />

            <CustomInput
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
              iconName="mail-outline"
            />

            <CustomInput
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              keyboardType="phone-pad"
              iconName="call-outline"
            />

            <CustomInput
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleChange("password", text)}
              secureTextEntry
              iconName="lock-closed-outline"
            />

            <CustomInput
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange("confirmPassword", text)}
              secureTextEntry
              iconName="lock-closed-outline"
            />

            <View style={styles.roleContainer}>
              <Text style={[styles.roleLabel, { color: colors.text }]}>I am a:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleButton, formData.role === "donor" && { backgroundColor: colors.primary }]}
                  onPress={() => handleChange("role", "donor")}
                >
                  <Text style={[styles.roleButtonText, formData.role === "donor" && { color: colors.white }]}>
                    Donor
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, formData.role === "receiver" && { backgroundColor: colors.primary }]}
                  onPress={() => handleChange("role", "receiver")}
                >
                  <Text style={[styles.roleButtonText, formData.role === "receiver" && { color: colors.white }]}>
                    Association
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <CustomButton
              title={isLoading ? <ActivityIndicator color="white" /> : "Register"}
              onPress={handleRegister}
              disabled={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.loginText, { color: colors.primary }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
  },
  roleContainer: {
    marginVertical: 15,
  },
  roleLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    marginHorizontal: 5,
    alignItems: "center",
  },
  roleButtonText: {
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    marginRight: 5,
  },
  loginText: {
    fontSize: 14,
    fontWeight: "bold",
  },
})

export default RegisterScreen
