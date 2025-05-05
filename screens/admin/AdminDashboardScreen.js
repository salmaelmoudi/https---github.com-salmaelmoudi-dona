"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { API_URL } from "../../config"
import DonationCard from "../../components/DonationCard"

const AdminDashboardScreen = ({ navigation }) => {
  const { authState, signOut } = useAuth()
  const { colors, isDarkMode } = useTheme()
  const [activeTab, setActiveTab] = useState("donations")
  const [donations, setDonations] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalUsers: 0,
    pendingDonations: 0,
    completedDonations: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch all data in parallel
      const [donationsRes, usersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/donations`),
        axios.get(`${API_URL}/admin/users`),
        axios.get(`${API_URL}/admin/stats`),
      ])

      setDonations(donationsRes.data)
      setUsers(usersRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      Alert.alert("Error", "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDonation = async (donationId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this donation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/donations/${donationId}`)

            // Update local state
            setDonations(donations.filter((donation) => donation.id !== donationId))

            // Update stats
            setStats({
              ...stats,
              totalDonations: stats.totalDonations - 1,
              pendingDonations:
                stats.pendingDonations - (donations.find((d) => d.id === donationId)?.status === "pending" ? 1 : 0),
              completedDonations:
                stats.completedDonations - (donations.find((d) => d.id === donationId)?.status === "completed" ? 1 : 0),
            })

            Alert.alert("Success", "Donation deleted successfully")
          } catch (error) {
            console.error("Error deleting donation:", error)
            Alert.alert("Error", "Failed to delete donation")
          }
        },
      },
    ])
  }

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this user? This will also delete all their donations.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/admin/users/${userId}`)

              // Update local state
              setUsers(users.filter((user) => user.id !== userId))

              // Update stats
              setStats({
                ...stats,
                totalUsers: stats.totalUsers - 1,
              })

              // Refresh donations as some might have been deleted
              const donationsRes = await axios.get(`${API_URL}/admin/donations`)
              setDonations(donationsRes.data)

              Alert.alert("Success", "User deleted successfully")
            } catch (error) {
              console.error("Error deleting user:", error)
              Alert.alert("Error", "Failed to delete user")
            }
          },
        },
      ],
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: colors.text }]}>Welcome, Admin</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>Dashboard Overview</Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.danger }]}
        onPress={() => {
          Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", onPress: signOut },
          ])
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  )

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.statValue}>{stats.totalDonations}</Text>
        <Text style={styles.statLabel}>Total Donations</Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.secondary }]}>
        <Text style={styles.statValue}>{stats.totalUsers}</Text>
        <Text style={styles.statLabel}>Total Users</Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.warning }]}>
        <Text style={styles.statValue}>{stats.pendingDonations}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.success }]}>
        <Text style={styles.statValue}>{stats.completedDonations}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
    </View>
  )

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "donations" && {
            borderBottomWidth: 2,
            borderBottomColor: colors.primary,
          },
        ]}
        onPress={() => setActiveTab("donations")}
      >
        <Text style={[styles.tabText, activeTab === "donations" && { color: colors.primary, fontWeight: "bold" }]}>
          Donations
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "users" && {
            borderBottomWidth: 2,
            borderBottomColor: colors.primary,
          },
        ]}
        onPress={() => setActiveTab("users")}
      >
        <Text style={[styles.tabText, activeTab === "users" && { color: colors.primary, fontWeight: "bold" }]}>
          Users
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderDonationsList = () => (
    <FlatList
      data={donations}
      renderItem={({ item }) => (
        <View style={styles.donationItem}>
          <DonationCard
            donation={item}
            onPress={() => navigation.navigate("DonationDetail", { donationId: item.id })}
          />
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.danger }]}
            onPress={() => handleDeleteDonation(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="gift-outline" size={60} color={colors.gray} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No donations found</Text>
        </View>
      }
    />
  )

  const renderUsersList = () => (
    <FlatList
      data={users}
      renderItem={({ item }) => (
        <View style={[styles.userCard, { backgroundColor: isDarkMode ? colors.accent : colors.white }]}>
          <View style={styles.userInfo}>
            <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.userInitial}>{item.name?.charAt(0) || "U"}</Text>
            </View>

            <View style={styles.userData}>
              <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.userEmail, { color: colors.gray }]}>{item.email}</Text>
              <View
                style={[
                  styles.userRoleBadge,
                  {
                    backgroundColor:
                      item.role === "donor"
                        ? colors.primary
                        : item.role === "receiver"
                          ? colors.secondary
                          : colors.warning,
                  },
                ]}
              >
                <Text style={styles.userRoleText}>
                  {item.role === "donor" ? "Donor" : item.role === "receiver" ? "Association" : "Admin"}
                </Text>
              </View>
            </View>
          </View>

          {item.role !== "admin" && (
            <TouchableOpacity
              style={[styles.deleteUserButton, { backgroundColor: colors.danger }]}
              onPress={() => handleDeleteUser(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      )}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color={colors.gray} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No users found</Text>
        </View>
      }
    />
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderHeader()}
        {renderStats()}
        {renderTabs()}

        <View style={styles.contentContainer}>
          {activeTab === "donations" ? renderDonationsList() : renderUsersList()}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  greeting: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "white",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  donationItem: {
    position: "relative",
    marginBottom: 15,
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  userCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  userInitial: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  userData: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 5,
  },
  userRoleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  userRoleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  deleteUserButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
})

export default AdminDashboardScreen
