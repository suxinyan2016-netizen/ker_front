// API Client for Event Radar Backend
import { localStorageManager } from '@/utils/localStorage.js'

const API_BASE_URL = 'http://localhost:8080/api'

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, { ...defaultOptions, ...options })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // GET /api/events with automatic blind-filtering
  async getEvents(params = {}) {
    const preferences = localStorageManager.getPreferences()
    
    // Build query parameters with automatic filtering from local storage
    const queryParams = {}
    
    // Use provided params or fall back to local storage
    if (params.lng !== undefined) {
      queryParams.lng = params.lng.toString()
    }
    if (params.lat !== undefined) {
      queryParams.lat = params.lat.toString()
    }
    if (params.radius !== undefined) {
      queryParams.radius = params.radius.toString()
    } else {
      queryParams.radius = '5' // Default 5 miles
    }
    // Note: age parameter is not supported by backend, removed
    if (params.indoor !== undefined) {
      // indoor should be string "Indoor" or "Outdoor" (case-sensitive)
      queryParams.indoor = params.indoor
    }
    if (params.tag_id !== undefined) {
      // tag_id can be comma-separated (e.g., "1,2,3")
      queryParams.tag_id = params.tag_id
    }
    if (params.startdate !== undefined) {
      queryParams.startdate = params.startdate
    }
    if (params.enddate !== undefined) {
      queryParams.enddate = params.enddate
    }
    if (params.title !== undefined) {
      queryParams.title = params.title
    }
    if (params.limit !== undefined) {
      queryParams.limit = params.limit.toString()
    } else {
      queryParams.limit = '50' // Default 50
    }

    const queryString = new URLSearchParams(queryParams).toString()
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`
    
    console.log('API Request - Endpoint:', endpoint)
    console.log('API Request - Query Params:', queryParams)
    
    return this.request(endpoint)
  }

  // POST /api/notifications/sync - silent sync of anonymous preferences
  async syncNotifications() {
    const preferences = localStorageManager.getPreferences()
    
    await this.request('/notifications/sync', {
      method: 'POST',
      body: JSON.stringify({
        anonymous_device_token: preferences.anonymous_device_token,
        age_preference: preferences.user_age_preference,
        zipcode: preferences.user_zipcode
      })
    })
  }

  // Get user's current location (using uni-app's geolocation)
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      uni.getLocation({
        type: 'wgs84',
        success: (res) => {
          resolve({
            lat: res.latitude,
            lng: res.longitude
          })
        },
        fail: (err) => {
          console.error('Geolocation failed:', err)
          // Return default coordinates for Princeton if geolocation fails
          resolve({
            lat: 40.3478,
            lng: -74.6589
          })
        }
      })
    })
  }

  // Convert zipcode to coordinates (simplified - uses hardcoded common zipcodes)
  // In production, this should call a geocoding API
  zipcodeToCoordinates(zipcode) {
    const zipcodeMap = {
      '08540': { lat: 40.3478, lng: -74.6589 }, // Princeton
      '08550': { lat: 40.3231, lng: -74.6236 }, // West Windsor
      '08542': { lat: 40.3556, lng: -74.5900 }, // Princeton Junction
      '08544': { lat: 40.3478, lng: -74.6589 }, // Princeton University
      '08536': { lat: 40.3450, lng: -74.5800 }, // Plainsboro
    }
    
    // Return coordinates if found, otherwise default to Princeton
    return zipcodeMap[zipcode] || { lat: 40.3478, lng: -74.6589 }
  }

  // Anonymous Profile APIs
  async checkProfileExists(deviceToken) {
    return this.request(`/anonymous-profiles/${deviceToken}/exists`)
  }

  async getProfile(deviceToken) {
    return this.request(`/anonymous-profiles/${deviceToken}`)
  }

  async createOrUpdateProfile(profileData) {
    return this.request('/anonymous-profiles', {
      method: 'POST',
      body: JSON.stringify(profileData)
    })
  }

  // Tags API
  async getTags(category = null) {
    const params = category ? `?category=${category}` : ''
    return this.request(`/tags${params}`)
  }
}

export const apiClient = new ApiClient()
