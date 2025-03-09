import { jwtDecode } from "jwt-decode"

interface DecodedToken {
  exp: number
  // Add other properties from your JWT payload here
}

export const setToken = (token: string) => {
  // Set token in both cookie and localStorage for redundancy
  document.cookie = `authToken=${token}; path=/; max-age=86400` // 24 hours
  localStorage.setItem("authToken", token)
}

export const getToken = (): string | null => {
  // Try to get token from cookie first
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1]

  // Fallback to localStorage if cookie not found
  return cookieToken || localStorage.getItem("authToken")
}

export const removeToken = () => {
  // Remove from both cookie and localStorage
  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  localStorage.removeItem("authToken")
}

export const isTokenValid = (): boolean => {
  const token = getToken()
  if (!token) return false

  try {
    const decodedToken = jwtDecode<DecodedToken>(token)
    return decodedToken.exp * 1000 > Date.now()
  } catch (error) {
    console.error("Error decoding token:", error)
    return false
  }
}

export const refreshToken = async (): Promise<string | null> => {
  // Since we're removing the refresh URL, we'll need to handle token refresh differently
  // For now, we'll just return null to indicate that refresh failed
  console.warn("Token refresh functionality has been removed")
  return null
}

