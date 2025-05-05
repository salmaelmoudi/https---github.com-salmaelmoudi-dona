"use client"
import { TouchableOpacity, Text, StyleSheet } from "react-native"
import { useTheme } from "../context/ThemeContext"

const CustomButton = ({ title, onPress, disabled, type = "primary", style, textStyle, ...props }) => {
  const { colors } = useTheme()

  const getButtonStyle = () => {
    switch (type) {
      case "secondary":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.primary,
        }
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        }
      default:
        return {
          backgroundColor: colors.primary,
        }
    }
  }

  const getTextStyle = () => {
    switch (type) {
      case "secondary":
        return {
          color: colors.primary,
        }
      case "outline":
        return {
          color: colors.text,
        }
      default:
        return {
          color: "white",
        }
    }
  }

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), disabled && styles.disabledButton, style]}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      {typeof title === "string" ? <Text style={[styles.buttonText, getTextStyle(), textStyle]}>{title}</Text> : title}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
})

export default CustomButton
