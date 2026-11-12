<template>
  <view v-if="visible" class="modal-overlay" @click="closeModal">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">Sort Events</text>
        <view class="close-btn" @click="closeModal">
          <text>✕</text>
        </view>
      </view>
      
      <view class="modal-body">
        <view class="form-section">
          <text class="section-label">Sort By</text>
          <view class="sort-options">
            <view 
              v-for="option in sortOptions" 
              :key="option.value"
              class="sort-option"
              :class="{ selected: localSelectedSort === option.value }"
              @click="selectSort(option.value)"
            >
              <text class="option-label">{{ option.label }}</text>
              <text v-if="localSelectedSort === option.value" class="check-icon">✓</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="modal-footer">
        <button 
          class="apply-btn"
          @click="applySort"
        >
          Apply
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    selectedSort: {
      type: String,
      default: 'date'
    }
  },
  data() {
    return {
      localSelectedSort: 'date',
      sortOptions: [
        { label: 'Date (Upcoming)', value: 'date' },
        { label: 'Distance (Nearest)', value: 'distance' },
        { label: 'Title (A-Z)', value: 'title' }
      ]
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.localSelectedSort = this.selectedSort
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    
    selectSort(value) {
      this.localSelectedSort = value
    },
    
    applySort() {
      this.$emit('apply', this.localSelectedSort)
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
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  width: 100%;
  max-width: 600px;
  border-radius: 6px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  padding: 8px;
  font-size: 20px;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
}

.form-section {
  margin-bottom: 16px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.sort-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sort-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-option.selected {
  background-color: #e3f2fd;
  border: 1px solid #1976D2;
}

.option-label {
  font-size: 14px;
  color: #333;
}

.check-icon {
  font-size: 16px;
  color: #1976D2;
  font-weight: 600;
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

.apply-btn:active {
  opacity: 0.8;
}
</style>
