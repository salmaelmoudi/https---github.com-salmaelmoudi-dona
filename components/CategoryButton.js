"use client"
import { TouchableOpacity, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"

const CategoryButton = ({ title, icon, isSelected, onPress }) => {
  const { colors } = useTheme()

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? colors.primary : colors.lightGray,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon || "grid-outline"} size={18} color={isSelected ? colors.white : colors.gray} />
      <Text style={[styles.title, { color: isSelected ? colors.white : colors.text }]}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
})

export default CategoryButton
