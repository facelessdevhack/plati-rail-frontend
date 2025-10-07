// Production Presets UI Enhancement Utilities

// Enhanced step icons with detailed information
export const STEP_ICONS = {
  'Material Request': {
    icon: '📦',
    color: '#1890ff',
    name: 'Material Request',
    description: 'Request raw materials for production',
    category: 'procurement',
    estimatedDuration: 2
  },
  'Painting': {
    icon: '🎨',
    color: '#722ed1',
    name: 'Painting',
    description: 'Apply surface painting treatment',
    category: 'finishing',
    estimatedDuration: 4
  },
  'Machining': {
    icon: '⚙️',
    color: '#fa8c16',
    name: 'Machining',
    description: 'CNC machining and shaping',
    category: 'manufacturing',
    estimatedDuration: 6
  },
  'PVD Powder Coating': {
    icon: '🔧',
    color: '#eb2f96',
    name: 'PVD Powder Coating',
    description: 'Physical vapor deposition coating',
    category: 'coating',
    estimatedDuration: 3
  },
  'PVD Process': {
    icon: '⚡',
    color: '#13c2c2',
    name: 'PVD Process',
    description: 'Complete PVD treatment process',
    category: 'coating',
    estimatedDuration: 5
  },
  'Milling': {
    icon: '🏭',
    color: '#52c41a',
    name: 'Milling',
    description: 'Precision milling operations',
    category: 'manufacturing',
    estimatedDuration: 4
  },
  'Acrylic Coating': {
    icon: '💧',
    color: '#1890ff',
    name: 'Acrylic Coating',
    description: 'Apply acrylic protective coating',
    category: 'coating',
    estimatedDuration: 2
  },
  'Lacquer Finish': {
    icon: '✨',
    color: '#faad14',
    name: 'Lacquer Finish',
    description: 'Apply final lacquer finish',
    category: 'finishing',
    estimatedDuration: 3
  },
  'Packaging': {
    icon: '📋',
    color: '#8c8c8c',
    name: 'Packaging',
    description: 'Package finished products',
    category: 'packaging',
    estimatedDuration: 1
  },
  'Quality Check': {
    icon: '🔍',
    color: '#f5222d',
    name: 'Quality Check',
    description: 'Quality assurance and inspection',
    category: 'quality',
    estimatedDuration: 2
  },
  'Dispatch': {
    icon: '🚚',
    color: '#fa541c',
    name: 'Dispatch',
    description: 'Prepare and dispatch orders',
    category: 'logistics',
    estimatedDuration: 1
  }
}

// Enhanced category system with detailed styling
export const CATEGORY_CONFIG = {
  basic: {
    name: 'Basic',
    icon: '📝',
    color: '#1890ff',
    bg: '#e6f7ff',
    border: '#91d5ff',
    text: '#1890ff',
    description: 'Standard production workflows',
    priority: 1,
    estimatedSteps: 5,
    typicalDuration: '2-3 days'
  },
  standard: {
    name: 'Standard',
    icon: '⭐',
    color: '#52c41a',
    bg: '#f6ffed',
    border: '#b7eb8f',
    text: '#52c41a',
    description: 'Most commonly used workflows',
    priority: 2,
    estimatedSteps: 8,
    typicalDuration: '3-5 days'
  },
  premium: {
    name: 'Premium',
    icon: '💎',
    color: '#722ed1',
    bg: '#f9f0ff',
    border: '#d3adf7',
    text: '#722ed1',
    description: 'High-end production workflows',
    priority: 3,
    estimatedSteps: 12,
    typicalDuration: '5-7 days'
  },
  chrome: {
    name: 'Chrome',
    icon: '🔶',
    color: '#fa8c16',
    bg: '#fff7e6',
    border: '#ffd591',
    text: '#fa8c16',
    description: 'Chrome-specific processes',
    priority: 4,
    estimatedSteps: 10,
    typicalDuration: '4-6 days'
  },
  urgent: {
    name: 'Urgent',
    icon: '🚨',
    color: '#f5222d',
    bg: '#fff1f0',
    border: '#ffccc7',
    text: '#f5222d',
    description: 'Fast-track production workflows',
    priority: 5,
    estimatedSteps: 6,
    typicalDuration: '1-2 days'
  },
  custom: {
    name: 'Custom',
    icon: '🎯',
    color: '#13c2c2',
    bg: '#e6fffb',
    border: '#87e8de',
    text: '#13c2c2',
    description: 'Custom-tailored workflows',
    priority: 6,
    estimatedSteps: 15,
    typicalDuration: '7-10 days'
  }
}

// Animation utilities
export const ANIMATIONS = {
  fadeInUp: 'fadeInUp 0.6s ease-out',
  slideInRight: 'slideInRight 0.5s ease-out',
  pulse: 'pulse 2s infinite',
  bounce: 'bounce 1s infinite',
  shimmer: 'shimmer 2s infinite'
}

// Utility functions for duration calculations
export const DURATION_UTILS = {
  calculateTotalHours: (steps) => {
    return steps.reduce((total, step) => {
      const duration = step.estimatedDuration || 2
      const unit = step.estimatedDurationUnit || 'hours'
      const multiplier = unit === 'days' ? 24 : unit === 'minutes' ? 1/60 : 1
      return total + (duration * multiplier)
    }, 0)
  },

  formatDuration: (hours) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = Math.round(hours % 24)
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`
    }
    return `${Math.round(hours)}h`
  },

  calculateWorkDays: (hours, workHoursPerDay = 8) => {
    return Math.ceil(hours / workHoursPerDay)
  },

  getEstimatedEndDate: (startDate, hours) => {
    const workDays = Math.ceil(hours / 8)
    const endDate = new Date(startDate)
    let daysAdded = 0

    while (daysAdded < workDays) {
      endDate.setDate(endDate.getDate() + 1)
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
        daysAdded++
      }
    }

    return endDate
  }
}

// Utility functions for preset metrics
export const METRICS_UTILS = {
  calculateUsageScore: (activeUsage, totalPlans) => {
    if (!totalPlans || totalPlans === 0) return 0
    return Math.round((activeUsage / totalPlans) * 100)
  },

  calculateEfficiencyScore: (steps, duration) => {
    // Simple efficiency calculation: fewer steps with shorter duration = higher score
    const stepScore = Math.max(0, 100 - (steps * 5))
    const durationScore = Math.max(0, 100 - (duration * 2))
    return Math.round((stepScore + durationScore) / 2)
  },

  getComplexityLevel: (stepCount) => {
    if (stepCount <= 5) return { level: 'Simple', color: '#52c41a' }
    if (stepCount <= 10) return { level: 'Moderate', color: '#fa8c16' }
    return { level: 'Complex', color: '#f5222d' }
  },

  calculateCostEstimate: (steps, category) => {
    const baseCosts = {
      basic: 100,
      standard: 200,
      premium: 500,
      chrome: 350,
      urgent: 400,
      custom: 600
    }

    const baseCost = baseCosts[category] || baseCosts.standard
    const stepMultiplier = 1 + (steps * 0.1)

    return Math.round(baseCost * stepMultiplier)
  }
}

// Utility functions for sorting and filtering
export const SORT_UTILS = {
  sortPresets: (presets, sortBy, sortOrder) => {
    const sorted = [...presets].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.presetName?.localeCompare(b.presetName) || 0
        case 'usage':
          return (b.activeUsage || 0) - (a.activeUsage || 0)
        case 'steps':
          return (b.stepCount || 0) - (a.stepCount || 0)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'created':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        case 'complexity':
          return (b.stepCount || 0) - (a.stepCount || 0)
        default:
          return 0
      }
    })

    return sortOrder === 'desc' ? sorted.reverse() : sorted
  },

  filterPresets: (presets, filters) => {
    return presets.filter(preset => {
      const matchesSearch = !filters.searchTerm ||
        preset.presetName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        preset.presetDescription?.toLowerCase().includes(filters.searchTerm.toLowerCase())

      const matchesCategory = !filters.category || filters.category === 'all' ||
        preset.category === filters.category

      const matchesFavorites = !filters.showFavorites || preset.isFavorite

      const matchesStatus = preset.isActive !== false

      const matchesRating = !filters.minRating || (preset.rating || 0) >= filters.minRating

      return matchesSearch && matchesCategory && matchesFavorites && matchesStatus && matchesRating
    })
  }
}

// Utility functions for validation
export const VALIDATION_UTILS = {
  validatePresetName: (name) => {
    if (!name || name.trim().length === 0) {
      return { valid: false, message: 'Preset name is required' }
    }

    if (name.length < 3) {
      return { valid: false, message: 'Preset name must be at least 3 characters' }
    }

    if (name.length > 50) {
      return { valid: false, message: 'Preset name must be less than 50 characters' }
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return { valid: false, message: 'Only letters, numbers, spaces, hyphens, and underscores allowed' }
    }

    return { valid: true }
  },

  validateDescription: (description) => {
    if (description && description.length > 200) {
      return { valid: false, message: 'Description must be less than 200 characters' }
    }
    return { valid: true }
  },

  validateSteps: (steps) => {
    if (!steps || steps.length === 0) {
      return { valid: false, message: 'At least one step is required' }
    }

    if (steps.length > 20) {
      return { valid: false, message: 'Maximum 20 steps allowed' }
    }

    const hasRequiredSteps = steps.some(step => step.isRequired !== false)
    if (!hasRequiredSteps) {
      return { valid: false, message: 'At least one required step is needed' }
    }

    return { valid: true }
  }
}

// Utility functions for notifications
export const NOTIFICATION_UTILS = {
  showSuccess: (message, description, duration = 4) => {
    return {
      type: 'success',
      message: `✅ ${message}`,
      description,
      duration,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
    }
  },

  showError: (message, description, duration = 6) => {
    return {
      type: 'error',
      message: `❌ ${message}`,
      description,
      duration,
      icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />
    }
  },

  showWarning: (message, description, duration = 5) => {
    return {
      type: 'warning',
      message: `⚠️ ${message}`,
      description,
      duration,
      icon: <InfoCircleOutlined style={{ color: '#fa8c16' }} />
    }
  },

  showInfo: (message, description, duration = 3) => {
    return {
      type: 'info',
      message: `ℹ️ ${message}`,
      description,
      duration,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />
    }
  }
}

// Utility functions for export/import
export const EXPORT_UTILS = {
  exportPreset: (preset, steps) => {
    const exportData = {
      preset: {
        name: preset.presetName,
        description: preset.presetDescription,
        category: preset.category,
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: 'Production System'
      },
      steps: steps.map(step => ({
        name: step.stepName,
        order: step.stepOrder,
        required: step.isRequired,
        duration: step.estimatedDuration,
        unit: step.estimatedDurationUnit,
        notes: step.notes
      }))
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${preset.presetName}_export_${Date.now()}.json`
    link.click()

    URL.revokeObjectURL(url)
  },

  importPreset: (fileData) => {
    try {
      const imported = JSON.parse(fileData)

      // Validate imported data structure
      if (!imported.preset || !imported.steps) {
        throw new Error('Invalid preset file format')
      }

      return {
        preset: imported.preset,
        steps: imported.steps.map((step, index) => ({
          stepName: step.name,
          stepOrder: step.order || index + 1,
          isRequired: step.required !== false,
          estimatedDuration: step.duration || 2,
          estimatedDurationUnit: step.unit || 'hours',
          notes: step.notes || ''
        }))
      }
    } catch (error) {
      throw new Error(`Failed to import preset: ${error.message}`)
    }
  }
}

// Utility functions for accessibility
export const ACCESSIBILITY_UTILS = {
  getAriaLabel: (action, item) => {
    const labels = {
      preview: `Preview preset ${item}`,
      edit: `Edit preset ${item}`,
      delete: `Delete preset ${item}`,
      duplicate: `Duplicate preset ${item}`,
      favorite: `Add ${item} to favorites`,
      select: `Select preset ${item}`
    }

    return labels[action] || action
  },

  getKeyboardShortcuts: () => {
    return {
      'Ctrl+F': 'Focus search',
      'Ctrl+N': 'Create new preset',
      'Escape': 'Close modal/drawer',
      'Enter': 'Select focused item',
      'Space': 'Toggle selection',
      'Arrow Keys': 'Navigate list',
      'Ctrl+E': 'Export selected preset',
      'Ctrl+I': 'Import preset'
    }
  },

  announceToScreenReader: (message) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
}

// Constants for performance optimization
export const PERFORMANCE_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
  LAZY_LOAD_THRESHOLD: 100,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_PAGINATION_SIZE: 50,
  MIN_SEARCH_LENGTH: 2
}

// Theme utilities
export const THEME_UTILS = {
  getColorForCategory: (category) => {
    return CATEGORY_CONFIG[category]?.color || CATEGORY_CONFIG.standard.color
  },

  getBackgroundForCategory: (category) => {
    return CATEGORY_CONFIG[category]?.bg || CATEGORY_CONFIG.standard.bg
  },

  getIconForCategory: (category) => {
    return CATEGORY_CONFIG[category]?.icon || CATEGORY_CONFIG.standard.icon
  },

  applyTheme: (theme) => {
    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })
  }
}

// Default theme
export const DEFAULT_THEME = {
  colors: {
    primary: '#1890ff',
    secondary: '#722ed1',
    success: '#52c41a',
    warning: '#fa8c16',
    error: '#f5222d',
    background: '#f0f2f5',
    surface: '#ffffff',
    text: '#262626',
    textSecondary: '#8c8c8c'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  }
}