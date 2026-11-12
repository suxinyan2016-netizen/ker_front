<template>
  <view v-if="visible" class="modal-overlay" @click="closeModal">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">Welcome to Event Radar!</text>
        <text class="modal-subtitle">Tell us about your preferences</text>
        <view class="close-btn" @click="closeModal">
          <text>✕</text>
        </view>
      </view>

      <view class="modal-body">
        <!-- Location Section -->
        <view class="form-section">
          <text class="section-label">Location</text>
          <view class="location-options">
            <button 
              class="location-btn"
              :class="{ active: useGPS }"
              @click="useGPS = true"
            >
              📍 Use Current Location
            </button>
            <button 
              class="location-btn"
              :class="{ active: !useGPS }"
              @click="useGPS = false"
            >
              📮 Enter Zip Code
            </button>
          </view>

          <view v-if="!useGPS" class="zipcode-input">
            <input 
              v-model="zipCode" 
              class="input-field"
              placeholder="Enter zip code (e.g., 08540)"
              type="text"
              maxlength="10"
            />
          </view>

          <view v-if="useGPS && locationStatus" class="location-status">
            <text :class="locationStatus.type">{{ locationStatus.message }}</text>
          </view>
        </view>

        <!-- Age Group Section -->
        <view class="form-section">
          <text class="section-label">Age Group</text>
          <view v-if="loadingTags" class="loading-tags">
            <text>Loading tags...</text>
          </view>
          <view v-else class="tag-selector">
            <view 
              v-for="age in ageOptions" 
              :key="age.value"
              class="tag-option"
              :class="{ selected: selectedAges.includes(age.value) }"
              @click="toggleAge(age.value)"
            >
              {{ age.label }}
            </view>
          </view>
        </view>

        <!-- Interest Tags Section -->
        <view class="form-section">
          <text class="section-label">Interests</text>
          <view v-if="loadingTags" class="loading-tags">
            <text>Loading tags...</text>
          </view>
          <view v-else class="tag-selector">
            <view 
              v-for="interest in interestOptions" 
              :key="interest.value"
              class="tag-option"
              :class="{ selected: selectedInterests.includes(interest.value) }"
              @click="toggleInterest(interest.value)"
            >
              {{ interest.label }}
            </view>
          </view>
        </view>
      </view>

      <view class="modal-footer">
        <button 
          class="submit-btn"
          :disabled="!isValid || submitting"
          @click="submitSubscription"
        >
          {{ submitting ? 'Saving...' : 'Get Started' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { apiClient } from '@/api/client.js'
import { localStorageManager } from '@/utils/localStorage.js'

export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      useGPS: true,
      zipCode: '',
      selectedAges: [],
      selectedInterests: [],
      submitting: false,
      locationStatus: null,
      ageOptions: [],
      interestOptions: [],
      loadingTags: false
    }
  },
  computed: {
    isValid() {
      if (this.useGPS) {
        return this.selectedAges.length > 0 && this.selectedInterests.length > 0
      } else {
        return this.zipCode.length >= 5 && 
               this.selectedAges.length > 0 && 
               this.selectedInterests.length > 0
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadTags()
        if (this.useGPS) {
          this.getCurrentLocation()
        }
      }
    }
  },
  methods: {
    async loadTags() {
      this.loadingTags = true
      try {
        const allTags = await apiClient.getTags()
        
        // Separate tags by category
        this.ageOptions = allTags
          .filter(tag => tag.tagCategory === 'age')
          .map(tag => ({
            label: tag.tagName,
            value: tag.tagName
          }))
        
        this.interestOptions = allTags
          .filter(tag => tag.tagCategory === 'eventtype')
          .map(tag => ({
            label: tag.tagName,
            value: tag.tagName
          }))
      } catch (error) {
        console.error('Failed to load tags:', error)
        // Fallback to default options if API fails
        this.ageOptions = [
          { label: 'kid', value: 'kid' },
          { label: 'teens', value: 'teens' },
          { label: 'adult', value: 'adult' }
        ]
        this.interestOptions = [
          { label: 'storytime', value: 'storytime' },
          { label: 'sports', value: 'sports' }
        ]
      } finally {
        this.loadingTags = false
      }
    },

    closeModal() {
      this.$emit('close')
    },

    toggleAge(age) {
      const index = this.selectedAges.indexOf(age)
      if (index > -1) {
        this.selectedAges.splice(index, 1)
      } else {
        this.selectedAges.push(age)
      }
    },

    toggleInterest(interest) {
      const index = this.selectedInterests.indexOf(interest)
      if (index > -1) {
        this.selectedInterests.splice(index, 1)
      } else {
        this.selectedInterests.push(interest)
      }
    },

    async getCurrentLocation() {
      this.locationStatus = { type: 'info', message: 'Getting your location...' }
      
      try {
        const location = await apiClient.getCurrentLocation()
        this.currentLocation = location
        this.locationStatus = { type: 'success', message: 'Location acquired!' }
      } catch (error) {
        this.locationStatus = { type: 'error', message: 'Failed to get location. Please use zip code instead.' }
        this.useGPS = false
      }
    },

    async submitSubscription() {
      this.submitting = true
      
      try {
        const deviceToken = localStorageManager.getDeviceToken()
        
        const profileData = {
          deviceToken,
          tags: [
            ...this.selectedAges.map(age => ({ tagName: age, tagCategory: 'age' })),
            ...this.selectedInterests.map(interest => ({ tagName: interest, tagCategory: 'eventtype' }))
          ]
        }

        if (this.useGPS && this.currentLocation) {
          profileData.latitude = this.currentLocation.lat
          profileData.longitude = this.currentLocation.lng
        } else if (this.zipCode) {
          profileData.zipCode = this.zipCode
        }

        await apiClient.createOrUpdateProfile(profileData)
        
        // Save to local storage as well, preserving device token
        const currentPrefs = localStorageManager.getPreferences()
        localStorageManager.savePreferences({
          anonymous_device_token: currentPrefs.anonymous_device_token,
          user_zipcode: this.zipCode || '08540',
          user_age_preference: this.selectedAges[0] || '3-5'
        })

        uni.showToast({
          title: 'Preferences saved!',
          icon: 'success'
        })

        this.$emit('success')
        this.closeModal()
      } catch (error) {
        console.error('Failed to save subscription:', error)
        uni.showToast({
          title: 'Failed to save. Please try again.',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
  position: relative;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.modal-subtitle {
  font-size: 14px;
  color: #666;
  display: block;
}

.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 8px;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 12px;
}

.location-options {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.location-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.location-btn.active {
  border-color: #4CAF50;
  background-color: #E8F5E9;
  color: #4CAF50;
}

.zipcode-input {
  margin-top: 12px;
}

.input-field {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

.input-field:focus {
  border-color: #4CAF50;
  outline: none;
}

.location-status {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.location-status .info {
  color: #1976D2;
  background-color: #E3F2FD;
}

.location-status .success {
  color: #388E3C;
  background-color: #E8F5E9;
}

.location-status .error {
  color: #D32F2F;
  background-color: #FFEBEE;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loading-tags {
  padding: 12px;
  color: #999;
  font-size: 14px;
}

.tag-option {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background-color: white;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-option.selected {
  border-color: #4CAF50;
  background-color: #4CAF50;
  color: white;
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid #e0e0e0;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn:active {
  opacity: 0.8;
}
</style>
