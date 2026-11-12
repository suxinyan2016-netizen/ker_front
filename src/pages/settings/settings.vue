<template>
  <view class="settings-page">
    <view class="settings-container">
      <view class="settings-form">
        <!-- Zipcode Setting -->
        <view class="form-group">
          <text class="form-label">Your Zipcode</text>
          <input 
            v-model="zipcode"
            class="form-input"
            type="text"
            placeholder="Enter zipcode (e.g., 08540)"
            maxlength="5"
          />
          <text class="form-hint">Events will be shown near this location</text>
        </view>

        <!-- Age Group Setting -->
        <view class="form-group">
          <text class="form-label">Age Group</text>
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
          <text class="form-hint">Events will be filtered by age appropriateness</text>
        </view>

        <!-- Interest Tags Section -->
        <view class="form-group">
          <text class="form-label">Interests</text>
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
          <text class="form-hint">Select interests to personalize your feed</text>
        </view>

        <!-- Device Token Info -->
        <view class="info-group">
          <text class="info-label">Anonymous Device ID</text>
          <text class="info-value">{{ deviceToken }}</text>
          <text class="info-hint">This anonymous ID is used for push notifications. No personal data is collected.</text>
        </view>

        <!-- Save Button -->
        <button 
          class="save-btn"
          :class="{ disabled: !hasChanges }"
          :disabled="!hasChanges"
          @click="saveSettings"
        >
          {{ saving ? 'Saving...' : 'Save Settings' }}
        </button>
      </view>

      <!-- Privacy Notice -->
      <view class="privacy-notice">
        <text class="privacy-title">🔒 Privacy First</text>
        <text class="privacy-text">Your preferences are stored locally on your device. We don't collect personal information or require account registration. COPPA compliant.</text>
      </view>
    </view>
  </view>
</template>

<script>
import { localStorageManager } from '@/utils/localStorage.js'
import { apiClient } from '@/api/client.js'

export default {
  data() {
    return {
      zipcode: '',
      selectedAges: [],
      selectedInterests: [],
      deviceToken: '',
      originalZipcode: '',
      originalAges: [],
      originalInterests: [],
      ageOptions: [],
      interestOptions: [],
      loadingTags: false,
      saving: false
    }
  },
  computed: {
    hasChanges() {
      return this.zipcode !== this.originalZipcode ||
             JSON.stringify(this.selectedAges) !== JSON.stringify(this.originalAges) ||
             JSON.stringify(this.selectedInterests) !== JSON.stringify(this.originalInterests)
    }
  },
  onLoad() {
    this.loadPreferences()
    this.loadTags()
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

    loadPreferences() {
      const preferences = localStorageManager.getPreferences()
      this.zipcode = preferences.user_zipcode
      this.deviceToken = preferences.anonymous_device_token

      // Load subscribed tags
      const subscribedTags = preferences.subscribed_tags || []
      this.selectedAges = subscribedTags
        .filter(tag => tag.tagCategory === 'age')
        .map(tag => tag.tagName)
      this.selectedInterests = subscribedTags
        .filter(tag => tag.tagCategory === 'eventtype')
        .map(tag => tag.tagName)

      this.originalZipcode = preferences.user_zipcode
      this.originalAges = [...this.selectedAges]
      this.originalInterests = [...this.selectedInterests]
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

    async saveSettings() {
      if (!this.hasChanges || this.saving) {
        return
      }

      // Validate zipcode
      if (this.zipcode && !/^\d{5}$/.test(this.zipcode)) {
        uni.showToast({
          title: 'Please enter a valid 5-digit zipcode',
          icon: 'none'
        })
        return
      }

      this.saving = true

      try {
        const deviceToken = localStorageManager.getDeviceToken()

        const profileData = {
          deviceToken,
          tags: [
            ...this.selectedAges.map(age => ({ tagName: age, tagCategory: 'age' })),
            ...this.selectedInterests.map(interest => ({ tagName: interest, tagCategory: 'eventtype' }))
          ],
          zipCode: this.zipcode
        }

        await apiClient.createOrUpdateProfile(profileData)

        // Save to local storage
        localStorageManager.updateZipcode(this.zipcode)

        // Update original values
        this.originalZipcode = this.zipcode
        this.originalAges = [...this.selectedAges]
        this.originalInterests = [...this.selectedInterests]

        uni.showToast({
          title: 'Settings saved successfully',
          icon: 'success'
        })
      } catch (error) {
        console.error('Failed to save settings:', error)
        uni.showToast({
          title: 'Failed to save settings',
          icon: 'none'
        })
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 16px;
}

.settings-container {
  max-width: 600px;
  margin: 0 auto;
}

.settings-form {
  background-color: white;
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #1976D2;
  outline: none;
}

.form-hint {
  font-size: 12px;
  color: #666;
  display: block;
  margin-top: 6px;
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
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-option.selected {
  border-color: #1976D2;
  background-color: #1976D2;
  color: white;
}

.info-group {
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.info-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.info-value {
  font-size: 13px;
  color: #333;
  font-family: monospace;
  display: block;
  margin-bottom: 8px;
  word-break: break-all;
}

.info-hint {
  font-size: 12px;
  color: #999;
  display: block;
}

.save-btn {
  width: 100%;
  padding: 12px;
  background-color: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:active {
  opacity: 0.8;
}

.save-btn.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.privacy-notice {
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  text-align: center;
}

.privacy-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.privacy-text {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  display: block;
}
</style>
