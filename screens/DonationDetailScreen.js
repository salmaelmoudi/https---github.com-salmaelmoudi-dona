"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Marker } from "react-native-maps"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { API_URL } from "../config"
import CustomButton from "../components/CustomButton"

const { width } = Dimensions.get("window")

const DonationDetailScreen = ({ route, navigation }) => {
  const { donationId } = route.params
  const { authState } = useAuth()
  const { colors, isDarkMode } = useTheme()
  const [donation, setDonation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const { userInfo } = authState
  const isReceiver = userInfo?.role === "receiver"
  const isDonor = userInfo?.role === "donor"
  const isAdmin = userInfo?.role === "admin"
  const isOwner = donation?.userId === userInfo?.id

  useEffect(() => {
    fetchDonationDetails()
  }, [donationId])

  const fetchDonationDetails = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${API_URL}/donations/${donationId}`)
      setDonation(response.data)
    } catch (error) {
      console.error("Error fetching donation details:", error)
      Alert.alert("Error", "Failed to load donation details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptDonation = async () => {
    setIsProcessing(true)
    try {
      await axios.put(`${API_URL}/donations/${donationId}/accept`, {
        receiverId: userInfo.id,
      })

      Alert.alert("Success", "You have accepted this donation. Please contact the donor to arrange pickup.", [
        { text: "OK", onPress: fetchDonationDetails },
      ])
    } catch (error) {
      console.error("Error accepting donation:", error)
      Alert.alert("Error", "Failed to accept donation")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCompleteDonation = async () => {
    setIsProcessing(true)
    try {
      await axios.put(`${API_URL}/donations/${donationId}/complete`)

      Alert.alert("Success", "Donation marked as completed!", [{ text: "OK", onPress: fetchDonationDetails }])
    } catch (error) {
      console.error("Error completing donation:", error)
      Alert.alert("Error", "Failed to complete donation")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteDonation = async () => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this donation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsProcessing(true)
          try {
            await axios.delete(`${API_URL}/donations/${donationId}`)

            Alert.alert("Success", "Donation has been deleted", [{ text: "OK", onPress: () => navigation.goBack() }])
          } catch (error) {
            console.error("Error deleting donation:", error)
            Alert.alert("Error", "Failed to delete donation")
            setIsProcessing(false)
          }
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!donation) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.text }]}>Donation not found</Text>
        <CustomButton title="Go Back" onPress={() => navigation.goBack()} style={{ width: 120 }} />
      </View>
    )
  }

  const renderImageGallery = () => (
    <View style={styles.imageContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.floor(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width)
          setActiveImageIndex(slideIndex)
        }}
      >
        {donation.images.map((image, index) => (
          <Image key={index} source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ))}
      </ScrollView>

      {donation.images.length > 1 && (
        <View style={styles.pagination}>
          {donation.images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === activeImageIndex ? colors.primary : "rgba(255, 255, 255, 0.5)",
                },
              ]}
            />
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
    </View>
  )

  const renderDonationStatus = () => {
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

    return (
      <View style={[styles.statusContainer, { backgroundColor: getStatusColor(donation.status) }]}>
        <Text style={styles.statusText}>
          {donation.status === "pending" && "Available"}
          {donation.status === "accepted" && "Accepted"}
          {donation.status === "completed" && "Completed"}
        </Text>
      </View>
    )
  }

  const renderActionButtons = () => {
    if (isAdmin) {
      return (
        <CustomButton
          title="Delete Donation"
          type="outline"
          onPress={handleDeleteDonation}
          style={{ backgroundColor: colors.danger, borderColor: colors.danger }}
          textStyle={{ color: "white" }}
        />
      )
    }

    if (isDonor && isOwner) {
      if (donation.status === "accepted") {
        return (
          <CustomButton
            title={isProcessing ? <ActivityIndicator color="white" /> : "Mark as Completed"}
            onPress={handleCompleteDonation}
            disabled={isProcessing}
          />
        )
      }

      return (
        <CustomButton
          title={isProcessing ? <ActivityIndicator color="white" /> : "Delete Donation"}
          type="outline"
          onPress={handleDeleteDonation}
          style={{ backgroundColor: colors.danger, borderColor: colors.danger }}
          textStyle={{ color: "white" }}
          disabled={isProcessing}
        />
      )
    }

    if (isReceiver && donation.status === "pending") {
      return (
        <CustomButton
          title={isProcessing ? <ActivityIndicator color="white" /> : "Accept Donation"}
          onPress={handleAcceptDonation}
          disabled={isProcessing}
        />
      )
    }

    return null
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderImageGallery()}

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>{donation.title}</Text>

              <View style={styles.categoryContainer}>
                <Ionicons name={donation.category?.icon || "cube-outline"} size={16} color={colors.primary} />
                <Text style={[styles.category, { color: colors.primary }]}>{donation.category?.name || "General"}</Text>
              </View>
            </View>

            {renderDonationStatus()}
          </View>

          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.text }]}>{donation.description}</Text>
          </View>

          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Donor</Text>
            <View style={styles.donorContainer}>
              <View style={[styles.donorAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.donorInitial}>{donation.user?.name?.charAt(0) || "U"}</Text>
              </View>
              <View style={styles.donorInfo}>
                <Text style={[styles.donorName, { color: colors.text }]}>{donation.user?.name || "Anonymous"}</Text>
                {donation.status === "accepted" && isReceiver && (
                  <TouchableOpacity
                    style={[styles.contactButton, { backgroundColor: colors.primary }]}
                    onPress={() =>
                      Alert.alert("Contact Info", `Phone: ${donation.user?.phone}\nEmail: ${donation.user?.email}`)
                    }
                  >
                    <Ionicons name="call" size={14} color="white" />
                    <Text style={styles.contactButtonText}>Contact</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            <View style={styles.mapContainer}>
              {donation.latitude && donation.longitude ? (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: donation.latitude,
                    longitude: donation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: donation.latitude,
                      longitude: donation.longitude,
                    }}
                    title={donation.title}
                  />
                </MapView>
              ) : (
                <View style={[styles.noMapContainer, { backgroundColor: colors.lightGray }]}>
                  <Ionicons name="location-outline" size={40} color={colors.gray} />
                  <Text style={{ color: colors.gray }}>Location not available</Text>
                </View>
              )}
            </View>
          </View>

          {renderActionButtons()}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginVertical: 20,
    textAlign: "center",
  },
  imageContainer: {
    position: "relative",
    height: 300,
  },
  image: {
    width,
    height: 300,
  },
  pagination: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    alignSelf: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  category: {
    fontSize: 14,
    marginLeft: 5,
    fontWeight: "500",
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  donorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  donorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  donorInitial: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  contactButtonText: {
    color: "white",
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "500",
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noMapContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
})

export default DonationDetailScreen
