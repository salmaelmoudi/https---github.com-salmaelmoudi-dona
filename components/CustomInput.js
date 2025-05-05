"use client"
import { View, TextInput, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"

const CustomInput = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  iconName,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
  style,
  ...props
}) => {
  const { colors, isDarkMode } = useTheme()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? colors.accent : colors.lightGray,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {iconName && <Ionicons name={iconName} size={20} color={colors.gray} style={styles.icon} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize || "sentences"}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[styles.input, { color: colors.text }, multiline && styles.multilineInput]}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  multilineInput: {
    height: "auto",
    textAlignVertical: "top",
  },
})

export default CustomInput
