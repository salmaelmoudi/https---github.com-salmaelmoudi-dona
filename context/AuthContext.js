"use client"

import { useState } from "react"

import { createContext, useContext, useReducer, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { API_URL } from "../config"

// Initial state
const initialState = {
  authenticated: false,
  userInfo: null,
  token: null,
  error: null,
}

// Create context
const AuthContext = createContext()

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case "SIGN_IN":
      return {
        ...state,
        authenticated: true,
        userInfo: action.payload.user,
        token: action.payload.token,
        error: null,
      }
    case "SIGN_OUT":
      return {
        ...initialState,
      }
    case "AUTH_ERROR":
      return {
        ...state,
        error: action.payload,
      }
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      }
    case "UPDATE_USER":
      return {
        ...state,
        userInfo: { ...state.userInfo, ...action.payload },
      }
    default:
      return state
  }
}

// Provider component
export const AuthProvider = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token")
        const userInfo = await AsyncStorage.getItem("userInfo")

        if (token && userInfo) {
          // Set auth header for all requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

          dispatch({
            type: "SIGN_IN",
            payload: {
              token,
              user: JSON.parse(userInfo),
            },
          })
        }
      } catch (error) {
        console.log("Error loading auth token", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadToken()
  }, [])

  // Sign in action
  const signIn = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      })

      const { token, user } = response.data

      // Save to storage
      await AsyncStorage.setItem("token", token)
      await AsyncStorage.setItem("userInfo", JSON.stringify(user))

      // Set auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      dispatch({
        type: "SIGN_IN",
        payload: { token, user },
      })

      return { success: true }
    } catch (error) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.response?.data?.message || "Login failed",
      })
      return { success: false, error: error.response?.data?.message || "Login failed" }
    }
  }

  // Sign up action
  const signUp = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData)

      const { token, user } = response.data

      // Save to storage
      await AsyncStorage.setItem("token", token)
      await AsyncStorage.setItem("userInfo", JSON.stringify(user))

      // Set auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      dispatch({
        type: "SIGN_IN",
        payload: { token, user },
      })

      return { success: true }
    } catch (error) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.response?.data?.message || "Registration failed",
      })
      return { success: false, error: error.response?.data?.message || "Registration failed" }
    }
  }

  // Sign out action
  const signOut = async () => {
    try {
      // Remove from storage
      await AsyncStorage.removeItem("token")
      await AsyncStorage.removeItem("userInfo")

      // Remove auth header
      delete axios.defaults.headers.common["Authorization"]

      dispatch({ type: "SIGN_OUT" })
    } catch (error) {
      console.log("Error signing out", error)
    }
  }

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await axios.put(`${API_URL}/users/profile`, userData)

      const updatedUser = response.data

      // Update storage
      await AsyncStorage.setItem("userInfo", JSON.stringify(updatedUser))

      dispatch({
        type: "UPDATE_USER",
        payload: updatedUser,
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update profile",
      }
    }
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  return (
    <AuthContext.Provider
      value={{
        authState,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
