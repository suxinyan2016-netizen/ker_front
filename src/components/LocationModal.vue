<template>
  <view v-if="visible" class="modal-overlay" @click="closeModal">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">Update Location</text>
        <view class="close-btn" @click="closeModal">
          <text>✕</text>
        </view>
      </view>

      <view class="modal-body">
        <!-- Location Options -->
        <view class="form-section">
          <text class="section-label">Location Method</text>
          <view class="location-options">
            <button 
              class="location-btn"
              :class="{ active: useGPS }"
              @click="selectGPSMode"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <text>Use Current Location</text>
            </button>
            <button 
              class="location-btn"
              :class="{ active: !useGPS }"
              @click="selectZipCodeMode"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <text>Enter Zip Code</text>
            </button>
          </view>
        </view>

        <!-- Zipcode Input -->
        <view v-if="!useGPS" class="form-section">
          <text class="section-label">Zip Code</text>
          <input 
            v-model="zipCode" 
            class="input-field"
            placeholder="Enter zip code (e.g., 08540)"
            type="text"
            maxlength="10"
          />
        </view>

        <!-- GPS Status -->
        <view v-if="useGPS && locationStatus" class="location-status">
          <text :class="locationStatus.type">{{ locationStatus.message }}</text>
        </view>
      </view>

      <view class="modal-footer">
        <button 
          class="apply-btn"
          :disabled="!isValid || submitting"
          @click="submitLocation"
        >
          {{ submitting ? 'Updating...' : 'Update Location' }}
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
    },
    currentZipcode: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      useGPS: true,
      zipCode: '',
      submitting: false,
      locationStatus: null,
      currentLocation: null
    }
  },
  computed: {
    isValid() {
      if (this.useGPS) {
        return this.currentLocation !== null
      } else {
        return this.zipCode.length >= 5
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.zipCode = this.currentZipcode
        if (this.useGPS) {
          this.getCurrentLocation()
        }
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },

    selectGPSMode() {
      this.useGPS = true
      this.getCurrentLocation()
    },

    selectZipCodeMode() {
      this.useGPS = false
      this.zipCode = this.currentZipcode
      this.currentLocation = null
      this.locationStatus = null
    },

    async getCurrentLocation() {
      this.locationStatus = { type: 'info', message: 'Getting your location...' }

      try {
        const location = await apiClient.getCurrentLocation()
        this.currentLocation = location
        this.zipCode = '' // Clear zipcode when using GPS to avoid mismatch
        this.locationStatus = { type: 'success', message: 'Location acquired!' }
      } catch (error) {
        this.locationStatus = { type: 'error', message: 'Failed to get location. Please use zip code instead.' }
        this.useGPS = false
      }
    },

    async submitLocation() {
      if (!this.isValid || this.submitting) {
        return
      }

      // Validate zipcode
      if (!this.useGPS && this.zipCode && !/^\d{5}$/.test(this.zipCode)) {
        uni.showToast({
          title: 'Please enter a valid 5-digit zipcode',
          icon: 'none'
        })
        return
      }

      this.submitting = true

      try {
        const deviceToken = localStorageManager.getDeviceToken()

        const profileData = {
          deviceToken
        }

        if (this.useGPS && this.currentLocation) {
          profileData.latitude = this.currentLocation.lat
          profileData.longitude = this.currentLocation.lng
        } else if (this.zipCode) {
          profileData.zipCode = this.zipCode
        }

        await apiClient.createOrUpdateProfile(profileData)

        // Save to local storage
        localStorageManager.updateZipcode(this.zipCode)

        uni.showToast({
          title: 'Location updated!',
          icon: 'success'
        })

        this.$emit('update', {
          zipcode: this.zipCode,
          location: this.useGPS ? this.currentLocation : null
        })
        this.closeModal()
      } catch (error) {
        console.error('Failed to update location:', error)
        uni.showToast({
          title: 'Failed to update location',
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
  border-radius: 6px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
  position: relative;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: block;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 16px;
}

.form-section {
  margin-bottom: 16px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.location-options {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.location-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: white;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.location-btn.active {
  border-color: #1976D2;
  background-color: #e3f2fd;
  color: #1976D2;
}

.input-field {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.input-field:focus {
  border-color: #1976D2;
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

.modal-footer {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.apply-btn {
  width: 100%;
  padding: 5px;
  background-color: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.apply-btn:active {
  opacity: 0.8;
}
</style>
