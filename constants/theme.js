export const COLORS = {
  primary: "#0B6E4F", // Darker green as requested
  secondary: "#08A045",
  accent: "#25CE7B",
  background: "#F8F9FA",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#6C757D",
  lightGray: "#E9ECEF",
  danger: "#DC3545",
  warning: "#FFC107",
  success: "#28A745",
  text: "#212529",
  border: "#DEE2E6",
}

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  xxl: 32,
  xxxl: 40,
}

export const FONTS = {
  bold: "Poppins-Bold",
  semiBold: "Poppins-SemiBold",
  medium: "Poppins-Medium",
  regular: "Poppins-Regular",
  light: "Poppins-Light",
}

export const SHADOWS = {
  light: {
    shadowColor: COLORS.gray,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medium: {
    shadowColor: COLORS.gray,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
  },
  dark: {
    shadowColor: COLORS.gray,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.41,
    shadowRadius: 9.11,
    elevation: 14,
  },
}
