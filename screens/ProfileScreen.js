"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import CustomInput from "../components/CustomInput"
import CustomButton from "../components/CustomButton"

const ProfileScreen = () => {
  const { authState, updateProfile, signOut } = useAuth()
  const { colors, isDarkMode } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: null,
    bio: "",
  })

  const { userInfo } = authState
  const isReceiver = userInfo?.role === "receiver"

  useEffect(() => {
    if (userInfo) {
      setProfileData({
        name: userInfo.name || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
        avatar: userInfo.avatar || null,
        bio: userInfo.bio || "",
      })
    }
  }, [userInfo])

  const handleChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value,
    })
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileData({
        ...profileData,
        avatar: result.assets[0].uri,
      })
    }
  }

  const handleSaveProfile = async () => {
    if (!profileData.name || !profileData.email || !profileData.phone) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      // Create form data for image upload
      const formData = new FormData()
      formData.append("name", profileData.name)
      formData.append("email", profileData.email)
      formData.append("phone", profileData.phone)
      formData.append("bio", profileData.bio || "")

      // Append avatar if changed
      if (profileData.avatar && profileData.avatar !== userInfo.avatar) {
        const imageName = profileData.avatar.split("/").pop()
        const imageType = "image/" + (imageName.split(".").pop() === "png" ? "png" : "jpeg")

        formData.append("avatar", {
          uri: profileData.avatar,
          name: imageName,
          type: imageType,
        })
      }

      const result = await updateProfile(formData)

      if (result.success) {
        Alert.alert("Success", "Profile updated successfully")
        setIsEditing(false)
      } else {
        Alert.alert("Error", result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert("Error", "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: signOut },
    ])
  }

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        {isEditing ? (
          <TouchableOpacity onPress={pickImage}>
            {profileData.avatar ? (
              <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{profileData.name?.charAt(0) || userInfo?.name?.charAt(0) || "U"}</Text>
              </View>
            )}
            <View style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
        ) : (
          <>
            {userInfo?.avatar ? (
              <Image source={{ uri: userInfo.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{userInfo?.name?.charAt(0) || "U"}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {!isEditing && (
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{userInfo?.name}</Text>
          <Text style={[styles.userRole, { color: colors.primary }]}>
            {userInfo?.role === "donor" ? "Donor" : "Association"}
          </Text>
          {userInfo?.bio && <Text style={[styles.userBio, { color: colors.gray }]}>{userInfo.bio}</Text>}
        </View>
      )}
    </View>
  )

  const renderProfileForm = () => (
    <View style={styles.formContainer}>
      <CustomInput
        placeholder="Full Name"
        value={profileData.name}
        onChangeText={(text) => handleChange("name", text)}
        iconName="person-outline"
        editable={isEditing}
      />

      <CustomInput
        placeholder="Email"
        value={profileData.email}
        onChangeText={(text) => handleChange("email", text)}
        keyboardType="email-address"
        autoCapitalize="none"
        iconName="mail-outline"
        editable={isEditing}
      />

      <CustomInput
        placeholder="Phone Number"
        value={profileData.phone}
        onChangeText={(text) => handleChange("phone", text)}
        keyboardType="phone-pad"
        iconName="call-outline"
        editable={isEditing}
      />

      <CustomInput
        placeholder="Bio"
        value={profileData.bio}
        onChangeText={(text) => handleChange("bio", text)}
        multiline
        numberOfLines={4}
        style={styles.textArea}
        iconName="information-circle-outline"
        editable={isEditing}
      />

      {isEditing && (
        <View style={styles.actionButtons}>
          <CustomButton
            title="Cancel"
            type="outline"
            onPress={() => {
              setIsEditing(false)
              // Reset form data to original values
              setProfileData({
                name: userInfo.name || "",
                email: userInfo.email || "",
                phone: userInfo.phone || "",
                avatar: userInfo.avatar || null,
                bio: userInfo.bio || "",
              })
            }}
            style={{ flex: 1, marginRight: 10 }}
          />

          <CustomButton
            title={isLoading ? <ActivityIndicator color="white" /> : "Save"}
            onPress={handleSaveProfile}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  )

  const renderProfileActions = () => (
    <View style={styles.profileActions}>
      {!isEditing && <CustomButton title="Edit Profile" onPress={() => setIsEditing(true)} icon="pencil-outline" />}

      <View style={[styles.menuItem, { borderColor: colors.border }]}>
        <Ionicons name="notifications-outline" size={24} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
      </View>

      {isReceiver && (
        <View style={[styles.menuItem, { borderColor: colors.border }]}>
          <Ionicons name="heart-outline" size={24} color={colors.text} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>Donation Preferences</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </View>
      )}

      <View style={[styles.menuItem, { borderColor: colors.border }]}>
        <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy & Security</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
      </View>

      <View style={[styles.menuItem, { borderColor: colors.border }]}>
        <Ionicons name="help-circle-outline" size={24} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Help & Support</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray} />
      </View>

      <TouchableOpacity style={[styles.menuItem, { borderColor: colors.border }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={colors.danger} />
        <Text style={[styles.menuItemText, { color: colors.danger }]}>Logout</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderProfileHeader()}
        {renderProfileForm()}
        {!isEditing && renderProfileActions()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  userBio: {
    fontSize: 14,
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 30,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 10,
  },
  profileActions: {
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
})

export default ProfileScreen
