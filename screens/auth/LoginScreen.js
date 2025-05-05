"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import CustomInput from "../../components/CustomInput"
import CustomButton from "../../components/CustomButton"

const LoginScreen = ({ navigation }) => {
  const { signIn, authState } = useAuth()
  const { colors } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setIsLoading(true)
    const result = await signIn(email, password)
    setIsLoading(false)

    if (!result.success) {
      Alert.alert("Login Failed", result.error)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.logoContainer}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.title, { color: colors.primary }]}>WeCare</Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>Connect donors with those in need</Text>
          </View>

          <View style={styles.formContainer}>
            <CustomInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              iconName="mail-outline"
            />

            <CustomInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              iconName="lock-closed-outline"
            />

            {authState.error && <Text style={styles.errorText}>{authState.error}</Text>}

            <CustomButton
              title={isLoading ? <ActivityIndicator color="white" /> : "Login"}
              onPress={handleLogin}
              disabled={isLoading}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => Alert.alert("Reset Password", "Feature coming soon!")}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.registerText, { color: colors.primary }]}>Register</Text>
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
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
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
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  forgotPassword: {
    alignSelf: "center",
    marginTop: 15,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    marginRight: 5,
  },
  registerText: {
    fontSize: 14,
    fontWeight: "bold",
  },
})

export default LoginScreen
