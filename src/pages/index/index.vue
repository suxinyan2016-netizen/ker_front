<template>
  <view class="event-radar">
    <!-- Subscription Modal -->
    <SubscriptionModal
      :visible="showSubscriptionModal"
      @close="showSubscriptionModal = false"
      @success="onSubscriptionSuccess"
    />

    <!-- Filter Modal (Mobile only) -->
    <FilterModal
      :visible="showFilterModal"
      :selectedAges="selectedAges"
      :selectedInterests="selectedInterests"
      :selectedLocationType="selectedLocationType"
      :selectedRadius="selectedRadius"
      :selectedDays="selectedDays"
      :subscribedTags="selectedTags"
      @close="showFilterModal = false"
      @apply="onFilterApply"
    />

    <!-- Sort Modal -->
    <SortModal
      :visible="showSortModal"
      :selectedSort="selectedSort"
      @close="showSortModal = false"
      @apply="onSortApply"
    />

    <!-- Location Modal -->
    <LocationModal
      :visible="showLocationModal"
      :currentZipcode="currentZipcode"
      @close="showLocationModal = false"
      @update="onLocationUpdate"
    />

    <!-- Main Content Container -->
    <view class="main-container">
      <!-- Left Sidebar - Filter (Desktop only) -->
      <view class="filter-sidebar">
        <view class="sidebar-header">
          <text class="sidebar-title">Filters</text>
        </view>

        <view class="sidebar-section">
          <text class="sidebar-label">Age Group</text>
          <view class="sidebar-tags">
            <view
              v-for="age in ageOptions"
              :key="age.value"
              class="sidebar-tag"
              :class="{ selected: selectedAges.includes(age.value) }"
              @click="toggleAgeFilter(age.value)"
            >
              {{ age.label }}
            </view>
          </view>
        </view>

        <view class="sidebar-section">
          <text class="sidebar-label">Interests</text>
          <view class="sidebar-tags">
            <view
              v-for="interest in interestOptions"
              :key="interest.value"
              class="sidebar-tag"
              :class="{ selected: selectedInterests.includes(interest.value) }"
              @click="toggleInterestFilter(interest.value)"
            >
              {{ interest.label }}
            </view>
          </view>
        </view>

        <view class="sidebar-section">
          <text class="sidebar-label">Location Type</text>
          <view class="sidebar-tags">
            <view
              class="sidebar-tag"
              :class="{ selected: selectedLocationType === 'indoor' }"
              @click="selectLocationType('indoor')"
            >
              Indoor
            </view>
            <view
              class="sidebar-tag"
              :class="{ selected: selectedLocationType === 'outdoor' }"
              @click="selectLocationType('outdoor')"
            >
              Outdoor
            </view>
          </view>
        </view>

        <view class="sidebar-section">
          <text class="sidebar-label">Radius</text>
          <view class="sidebar-tags">
            <view
              v-for="radius in radiusOptions"
              :key="radius"
              class="sidebar-tag"
              :class="{ selected: selectedRadius === radius }"
              @click="selectRadius(radius)"
            >
              {{ radius }} mi
            </view>
          </view>
        </view>

        <view class="sidebar-section">
          <text class="sidebar-label">Date Range</text>
          <view class="sidebar-tags">
            <view
              v-for="days in dateRangeOptions"
              :key="days"
              class="sidebar-tag"
              :class="{ selected: selectedDays === days }"
              @click="selectDateRange(days)"
            >
              {{ days }} days
            </view>
          </view>
        </view>
      </view>

      <!-- Right Content Area -->
      <view class="content-area">
        <!-- Search and Action Bar Container (Desktop: same row, Mobile: separate) -->
        <view class="search-action-container">
          <!-- Search Bar -->
          <view class="search-bar">
            <view class="search-input-wrapper">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                class="search-input"
                v-model="searchQuery"
                placeholder="Search events..."
                @input="onSearchInput"
              />
              <view class="search-btn" @click="fetchEvents">
                <svg class="search-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </view>
            </view>
          </view>

          <!-- Action Bar -->
          <view class="action-bar">
            <view class="action-btn" @click="showFilterModal = true">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
              <text>Filter</text>
            </view>
            <view class="action-btn" @click="showSortModal = true">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <text>Sort</text>
            </view>
            <view class="location-display" @click="showLocationModal = true">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <text class="zipcode-text">{{ isGPSMode ? 'GPS' : currentZipcode }}</text>
            </view>
          </view>
        </view>

        <!-- Filter Tags (Hidden by default - Mobile only) -->
        <view v-if="showFilters" class="filters">
          <view class="filter-section">
            <text class="filter-label">Age Group:</text>
            <view class="filter-tags">
              <view
                v-for="age in ageGroups"
                :key="age"
                class="tag"
                :class="{ active: selectedAge === age }"
                @click="selectAge(age)"
              >
                {{ age }}
              </view>
            </view>
          </view>

          <view class="filter-section">
            <text class="filter-label">Location Type:</text>
            <view class="filter-tags">
              <view
                class="tag"
                :class="{ active: selectedLocationType === 'indoor' }"
                @click="selectLocationType('indoor')"
              >
                Indoor
              </view>
              <view
                class="tag"
                :class="{ active: selectedLocationType === 'outdoor' }"
                @click="selectLocationType('outdoor')"
              >
                Outdoor
              </view>
            </view>
          </view>

          <view class="filter-section">
            <text class="filter-label">Radius:</text>
            <view class="filter-tags">
              <view
                v-for="radius in radiusOptions"
                :key="radius"
                class="tag"
                :class="{ active: selectedRadius === radius }"
                @click="selectRadius(radius)"
              >
                {{ radius }} mi
              </view>
            </view>
          </view>
        </view>

        <!-- Events List -->
        <view class="events-list">
          <view v-if="loading" class="loading">
            <text>Loading events...</text>
          </view>

          <view v-else-if="events.length === 0" class="empty-state">
            <text>No events found for your criteria</text>
          </view>

          <view v-else class="event-cards">
            <view
              v-for="event in events"
              :key="event.id"
              class="event-card"
            >
              <!-- T的一横：标题 -->
              <view class="card-top" @click="toggleTitleExpand(event.id)">
                <text class="event-title" :class="{ expanded: expandedTitles[event.id] }">{{ event.title }}</text>
              </view>

              <!-- T的下部：左右分栏 -->
              <view class="card-body">
                <!-- 左下：图片位置 -->
                <view v-if="event.imageUrl" class="card-left">
                  <image class="event-image" :src="event.imageUrl" mode="aspectFill" />
                </view>

                <!-- 右下：信息区域 -->
                <view class="card-right">
                  <view class="card-info">
                    <text class="info-item">{{ formatDateTime(event.startTime, event.endTime) }}</text>
                    <text class="info-item">{{ event.locationName }}</text>
                    <text v-if="event.latitude && event.longitude && userLocation" class="info-item">
                      {{ calculateDistance(userLocation.lat, userLocation.lng, event.latitude, event.longitude) }} miles away
                    </text>
                  </view>

                  <view class="card-tags">
                    <!-- Indoor/Outdoor标签始终在第一个位置 -->
                    <view
                      class="location-badge tag"
                      :class="event.indoorOutdoor"
                    >
                      {{ event.indoorOutdoor === 'Indoor' ? 'Indoor' : 'Outdoor' }}
                    </view>
                    <!-- 其他tags -->
                    <view
                  v-if="event.tagNames"
                  v-for="(tagName, index) in event.tagNames.split(',')"
                  :key="index"
                  class="tag"
                >
                  {{ tagName.trim() }}
                </view>
              </view>
            </view>
          </view>

          <!-- Parent Tips - 横跨整行 -->
          <view v-if="event.parentTips" class="card-parent-tips">
            <view class="tips-header">
              <text class="tips-label">Parent Tips:</text>
              <view v-if="event.bookingUrl" class="card-action" @click="openBookingUrl(event.bookingUrl)">
                <text class="action-link">View Details</text>
              </view>
            </view>
            <text class="tips-text">{{ event.parentTips }}</text>
          </view>
        </view>
      </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { apiClient } from '@/api/client.js'
import { localStorageManager } from '@/utils/localStorage.js'
import { STATIC_BASE_URL } from '@/config/static.js'
import SubscriptionModal from '@/components/SubscriptionModal.vue'
import FilterModal from '@/components/FilterModal.vue'
import SortModal from '@/components/SortModal.vue'
import LocationModal from '@/components/LocationModal.vue'

export default {
  components: {
    SubscriptionModal,
    FilterModal,
    SortModal,
    LocationModal
  },
  data() {
    return {
      STATIC_BASE_URL,
      ageGroups: ['3-5', '5-7', '8-10'],
      radiusOptions: [5, 15, 20, 25, 30],
      currentZipcode: '',
      selectedAges: [],
      selectedLocationType: null,
      selectedRadius: 5,
      selectedTags: [], // Store subscribed tags
      selectedInterests: [], // Store selected interests from filter
      selectedDays: 10, // Date range filter in days
      selectedSort: 'date', // Sort option
      searchQuery: '', // Search query for event title
      allTags: [], // Store all tags from backend for tag_id mapping
      userLocation: null, // Store user's GPS coordinates from profile
      isGPSMode: false, // Track if using GPS mode or zipcode mode
      expandedTitles: {}, // Track expanded state for each event title
      events: [],
      loading: false,
      showSubscriptionModal: false,
      showFilters: false,
      showFilterModal: false,
      showSortModal: false,
      showLocationModal: false,
      ageOptions: [], // For desktop sidebar
      interestOptions: [], // For desktop sidebar
      dateRangeOptions: [3, 5, 7, 10] // For desktop sidebar
    }
  },
  async onLoad() {
    await this.checkSubscriptionStatus()
    this.loadPreferences()
    await this.loadUserProfile()
    await this.loadAllTags()
    this.fetchEvents()
  },
  methods: {
    async checkSubscriptionStatus() {
      try {
        const deviceToken = localStorageManager.getDeviceToken()
        const result = await apiClient.checkProfileExists(deviceToken)
        
        if (!result.exists) {
          // Show subscription modal for first-time users
          this.showSubscriptionModal = true
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error)
        // If check fails, show modal to ensure user can subscribe
        this.showSubscriptionModal = true
      }
    },

    onSubscriptionSuccess() {
      // Reload preferences and events after successful subscription
      this.loadPreferences()
      this.loadUserProfile()
      this.loadAllTags()
      this.fetchEvents()
    },

    async loadAllTags() {
      try {
        const tags = await apiClient.getTags()
        this.allTags = tags

        // Populate ageOptions for desktop sidebar
        this.ageOptions = tags
          .filter(tag => tag.tagCategory === 'age')
          .map(tag => ({
            label: tag.tagName,
            value: tag.tagName
          }))

        // Populate interestOptions for desktop sidebar
        this.interestOptions = tags
          .filter(tag => tag.tagCategory === 'eventtype')
          .map(tag => ({
            label: tag.tagName,
            value: tag.tagName
          }))

        console.log('All tags loaded:', tags)
        console.log('Tag structure sample:', tags[0])
      } catch (error) {
        console.error('Failed to load tags:', error)
        this.allTags = []
      }
    },

    getTagIdByName(tagName) {
      const tag = this.allTags.find(t => t.tagName === tagName)
      return tag ? tag.id : null
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
      // Haversine formula to calculate distance in miles
      const R = 3959 // Earth's radius in miles
      const dLat = this.toRadians(lat2 - lat1)
      const dLon = this.toRadians(lon2 - lon1)
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c
      return distance.toFixed(1)
    },

    toRadians(degrees) {
      return degrees * (Math.PI / 180)
    },

    async loadUserProfile() {
      try {
        const deviceToken = localStorageManager.getDeviceToken()
        console.log('Loading profile for device token:', deviceToken)
        const profile = await apiClient.getProfile(deviceToken)
        console.log('User profile loaded:', profile)
        
        if (profile && profile.tags) {
          // Store subscribed tags
          this.selectedTags = profile.tags
          console.log('Selected tags set to:', this.selectedTags)
          
          // Store user's GPS coordinates if available
          if (profile.latitude && profile.longitude) {
            this.userLocation = {
              lat: profile.latitude,
              lng: profile.longitude
            }
            console.log('User location set to:', this.userLocation)
          }
          
          // Set zipcode from profile if available
          if (profile.zipCode) {
            this.currentZipcode = profile.zipCode
            localStorageManager.updateZipcode(profile.zipCode)
          }
          
          // Set first age tag as selected age
          const ageTag = profile.tags.find(tag => tag.tagCategory === 'age')
          if (ageTag) {
            this.selectedAge = ageTag.tagName
            localStorageManager.updateAgePreference(ageTag.tagName)
            console.log('Selected age set to:', this.selectedAge)
          }
        }
      } catch (error) {
        // 404 means profile doesn't exist, which is normal for new users
        if (error.message && error.message.includes('404')) {
          console.log('No existing profile found for this device')
          this.selectedTags = []
        } else {
          console.error('Failed to load user profile:', error)
          this.selectedTags = []
        }
      }
    },

    onFilterApply(filters) {
      // Apply filters from FilterModal
      this.selectedAges = filters.ages || []
      this.selectedLocationType = filters.locationType
      this.selectedRadius = filters.radius
      this.selectedInterests = filters.interests || []
      this.selectedDays = filters.days || 10

      // Save age preference to local storage (save first age if any)
      if (filters.ages && filters.ages.length > 0) {
        localStorageManager.updateAgePreference(filters.ages[0])
      }

      // Refresh events with new filters
      this.fetchEvents()
    },

    onSortApply(sortOption) {
      this.selectedSort = sortOption
      this.sortEvents()
    },

    onLocationUpdate(data) {
      this.currentZipcode = data.zipcode
      if (data.location) {
        this.userLocation = data.location
        this.isGPSMode = true
      } else {
        // If using zipcode, set userLocation to zipcode coordinates for distance calculation
        const coordinates = apiClient.zipcodeToCoordinates(data.zipcode)
        this.userLocation = coordinates
        this.isGPSMode = false
      }
      this.fetchEvents()
    },

    sortEvents() {
      if (this.selectedSort === 'date') {
        this.events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      } else if (this.selectedSort === 'title') {
        this.events.sort((a, b) => a.title.localeCompare(b.title))
      } else if (this.selectedSort === 'distance' && this.userLocation) {
        this.events.sort((a, b) => {
          const distA = this.calculateDistance(
            this.userLocation.lat, 
            this.userLocation.lng, 
            a.latitude, 
            a.longitude
          )
          const distB = this.calculateDistance(
            this.userLocation.lat, 
            this.userLocation.lng, 
            b.latitude, 
            b.longitude
          )
          return parseFloat(distA) - parseFloat(distB)
        })
      }
    },

    loadPreferences() {
      const preferences = localStorageManager.getPreferences()
      this.currentZipcode = preferences.user_zipcode
      this.selectedAge = preferences.user_age_preference
    },

    toggleTitleExpand(eventId) {
      this.$set(this.expandedTitles, eventId, !this.expandedTitles[eventId])
    },
    
    async fetchEvents() {
      this.loading = true
      try {
        const params = {}
        
        // Use user's GPS coordinates if available, otherwise use zipcode coordinates
        if (this.userLocation) {
          params.lng = this.userLocation.lng
          params.lat = this.userLocation.lat
          console.log('Using GPS coordinates for event search:', this.userLocation)
        } else {
          // Convert zipcode to coordinates
          const coordinates = apiClient.zipcodeToCoordinates(this.currentZipcode)
          params.lng = coordinates.lng
          params.lat = coordinates.lat
          // Set userLocation to zipcode coordinates for distance calculation
          this.userLocation = coordinates
          console.log('Using zipcode coordinates for event search:', coordinates)
        }
        
        params.radius = this.selectedRadius
        
        if (this.selectedLocationType) {
          // indoor should be string "Indoor" or "Outdoor" (case-sensitive)
          params.indoor = this.selectedLocationType === 'indoor' ? 'Indoor' : 'Outdoor'
        }
        
        // Add date range filters based on selectedDays
        if (this.selectedDays) {
          const today = new Date()
          const startDate = today.toISOString().split('T')[0] // yyyy-MM-dd format
          const endDate = new Date(today)
          endDate.setDate(today.getDate() + this.selectedDays)
          const endDateStr = endDate.toISOString().split('T')[0]
          
          params.startdate = startDate
          params.enddate = endDateStr
          console.log('Date range:', startDate, 'to', endDateStr)
        }
        
        // Add search query for title
        if (this.searchQuery && this.searchQuery.trim()) {
          params.title = this.searchQuery.trim()
        }
        
        params.limit = 50
        
        // Debug: log current state
        console.log('selectedAges:', this.selectedAges)
        console.log('selectedInterests:', this.selectedInterests)
        console.log('allTags:', this.allTags)

        // Collect all tag_ids to filter by (ages + interests)
        const tagIds = []

        // Convert selected ages to tag_ids
        if (this.selectedAges && this.selectedAges.length > 0) {
          this.selectedAges.forEach(age => {
            const tagId = this.getTagIdByName(age)
            if (tagId) {
              tagIds.push(tagId)
              console.log('Added tag_id for age filter:', tagId, '(age:', age + ')')
            } else {
              console.log('No tag_id found for age:', age)
            }
          })
        }

        // Convert selected interests to tag_ids
        if (this.selectedInterests && this.selectedInterests.length > 0) {
          this.selectedInterests.forEach(interest => {
            const tagId = this.getTagIdByName(interest)
            if (tagId) {
              tagIds.push(tagId)
              console.log('Added tag_id for interest filter:', tagId, '(interest:', interest + ')')
            } else {
              console.log('No tag_id found for interest:', interest)
            }
          })
        }
        
        // If tag_ids exist, pass as comma-separated string (e.g., "1,2,3")
        if (tagIds.length > 0) {
          params.tag_id = tagIds.join(',')
          console.log('Tag IDs to filter by (comma-separated):', params.tag_id)
        } else {
          console.log('No tag_ids to filter by')
        }
        
        console.log('Fetching events with params:', params)
        this.events = await apiClient.getEvents(params)
      } catch (error) {
        console.error('Failed to fetch events:', error)
        uni.showToast({
          title: 'Failed to load events',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    selectAge(age) {
      this.selectedAge = age
      localStorageManager.updateAgePreference(age)
      this.fetchEvents()
    },

    toggleAgeFilter(age) {
      const index = this.selectedAges.indexOf(age)
      if (index > -1) {
        this.selectedAges.splice(index, 1)
      } else {
        this.selectedAges.push(age)
      }
      this.fetchEvents()
    },

    toggleInterestFilter(interest) {
      const index = this.selectedInterests.indexOf(interest)
      if (index > -1) {
        this.selectedInterests.splice(index, 1)
      } else {
        this.selectedInterests.push(interest)
      }
      this.fetchEvents()
    },

    selectDateRange(days) {
      this.selectedDays = days
      this.fetchEvents()
    },

    selectLocationType(type) {
      if (this.selectedLocationType === type) {
        this.selectedLocationType = null
      } else {
        this.selectedLocationType = type
      }
      this.fetchEvents()
    },
    
    selectRadius(radius) {
      this.selectedRadius = radius
      this.fetchEvents()
    },
    
    refreshEvents() {
      this.fetchEvents()
    },
    
    formatDateTime(startTimeStr, endTimeStr) {
      const startDate = new Date(startTimeStr)
      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
      const startTimeFormatted = startDate.toLocaleDateString('en-US', options)

      // Case 1: endTime is empty, don't display end time
      if (!endTimeStr) {
        return startTimeFormatted
      }

      const endDate = new Date(endTimeStr)

      // Case 2: endTime is same as startTime, don't display end time
      if (startDate.getTime() === endDate.getTime()) {
        return startTimeFormatted
      }

      // Check if same date
      const sameDate = startDate.toDateString() === endDate.toDateString()

      let endTimeFormatted
      if (sameDate) {
        // Case 3: Same date, different time - show only time
        const timeOptions = {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
        endTimeFormatted = endDate.toLocaleTimeString('en-US', timeOptions)
      } else {
        // Case 4: Different date/time - show full datetime
        endTimeFormatted = endDate.toLocaleDateString('en-US', options)
      }

      return `${startTimeFormatted} ~ ${endTimeFormatted}`
    },
    
    openBookingUrl(url) {
      window.open(url, '_blank')
    },

    onSearchInput(e) {
      // Debounce search
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.fetchEvents()
      }, 500)
    }
  }
}
</script>

<style scoped>
.event-radar {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 20px;
}

/* Main Container for Responsive Layout */
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Desktop Layout */
@media (min-width: 768px) {
  .main-container {
    flex-direction: row;
  }

  .filter-sidebar {
    width: 280px;
    flex-shrink: 0;
    background-color: white;
    border-right: 1px solid #e0e0e0;
    padding: 20px;
    overflow-y: auto;
    max-height: 100vh;
    position: sticky;
    top: 0;
  }

  .content-area {
    flex: 1;
    padding: 20px;
  }

  .search-action-container {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
  }

  .search-bar {
    flex: 0 0 50%;
    padding: 12px 16px;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
  }

  .action-bar {
    display: flex;
    gap: 12px;
    flex: 0 0 50%;
    padding: 0;
    background-color: transparent;
    border-bottom: none;
  }

  .action-bar .action-btn:first-child {
    display: none; /* Hide Filter button on desktop */
  }

  .action-bar .action-btn {
    flex: 1;
    justify-content: center;
    padding: 12px 16px;
    background-color: transparent;
    border: none;
    border-radius: 6px;
  }

  .location-display {
    flex: 1;
    justify-content: center;
    padding: 12px 16px;
    background-color: transparent;
    border: none;
    border-radius: 6px;
  }

  .filters {
    display: none; /* Hide mobile filters on desktop */
  }

  .event-cards {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 16px !important;
    flex-direction: unset !important;
  }

  .event-card {
    margin: 0 !important;
  }

  .events-list {
    padding: 0 !important;
  }
}

/* Mobile Layout */
@media (max-width: 767px) {
  .filter-sidebar {
    display: none; /* Hide sidebar on mobile */
  }

  .content-area {
    flex: 1;
  }

  .search-action-container {
    flex-direction: column;
  }

  .search-bar {
    flex: 1;
    background-color: white;
    border-bottom: 1px solid #f0f0f0;
    border-radius: 0;
  }

  .action-bar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 12px 16px;
    background-color: white;
    border-bottom: 1px solid #e0e0e0;
    border-radius: 0;
  }

  .action-bar .action-btn {
    flex: 1;
    justify-content: center;
    background-color: transparent;
    border: none;
    border-radius: 0;
    position: relative;
  }

  .location-display {
    flex: 1;
    justify-content: center;
    background-color: transparent;
    border: none;
    border-radius: 0;
  }
}

/* Sidebar Styles */
.sidebar-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.sidebar-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-tag {
  padding: 10px 16px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-tag:hover {
  background-color: #e8e8e8;
}

.sidebar-tag.selected {
  background-color: #1976d2;
  color: white;
  border-color: #1976d2;
}

.nav-bar {
  background-color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
}

.nav-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-icon {
  padding: 8px;
  font-size: 20px;
  cursor: pointer;
}

.search-bar {
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px 16px;
  gap: 8px;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: #999;
}

.search-input {
  flex: 1;
  font-size: 14px;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
}

.search-input::placeholder {
  color: #999;
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.search-btn:hover {
  background-color: #f5f5f5;
}

.search-btn-icon {
  width: 18px;
  height: 18px;
  color: #1976d2;
}

.action-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #1976D2;
  cursor: pointer;
  position: relative;
  flex: 1;
  justify-content: center;
}

.action-btn:first-child::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 16px;
  width: 1px;
  background-color: #e0e0e0;
}

.action-btn:nth-child(2)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 16px;
  width: 1px;
  background-color: #e0e0e0;
}

.action-btn .icon {
  width: 16px;
  height: 16px;
  color: #1976D2;
}

.action-btn:active {
  opacity: 0.7;
}

.location-display {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #1976D2;
  cursor: pointer;
  position: relative;
  flex: 1;
  justify-content: center;
}

.location-display .icon {
  width: 16px;
  height: 16px;
  color: #1976D2;
}

.zipcode-text {
  font-size: 14px;
  font-weight: 500;
  color: #1976D2;
}

.filter-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.filter-btn:active {
  opacity: 0.8;
}

.refresh-btn {
  padding: 8px;
  font-size: 20px;
  cursor: pointer;
}

.filters {
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.filter-section {
  margin-bottom: 12px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.filter-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 8px 16px;
  border-radius: 20px;
  background-color: #f0f0f0;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag.active {
  background-color: #4CAF50;
  color: white;
}

.events-list {
  padding: 8px;
}

.loading,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.event-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-card {
  background-color: white;
  border-radius: 6px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin: 0 5px 16px 5px;
}

.card-top {
  padding: 8px 8px 6px 8px;
  border-bottom: 1px solid #f0f0f0;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.event-title.expanded {
  -webkit-line-clamp: unset;
  line-clamp: unset;
  overflow: visible;
}

.card-body {
  display: flex;
  padding: 12px 16px 16px 16px;
  gap: 12px;
}

.card-left {
  width: 100px;
  flex-shrink: 0;
}

.event-image {
  width: 100px;
  height: 100px;
  border-radius: 12px;
}

.card-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-item {
  font-size: 13px;
  color: #666;
  line-height: 1.2;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.card-tags .tag {
  padding: 4px 10px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.card-tags .location-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  background-color: #e8f5e9;
  color: #2e7d32;
  flex-shrink: 0;
}

.card-action {
  display: flex;
  justify-content: center;
  padding: 4px 8px;
  background-color: #1976D2;
  border-radius: 4px;
  cursor: pointer;
}

.action-link {
  color: white;
  font-size: 10px;
  font-weight: 500;
  text-decoration: none;
}

.card-action:active {
  opacity: 0.8;
}

.card-parent-tips {
  background-color: white;
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tips-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.tips-text {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
}
</style>
