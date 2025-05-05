"use client"
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { COLORS } from "../constants/theme"

const SplashScreen = () => {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
      <Text style={[styles.title, { color: COLORS.primary }]}>WeCare</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Connect donors with those in need</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
})

export default SplashScreen
