"use client"
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"

const DonationCard = ({ donation, onPress, showStatus = false }) => {
  const { colors, isDarkMode } = useTheme()

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return colors.warning
      case "accepted":
        return colors.primary
      case "completed":
        return colors.success
      default:
        return colors.gray
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "accepted":
        return "Accepted"
      case "completed":
        return "Completed"
      default:
        return "Available"
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? colors.accent : colors.white,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Image source={{ uri: donation.images[0] || "https://via.placeholder.com/100" }} style={styles.image} />

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {donation.title}
        </Text>

        <Text style={[styles.description, { color: colors.gray }]} numberOfLines={2}>
          {donation.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.categoryContainer}>
            <Ionicons name={donation.category?.icon || "cube-outline"} size={14} color={colors.primary} />
            <Text style={[styles.category, { color: colors.primary }]}>{donation.category?.name || "General"}</Text>
          </View>

          {showStatus && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(donation.status) }]}>
              <Text style={styles.statusText}>{getStatusText(donation.status)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  category: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
})

export default DonationCard
