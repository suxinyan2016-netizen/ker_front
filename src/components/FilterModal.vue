<template>
  <view v-if="visible" class="modal-overlay" @click="closeModal">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">Filter Events</text>
        <text class="modal-subtitle">Adjust your search criteria</text>
        <view class="close-btn" @click="closeModal">
          <text>✕</text>
        </view>
      </view>

      <view class="modal-body">
        <!-- Date Range Section -->
        <view class="form-section">
          <text class="section-label">Date Range: {{ localSelectedDays }} days</text>
          <slider
            class="range-slider"
            :value="localSelectedDays"
            :min="dateRangeOptions[0]"
            :max="dateRangeOptions[dateRangeOptions.length - 1]"
            :step="1"
            @change="onDateRangeChange"
            show-value
          />
          <view class="slider-labels">
            <text class="slider-label">{{ dateRangeOptions[0] }} days</text>
            <text class="slider-label">{{ dateRangeOptions[dateRangeOptions.length - 1] }} days</text>
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
              :class="{ selected: localSelectedAges.includes(age.value) }"
              @click="toggleAge(age.value)"
            >
              {{ age.label }}
            </view>
          </view>
        </view>

        <!-- Location Type Section -->
        <view class="form-section">
          <text class="section-label">Location Type</text>
          <view class="tag-selector">
            <view 
              class="tag-option"
              :class="{ selected: localSelectedLocationType === 'indoor' }"
              @click="selectLocationType('indoor')"
            >
              Indoor
            </view>
            <view 
              class="tag-option"
              :class="{ selected: localSelectedLocationType === 'outdoor' }"
              @click="selectLocationType('outdoor')"
            >
              Outdoor
            </view>
          </view>
        </view>

        <!-- Interests Section -->
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
              :class="{ selected: localSelectedInterests.includes(interest.value) }"
              @click="toggleInterest(interest.value)"
            >
              {{ interest.label }}
            </view>
          </view>
        </view>

        <!-- Radius Section -->
        <view class="form-section">
          <text class="section-label">Search Radius: {{ localSelectedRadius }} miles</text>
          <slider
            class="range-slider"
            :value="localSelectedRadius"
            :min="radiusOptions[0]"
            :max="radiusOptions[radiusOptions.length - 1]"
            :step="5"
            @change="onRadiusChange"
            show-value
          />
          <view class="slider-labels">
            <text class="slider-label">{{ radiusOptions[0] }} mi</text>
            <text class="slider-label">{{ radiusOptions[radiusOptions.length - 1] }} mi</text>
          </view>
        </view>
      </view>

      <view class="modal-footer">
        <button 
          class="reset-btn"
          @click="resetFilters"
        >
          Reset
        </button>
        <button 
          class="apply-btn"
          @click="applyFilters"
        >
          Apply Filters
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
    selectedAges: {
      type: Array,
      default: () => []
    },
    selectedInterests: {
      type: Array,
      default: () => []
    },
    selectedLocationType: {
      type: String,
      default: null
    },
    selectedRadius: {
      type: Number,
      default: 5
    },
    selectedDays: {
      type: Number,
      default: 10
    },
    subscribedTags: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      localSelectedAges: [],
      localSelectedLocationType: null,
      localSelectedRadius: 5,
      localSelectedDays: 10,
      localSelectedInterests: [],
      ageOptions: [],
      interestOptions: [],
      radiusOptions: [5, 15, 20, 25, 30],
      dateRangeOptions: [3, 5, 7, 10],
      loadingTags: false
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        // Use selectedAges from props if available, otherwise use subscribed age tags
        if (this.selectedAges && this.selectedAges.length > 0) {
          this.localSelectedAges = [...this.selectedAges]
        } else {
          const subscribedAges = this.subscribedTags
            .filter(tag => tag.tagCategory === 'age')
            .map(tag => tag.tagName)
          this.localSelectedAges = subscribedAges
        }

        this.localSelectedLocationType = this.selectedLocationType
        this.localSelectedRadius = this.selectedRadius
        this.localSelectedDays = this.selectedDays

        // Use selectedInterests from props if available, otherwise use subscribed interests
        if (this.selectedInterests && this.selectedInterests.length > 0) {
          this.localSelectedInterests = [...this.selectedInterests]
        } else {
          this.localSelectedInterests = this.subscribedTags
            .filter(tag => tag.tagCategory === 'eventtype')
            .map(tag => tag.tagName)
        }

        console.log('FilterModal - subscribedTags:', this.subscribedTags)
        console.log('FilterModal - localSelectedInterests:', this.localSelectedInterests)
        console.log('FilterModal - localSelectedAges:', this.localSelectedAges)

        this.loadTags()
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },

    toggleAge(age) {
      const index = this.localSelectedAges.indexOf(age)
      if (index > -1) {
        this.localSelectedAges.splice(index, 1)
      } else {
        this.localSelectedAges.push(age)
      }
    },

    async loadTags() {
      this.loadingTags = true
      try {
        const allTags = await apiClient.getTags()
        
        // Filter age tags
        this.ageOptions = allTags
          .filter(tag => tag.tagCategory === 'age')
          .map(tag => ({
            label: tag.tagName,
            value: tag.tagName
          }))
        
        // Filter interest tags
        this.interestOptions = allTags
          .filter(tag => tag.tagCategory === 'eventtype')
          .map(tag => ({
            label: tag.tagName,
            value: tag.tagName
          }))
      } catch (error) {
        console.error('Failed to load tags:', error)
        // Fallback to default options
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

    toggleInterest(interest) {
      const index = this.localSelectedInterests.indexOf(interest)
      if (index > -1) {
        this.localSelectedInterests.splice(index, 1)
      } else {
        this.localSelectedInterests.push(interest)
      }
    },

    selectLocationType(type) {
      if (this.localSelectedLocationType === type) {
        this.localSelectedLocationType = null
      } else {
        this.localSelectedLocationType = type
      }
    },

    selectRadius(radius) {
      this.localSelectedRadius = radius
    },

    selectDateRange(days) {
      this.localSelectedDays = days
    },

    onDateRangeChange(e) {
      this.localSelectedDays = e.detail.value
    },

    onRadiusChange(e) {
      this.localSelectedRadius = e.detail.value
    },

    resetFilters() {
      this.localSelectedAges = []
      this.localSelectedLocationType = null
      this.localSelectedRadius = 5
      this.localSelectedDays = 10
    },

    applyFilters() {
      this.$emit('apply', {
        ages: this.localSelectedAges,
        locationType: this.localSelectedLocationType,
        radius: this.localSelectedRadius,
        interests: this.localSelectedInterests,
        days: this.localSelectedDays
      })
      this.closeModal()
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
  margin-bottom: 4px;
}

.modal-subtitle {
  font-size: 13px;
  color: #666;
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

.range-slider {
  width: 100%;
  margin: 12px 0;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.slider-label {
  font-size: 12px;
  color: #666;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
}

.reset-btn {
  flex: 1;
  padding: 5px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.reset-btn:active {
  opacity: 0.8;
}

.apply-btn {
  flex: 2;
  padding: 5px;
  background-color: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.apply-btn:active {
  opacity: 0.8;
}
</style>
