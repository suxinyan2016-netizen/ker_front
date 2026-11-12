// Local Storage Manager for Privacy-First User Preferences
// COPPA Compliant - No personal data collection, all stored locally

const STORAGE_KEY = 'event_radar_preferences'
const DEFAULT_ZIPCODE = '08540' // Princeton
const DEFAULT_AGE_PREFERENCE = '3-5'

// Generate a secure random UUID for anonymous device token
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const localStorageManager = {
  // Get all user preferences
  getPreferences() {
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Error reading from storage:', e)
    }
    
    // Return defaults if nothing stored
    return this.getDefaultPreferences()
  },

  // Get default preferences
  getDefaultPreferences() {
    return {
      user_zipcode: DEFAULT_ZIPCODE,
      user_age_preference: DEFAULT_AGE_PREFERENCE,
      anonymous_device_token: generateUUID()
    }
  },

  // Save preferences to local storage
  savePreferences(preferences) {
    try {
      // Try to get current preferences without generating a new token
      let current
      try {
        const stored = uni.getStorageSync(STORAGE_KEY)
        if (stored) {
          current = JSON.parse(stored)
        }
      } catch (e) {
        console.error('Error reading from storage:', e)
      }
      
      // If no current preferences, use defaults but preserve passed token if provided
      if (!current) {
        current = {
          user_zipcode: DEFAULT_ZIPCODE,
          user_age_preference: DEFAULT_AGE_PREFERENCE
        }
      }
      
      // Merge with new preferences
      const updated = { ...current, ...preferences }
      
      // Only generate token if not provided and not in current
      if (!updated.anonymous_device_token && !current.anonymous_device_token) {
        updated.anonymous_device_token = generateUUID()
      }
      
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(updated))
      return updated
    } catch (e) {
      console.error('Error saving to storage:', e)
      return this.getPreferences()
    }
  },

  // Get specific preference
  getZipcode() {
    return this.getPreferences().user_zipcode
  },

  getAgePreference() {
    return this.getPreferences().user_age_preference
  },

  getDeviceToken() {
    return this.getPreferences().anonymous_device_token
  },

  // Update specific preference
  updateZipcode(zipcode) {
    return this.savePreferences({ user_zipcode: zipcode })
  },

  updateAgePreference(age) {
    return this.savePreferences({ user_age_preference: age })
  },

  // Clear all preferences (for testing/reset)
  clearPreferences() {
    try {
      uni.removeStorageSync(STORAGE_KEY)
    } catch (e) {
      console.error('Error clearing storage:', e)
    }
  }
}
