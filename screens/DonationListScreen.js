"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView, // Added ScrollView import
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { API_URL } from "../config"
import DonationCard from "../components/DonationCard"

const DonationListScreen = ({ navigation }) => {
  const { authState } = useAuth()
  const { colors } = useTheme()
  const [donations, setDonations] = useState([])
  const [filteredDonations, setFilteredDonations] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")

  const { userInfo } = authState
  const isReceiver = userInfo?.role === "receiver"

  useEffect(() => {
    fetchCategories()
    fetchDonations()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = donations.filter(
        (donation) =>
          donation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          donation.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredDonations(filtered)
    } else {
      filterByCategory(selectedCategory)
    }
  }, [searchQuery, donations])

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`)
      setCategories(response.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchDonations = async () => {
    setIsLoading(true)
    try {
      // If user is a donor, fetch only their donations
      const endpoint = userInfo.role === "donor" ? `${API_URL}/donations/user/${userInfo.id}` : `${API_URL}/donations`

      const response = await axios.get(endpoint)
      setDonations(response.data)
      setFilteredDonations(response.data)
    } catch (error) {
      console.error("Error fetching donations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchDonations()
    setRefreshing(false)
  }

  const filterByCategory = (categoryId) => {
    setSelectedCategory(categoryId)

    if (categoryId === "all") {
      setFilteredDonations(donations)
    } else {
      const filtered = donations.filter((donation) => donation.categoryId === categoryId)
      setFilteredDonations(filtered)
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.searchContainer, { backgroundColor: colors.lightGray }]}>
        <Ionicons name="search" size={20} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search donations..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.gray} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === "all" && { backgroundColor: colors.primary }]}
          onPress={() => filterByCategory("all")}
        >
          <Text style={[styles.categoryChipText, selectedCategory === "all" && { color: colors.white }]}>All</Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryChip, selectedCategory === category.id && { backgroundColor: colors.primary }]}
            onPress={() => filterByCategory(category.id)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === category.id && { color: colors.white }]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="gift-outline" size={60} color={colors.gray} />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        {userInfo.role === "donor" ? "You haven't posted any donations yet" : "No donations available"}
      </Text>
      {userInfo.role === "donor" && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("AddDonation")}
        >
          <Text style={styles.addButtonText}>Add Donation</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {renderCategories()}

      <FlatList
        data={filteredDonations}
        renderItem={({ item }) => (
          <DonationCard
            donation={item}
            onPress={() => navigation.navigate("DonationDetail", { donationId: item.id })}
            showStatus={userInfo.role === "donor"}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  categoriesScroll: {
    paddingBottom: 5,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 10,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    padding: 15,
    paddingTop: 5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
    textAlign: "center",
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default DonationListScreen
