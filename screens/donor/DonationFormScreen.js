"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import axios from "axios"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { API_URL } from "../../config"
import CustomInput from "../../components/CustomInput"
import CustomButton from "../../components/CustomButton"

const DonationFormScreen = ({ navigation }) => {
  const { authState } = useAuth()
  const { colors } = useTheme()
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: null,
    location: null,
    images: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [locationPermission, setLocationPermission] = useState(null)

  useEffect(() => {
    fetchCategories()
    getLocationPermission()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`)
      setCategories(response.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const getLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    setLocationPermission(status === "granted")

    if (status === "granted") {
      getCurrentLocation()
    }
  }

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({})
      setFormData({
        ...formData,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      })
    } catch (error) {
      console.error("Error getting location:", error)
    }
  }

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const pickImage = async () => {
    if (formData.images.length >= 5) {
      Alert.alert("Limit Reached", "You can upload a maximum of 5 images")
      return
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({
        ...formData,
        images: [...formData.images, result.assets[0].uri],
      })
    }
  }

  const removeImage = (index) => {
    const updatedImages = [...formData.images]
    updatedImages.splice(index, 1)
    setFormData({
      ...formData,
      images: updatedImages,
    })
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.description || !formData.categoryId) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    if (!formData.location) {
      Alert.alert("Location Required", "Please enable location services to continue")
      return
    }

    if (formData.images.length === 0) {
      Alert.alert("Images Required", "Please add at least one image of your donation")
      return
    }

    setIsLoading(true)

    try {
      // Create form data for image upload
      const donationData = new FormData()
      donationData.append("title", formData.title)
      donationData.append("description", formData.description)
      donationData.append("categoryId", formData.categoryId)
      donationData.append("latitude", formData.location.latitude)
      donationData.append("longitude", formData.location.longitude)
      donationData.append("userId", authState.userInfo.id)

      // Append images
      formData.images.forEach((image, index) => {
        const imageName = image.split("/").pop()
        const imageType = "image/" + (imageName.split(".").pop() === "png" ? "png" : "jpeg")

        donationData.append("images", {
          uri: image,
          name: imageName,
          type: imageType,
        })
      })

      const response = await axios.post(`${API_URL}/donations`, donationData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      Alert.alert("Success", "Your donation has been posted successfully!", [
        { text: "OK", onPress: () => navigation.navigate("Home") },
      ])
    } catch (error) {
      console.error("Error creating donation:", error)
      Alert.alert("Error", "Failed to create donation. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Donation</Text>
          <Text style={[styles.subtitle, { color: colors.gray }]}>Share your items with those in need</Text>
        </View>

        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Donation Title"
            value={formData.title}
            onChangeText={(text) => handleChange("title", text)}
            iconName="create-outline"
          />

          <CustomInput
            placeholder="Description"
            value={formData.description}
            onChangeText={(text) => handleChange("description", text)}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            iconName="document-text-outline"
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  formData.categoryId === category.id && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => handleChange("categoryId", category.id)}
              >
                <Ionicons
                  name={category.icon || "cube-outline"}
                  size={20}
                  color={formData.categoryId === category.id ? colors.white : colors.text}
                />
                <Text style={[styles.categoryText, formData.categoryId === category.id && { color: colors.white }]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
          <View style={styles.locationContainer}>
            {locationPermission === false && (
              <TouchableOpacity
                style={[styles.locationButton, { backgroundColor: colors.warning }]}
                onPress={getLocationPermission}
              >
                <Ionicons name="location-outline" size={20} color={colors.white} />
                <Text style={styles.locationButtonText}>Enable Location</Text>
              </TouchableOpacity>
            )}

            {locationPermission === true && formData.location && (
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={[styles.locationText, { color: colors.text }]}>Location captured successfully</Text>
              </View>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Images</Text>
          <View style={styles.imagesContainer}>
            <TouchableOpacity style={[styles.addImageButton, { borderColor: colors.border }]} onPress={pickImage}>
              <Ionicons name="add" size={40} color={colors.primary} />
              <Text style={[styles.addImageText, { color: colors.text }]}>Add Image</Text>
            </TouchableOpacity>

            {formData.images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <CustomButton
            title={isLoading ? <ActivityIndicator color="white" /> : "Post Donation"}
            onPress={handleSubmit}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
  },
  formContainer: {
    width: "100%",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    marginRight: 10,
    marginBottom: 10,
  },
  categoryText: {
    marginLeft: 5,
    fontSize: 14,
  },
  locationContainer: {
    marginBottom: 10,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  locationButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "500",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
  },
  locationText: {
    marginLeft: 8,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 10,
  },
  addImageText: {
    fontSize: 12,
    marginTop: 5,
  },
  imageContainer: {
    position: "relative",
    marginRight: 10,
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "white",
    borderRadius: 12,
  },
})

export default DonationFormScreen
