"use client"

import { createContext, useContext, useState } from "react"
import { COLORS } from "../constants/theme"

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const theme = {
    colors: {
      ...COLORS,
      background: isDarkMode ? "#121212" : COLORS.background,
      text: isDarkMode ? COLORS.white : COLORS.text,
      card: isDarkMode ? "#1E1E1E" : COLORS.white,
    },
    isDarkMode,
    toggleTheme: () => setIsDarkMode((prev) => !prev),
  }

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
