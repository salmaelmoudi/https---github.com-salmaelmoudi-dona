"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { API_URL } from "../config"
import DonationCard from "../components/DonationCard"
import CategoryButton from "../components/CategoryButton"

const HomeScreen = ({ navigation }) => {
  const { authState } = useAuth()
  const { colors, isDarkMode, toggleTheme } = useTheme()
  const [donations, setDonations] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { userInfo } = authState
  const isReceiver = userInfo?.role === "receiver"
  const isDonor = userInfo?.role === "donor"

  useEffect(() => {
    fetchCategories()
    fetchDonations()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`)
      setCategories(response.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchDonations = async (category = "all") => {
    setIsLoading(true)
    try {
      const endpoint = category === "all" ? `${API_URL}/donations` : `${API_URL}/donations/category/${category}`

      const response = await axios.get(endpoint)
      setDonations(response.data)
    } catch (error) {
      console.error("Error fetching donations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    fetchDonations(category)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchDonations(selectedCategory)
    setRefreshing(false)
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <Text style={[styles.greeting, { color: colors.text }]}>Hello, {userInfo?.name || "User"}</Text>
        <Text style={[styles.userRole, { color: colors.primary }]}>
          {userInfo?.role === "donor" ? "Donor" : "Association"}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: isDarkMode ? colors.primary : colors.lightGray }]}
        onPress={toggleTheme}
      >
        <Ionicons
          name={isDarkMode ? "sunny-outline" : "moon-outline"}
          size={20}
          color={isDarkMode ? colors.white : colors.primary}
        />
      </TouchableOpacity>
    </View>
  )

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image source={require("../assets/empty-box.png")} style={styles.emptyImage} resizeMode="contain" />
      <Text style={[styles.emptyText, { color: colors.text }]}>No donations found</Text>
      <Text style={[styles.emptySubtext, { color: colors.gray }]}>
        {isDonor ? "Be the first to donate in this category!" : "Check back later for new donations"}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}

      <View style={styles.bannerContainer}>
        <Image source={require("../assets/banner.png")} style={styles.banner} resizeMode="cover" />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>Make a Difference Today</Text>
          <Text style={styles.bannerSubtitle}>
            {isDonor ? "Your donations can change lives" : "Find the resources you need"}
          </Text>
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <CategoryButton
            title="All"
            isSelected={selectedCategory === "all"}
            onPress={() => handleCategorySelect("all")}
            icon="grid-outline"
          />
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              title={category.name}
              isSelected={selectedCategory === category.id}
              onPress={() => handleCategorySelect(category.id)}
              icon={category.icon || "cube-outline"}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.donationsContainer}>
        <View style={styles.donationHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isReceiver ? "Available Donations" : "Recent Donations"}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Donations")}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={donations}
          renderItem={({ item }) => (
            <DonationCard
              donation={item}
              onPress={() => navigation.navigate("DonationDetail", { donationId: item.id })}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.donationsList}
          ListEmptyComponent={renderEmptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
  },
  userRole: {
    fontSize: 20,
    fontWeight: "bold",
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerContainer: {
    height: 180,
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 15,
    overflow: "hidden",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  bannerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bannerSubtitle: {
    color: "white",
    fontSize: 16,
  },
  categoriesContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoriesScroll: {
    paddingBottom: 10,
  },
  donationsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  donationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  donationsList: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
})

export default HomeScreen
