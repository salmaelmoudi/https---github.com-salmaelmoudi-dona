"use client"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { AuthProvider, useAuth } from "./context/AuthContext"

// Screens
import LoginScreen from "./screens/auth/LoginScreen"
import RegisterScreen from "./screens/auth/RegisterScreen"
import HomeScreen from "./screens/HomeScreen"
import DonationFormScreen from "./screens/donor/DonationFormScreen"
import DonationListScreen from "./screens/DonationListScreen"
import DonationDetailScreen from "./screens/DonationDetailScreen"
import ProfileScreen from "./screens/ProfileScreen"
import AdminDashboardScreen from "./screens/admin/AdminDashboardScreen"
import SplashScreen from "./screens/SplashScreen"

// Theme
import { ThemeProvider } from "./context/ThemeContext"
import { COLORS } from "./constants/theme"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

const DonationStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DonationList" component={DonationListScreen} options={{ title: "Donations" }} />
      <Stack.Screen name="DonationDetail" component={DonationDetailScreen} options={{ title: "Donation Details" }} />
    </Stack.Navigator>
  )
}

const DonorTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Donations") {
            iconName = focused ? "gift" : "gift-outline"
          } else if (route.name === "AddDonation") {
            iconName = focused ? "add-circle" : "add-circle-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "gray",
        headerShown: route.name === "Home" ? true : false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Donations" component={DonationStack} />
      <Tab.Screen name="AddDonation" component={DonationFormScreen} options={{ title: "Add Donation" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const ReceiverTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Donations") {
            iconName = focused ? "gift" : "gift-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "gray",
        headerShown: route.name === "Home" ? true : false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Donations" component={DonationStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const AdminStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: "Admin Dashboard" }} />
      <Stack.Screen name="DonationDetail" component={DonationDetailScreen} options={{ title: "Donation Details" }} />
    </Stack.Navigator>
  )
}

const AppNavigator = () => {
  const { authState, isLoading } = useAuth()

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <NavigationContainer>
      {!authState.authenticated ? (
        <AuthStack />
      ) : (
        <>
          {authState.userInfo.role === "admin" ? (
            <AdminStack />
          ) : authState.userInfo.role === "donor" ? (
            <DonorTabs />
          ) : (
            <ReceiverTabs />
          )}
        </>
      )}
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  )
}
