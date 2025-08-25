// mockProductionData.js
// Mock data and utility functions for production API endpoints

// Mock production steps
export const mockProductionSteps = [
  { id: 1, name: 'Melting', description: 'Melting raw materials', order: 1 },
  { id: 2, name: 'Casting', description: 'Casting into molds', order: 2 },
  { id: 3, name: 'Cooling', description: 'Cooling of cast parts', order: 3 },
  {
    id: 4,
    name: 'Quality Check',
    description: 'Initial quality assessment',
    order: 4
  },
  {
    id: 5,
    name: 'Finishing',
    description: 'Final touches and polishing',
    order: 5
  }
]

// Mock job cards data
export const mockJobCards = [
  {
    id: 1001,
    prodPlanId: 101,
    quantity: 500,
    prodStep: 1,
    stepName: 'Melting',
    acceptedQuantity: null,
    rejectedQuantity: null,
    createdBy: 1,
    createdAt: '2023-08-15T09:30:00Z',
    updatedAt: '2023-08-15T09:30:00Z'
  },
  {
    id: 1002,
    prodPlanId: 102,
    quantity: 750,
    prodStep: 2,
    stepName: 'Casting',
    acceptedQuantity: null,
    rejectedQuantity: null,
    createdBy: 2,
    createdAt: '2023-08-14T10:15:00Z',
    updatedAt: '2023-08-15T11:45:00Z'
  },
  {
    id: 1003,
    prodPlanId: 103,
    quantity: 300,
    prodStep: 3,
    stepName: 'Cooling',
    acceptedQuantity: null,
    rejectedQuantity: null,
    createdBy: 1,
    createdAt: '2023-08-13T14:20:00Z',
    updatedAt: '2023-08-15T08:30:00Z'
  },
  {
    id: 1004,
    prodPlanId: 104,
    quantity: 1000,
    prodStep: 4,
    stepName: 'Quality Check',
    acceptedQuantity: 900,
    rejectedQuantity: 100,
    rejectionReason: 'Surface imperfections',
    createdBy: 3,
    createdAt: '2023-08-12T08:45:00Z',
    updatedAt: '2023-08-15T15:20:00Z'
  },
  {
    id: 1005,
    prodPlanId: 105,
    quantity: 250,
    prodStep: 5,
    stepName: 'Finishing',
    acceptedQuantity: 250,
    rejectedQuantity: 0,
    createdBy: 2,
    createdAt: '2023-08-11T11:10:00Z',
    updatedAt: '2023-08-15T16:45:00Z'
  }
]

// Mock production plans
export const mockProductionPlans = [
  {
    id: 101,
    alloyId: 1,
    alloyName: 'Aluminum 6061',
    convertId: 5,
    convertName: 'Sheet Metal',
    quantity: 500,
    urgent: true,
    createdBy: 1,
    createdAt: '2023-08-15T09:00:00Z',
    status: 'In Progress',
    jobCardCount: 1,
    totalJobCardQuantity: 500,
    remainingQuantity: 0
  },
  {
    id: 102,
    alloyId: 2,
    alloyName: 'Steel 1045',
    convertId: 6,
    convertName: 'Rod',
    quantity: 750,
    urgent: false,
    createdBy: 2,
    createdAt: '2023-08-14T10:00:00Z',
    status: 'In Progress',
    jobCardCount: 1,
    totalJobCardQuantity: 750,
    remainingQuantity: 0
  },
  {
    id: 103,
    alloyId: 3,
    alloyName: 'Copper C11000',
    convertId: 7,
    convertName: 'Wire',
    quantity: 300,
    urgent: true,
    createdBy: 1,
    createdAt: '2023-08-13T14:00:00Z',
    status: 'In Progress',
    jobCardCount: 1,
    totalJobCardQuantity: 300,
    remainingQuantity: 0
  },
  {
    id: 104,
    alloyId: 4,
    alloyName: 'Brass C26000',
    convertId: 8,
    convertName: 'Tube',
    quantity: 1000,
    urgent: false,
    createdBy: 3,
    createdAt: '2023-08-12T08:30:00Z',
    status: 'Quality Check',
    jobCardCount: 1,
    totalJobCardQuantity: 1000,
    remainingQuantity: 0
  },
  {
    id: 105,
    alloyId: 1,
    alloyName: 'Aluminum 6061',
    convertId: 9,
    convertName: 'Plate',
    quantity: 250,
    urgent: false,
    createdBy: 2,
    createdAt: '2023-08-11T11:00:00Z',
    status: 'Completed',
    jobCardCount: 1,
    totalJobCardQuantity: 250,
    remainingQuantity: 0
  },
  {
    id: 106,
    alloyId: 5,
    alloyName: 'Stainless Steel 304',
    convertId: 10,
    convertName: 'Pipe',
    quantity: 800,
    urgent: true,
    createdBy: 1,
    createdAt: '2023-08-16T08:00:00Z',
    status: 'Planning',
    jobCardCount: 0,
    totalJobCardQuantity: 0,
    remainingQuantity: 800
  },
  {
    id: 107,
    alloyId: 6,
    alloyName: 'Bronze C95400',
    convertId: 11,
    convertName: 'Bar',
    quantity: 1200,
    urgent: false,
    createdBy: 2,
    createdAt: '2023-08-16T10:00:00Z',
    status: 'Planning',
    jobCardCount: 0,
    totalJobCardQuantity: 0,
    remainingQuantity: 1200
  }
]

// Mock step transitions history
export const mockStepTransitions = {
  1001: [
    {
      id: 1,
      jobCardId: 1001,
      fromStep: null,
      toStep: 1,
      timestamp: '2023-08-15T09:30:00Z',
      userId: 1,
      userName: 'John Doe',
      notes: 'Production started'
    }
  ],
  1002: [
    {
      id: 2,
      jobCardId: 1002,
      fromStep: null,
      toStep: 1,
      timestamp: '2023-08-14T10:15:00Z',
      userId: 2,
      userName: 'Jane Smith',
      notes: 'Production started'
    },
    {
      id: 3,
      jobCardId: 1002,
      fromStep: 1,
      toStep: 2,
      timestamp: '2023-08-15T11:45:00Z',
      userId: 2,
      userName: 'Jane Smith',
      notes: 'Moved to casting'
    }
  ],
  1003: [
    {
      id: 4,
      jobCardId: 1003,
      fromStep: null,
      toStep: 1,
      timestamp: '2023-08-13T14:20:00Z',
      userId: 1,
      userName: 'John Doe',
      notes: 'Production started'
    },
    {
      id: 5,
      jobCardId: 1003,
      fromStep: 1,
      toStep: 2,
      timestamp: '2023-08-14T10:30:00Z',
      userId: 3,
      userName: 'Mike Johnson',
      notes: 'Moved to casting'
    },
    {
      id: 6,
      jobCardId: 1003,
      fromStep: 2,
      toStep: 3,
      timestamp: '2023-08-15T08:30:00Z',
      userId: 3,
      userName: 'Mike Johnson',
      notes: 'Moved to cooling'
    }
  ],
  1004: [
    {
      id: 7,
      jobCardId: 1004,
      fromStep: null,
      toStep: 1,
      timestamp: '2023-08-12T08:45:00Z',
      userId: 3,
      userName: 'Mike Johnson',
      notes: 'Production started'
    },
    {
      id: 8,
      jobCardId: 1004,
      fromStep: 1,
      toStep: 2,
      timestamp: '2023-08-13T09:15:00Z',
      userId: 1,
      userName: 'John Doe',
      notes: 'Moved to casting'
    },
    {
      id: 9,
      jobCardId: 1004,
      fromStep: 2,
      toStep: 3,
      timestamp: '2023-08-14T11:30:00Z',
      userId: 2,
      userName: 'Jane Smith',
      notes: 'Moved to cooling'
    },
    {
      id: 10,
      jobCardId: 1004,
      fromStep: 3,
      toStep: 4,
      timestamp: '2023-08-15T15:20:00Z',
      userId: 2,
      userName: 'Jane Smith',
      notes: 'Moved to quality check'
    }
  ],
  1005: [
    {
      id: 11,
      jobCardId: 1005,
      fromStep: null,
      toStep: 1,
      timestamp: '2023-08-11T11:10:00Z',
      userId: 2,
      userName: 'Jane Smith',
      notes: 'Production started'
    },
    {
      id: 12,
      jobCardId: 1005,
      fromStep: 1,
      toStep: 2,
      timestamp: '2023-08-12T10:30:00Z',
      userId: 3,
      userName: 'Mike Johnson',
      notes: 'Moved to casting'
    },
    {
      id: 13,
      jobCardId: 1005,
      fromStep: 2,
      toStep: 3,
      timestamp: '2023-08-13T14:15:00Z',
      userId: 1,
      userName: 'John Doe',
      notes: 'Moved to cooling'
    },
    {
      id: 14,
      jobCardId: 1005,
      fromStep: 3,
      toStep: 4,
      timestamp: '2023-08-14T09:20:00Z',
      userId: 2,
      userName: 'Jane Smith',
      notes: 'Moved to quality check'
    },
    {
      id: 15,
      jobCardId: 1005,
      fromStep: 4,
      toStep: 5,
      timestamp: '2023-08-15T16:45:00Z',
      userId: 3,
      userName: 'Mike Johnson',
      notes: 'Moved to finishing'
    }
  ]
}

// Mock QA reports
export const mockQAReports = {
  1004: {
    jobCardId: 1004,
    acceptedQuantity: 900,
    rejectedQuantity: 100,
    rejectionReason: 'Surface imperfections',
    planId: 104,
    qaId: 2,
    timestamp: '2023-08-15T15:30:00Z'
  },
  1005: {
    jobCardId: 1005,
    acceptedQuantity: 250,
    rejectedQuantity: 0,
    rejectionReason: '',
    planId: 105,
    qaId: 3,
    timestamp: '2023-08-15T16:50:00Z'
  }
}

// Helper function to get a job card by ID
export const getJobCardById = jobCardId => {
  return mockJobCards.find(card => card.id === parseInt(jobCardId)) || null
}

// Helper function to get a production plan by ID
export const getPlanById = planId => {
  return mockProductionPlans.find(plan => plan.id === parseInt(planId)) || null
}

// Helper function to get step transitions for a job card
export const getStepTransitions = jobCardId => {
  return mockStepTransitions[jobCardId] || []
}

// Helper function to get QA report for a job card
export const getQAReport = jobCardId => {
  return mockQAReports[jobCardId] || null
}

// Function to generate a new unique ID for a resource
export const generateNewId = collection => {
  return Math.max(...collection.map(item => item.id)) + 1
}

// Mock step presets
export const mockStepPresets = [
  {
    id: 1,
    name: 'Standard Aluminum Process',
    description: 'Complete aluminum production workflow',
    steps: [
      { stepId: 1, order: 1, estimatedDuration: 120, isRequired: true },
      { stepId: 2, order: 2, estimatedDuration: 180, isRequired: true },
      { stepId: 3, order: 3, estimatedDuration: 60, isRequired: true },
      { stepId: 4, order: 4, estimatedDuration: 45, isRequired: true }
    ],
    createdBy: 1,
    createdAt: '2023-08-01T09:00:00Z'
  },
  {
    id: 2,
    name: 'Quick Cast Process',
    description: 'Fast-track casting workflow',
    steps: [
      { stepId: 2, order: 1, estimatedDuration: 90, isRequired: true },
      { stepId: 3, order: 2, estimatedDuration: 30, isRequired: true }
    ],
    createdBy: 2,
    createdAt: '2023-08-05T10:00:00Z'
  },
  {
    id: 3,
    name: 'Quality Focus Process',
    description: 'Enhanced quality control workflow',
    steps: [
      { stepId: 1, order: 1, estimatedDuration: 150, isRequired: true },
      { stepId: 2, order: 2, estimatedDuration: 200, isRequired: true },
      { stepId: 3, order: 3, estimatedDuration: 90, isRequired: true },
      { stepId: 4, order: 4, estimatedDuration: 90, isRequired: true },
      { stepId: 5, order: 5, estimatedDuration: 120, isRequired: true }
    ],
    createdBy: 3,
    createdAt: '2023-08-10T14:00:00Z'
  }
]

// Mock API response functions
export const mockApiResponses = {
  // Get production steps
  getProductionSteps: () => {
    return {
      result: mockProductionSteps
    }
  },

  // Get step presets
  getStepPresets: () => {
    return {
      data: mockStepPresets
    }
  },

  // Get preset details by name
  getPresetDetails: (presetName) => {
    const preset = mockStepPresets.find(p => 
      p.name.toLowerCase().replace(/\s+/g, '-') === presetName.toLowerCase()
    )
    return {
      data: preset
    }
  },

  // Get job cards for production plan
  getJobCards: ({ prodPlanId }) => {
    const planJobCards = mockJobCards.filter(jc => jc.prodPlanId === parseInt(prodPlanId))
    return {
      jobCards: planJobCards,
      totalCount: planJobCards.length
    }
  },

  // Get job card by ID
  getJobCardById: jobCardId => {
    const jobCard = getJobCardById(jobCardId)
    return {
      result: jobCard
    }
  },

  // Get production plans
  getProductionPlans: ({ page = 1, limit = 10, search = '', urgent = '', finish = '' }) => {
    let filteredPlans = [...mockProductionPlans]
    
    if (search) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.alloyName.toLowerCase().includes(search.toLowerCase()) ||
        plan.convertName.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (urgent !== '') {
      filteredPlans = filteredPlans.filter(plan => plan.urgent === (urgent === 'true'))
    }
    
    // Add real-time job card counts
    const plansWithJobCardInfo = filteredPlans.map(plan => {
      const planJobCards = mockJobCards.filter(jc => jc.prodPlanId === plan.id)
      const totalJobCardQuantity = planJobCards.reduce((sum, jc) => sum + jc.quantity, 0)
      const remainingQuantity = plan.quantity - totalJobCardQuantity
      
      return {
        ...plan,
        jobCardCount: planJobCards.length,
        totalJobCardQuantity,
        remainingQuantity: Math.max(0, remainingQuantity)
      }
    })
    
    const startIndex = (page - 1) * limit
    const paginatedPlans = plansWithJobCardInfo.slice(startIndex, startIndex + limit)
    
    return {
      getProdListing: paginatedPlans,
      totalCount: plansWithJobCardInfo.length
    }
  },

  // Get production plan by ID
  getProductionPlanById: planId => {
    const plan = getPlanById(planId)
    return {
      result: plan
    }
  },

  // Get step transitions for a job card
  getStepTransitions: jobCardId => {
    const transitions = getStepTransitions(jobCardId)
    return {
      result: transitions
    }
  },

  // Create production plan
  createProductionPlan: planData => {
    const newId = generateNewId(mockProductionPlans)
    const newPlan = {
      id: newId,
      ...planData,
      createdAt: new Date().toISOString(),
      status: 'Planning'
    }
    mockProductionPlans.push(newPlan)
    
    return {
      message: 'Plan Added Successfully',
      data: newPlan
    }
  },

  // Create job card with preset/custom steps support
  createJobCard: jobCardData => {
    console.log('Creating job card with data:', jobCardData)
    
    const newId = generateNewId(mockJobCards)
    const newJobCard = {
      id: newId,
      prodPlanId: jobCardData.prodPlanId,
      quantity: jobCardData.quantity,
      prodStep: 1, // Always start at first step
      stepName: 'Melting', // Default first step
      acceptedQuantity: null,
      rejectedQuantity: null,
      createdBy: jobCardData.createdBy || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Active',
      // Store the step assignment configuration
      stepAssignmentMode: jobCardData.stepAssignmentMode,
      selectedPreset: jobCardData.selectedPreset,
      customSteps: jobCardData.customSteps,
      notes: jobCardData.notes
    }
    
    mockJobCards.push(newJobCard)
    
    // Update the production plan's job card counts
    const plan = mockProductionPlans.find(p => p.id === jobCardData.prodPlanId)
    if (plan) {
      const planJobCards = mockJobCards.filter(jc => jc.prodPlanId === plan.id)
      const totalJobCardQuantity = planJobCards.reduce((sum, jc) => sum + jc.quantity, 0)
      
      plan.jobCardCount = planJobCards.length
      plan.totalJobCardQuantity = totalJobCardQuantity
      plan.remainingQuantity = Math.max(0, plan.quantity - totalJobCardQuantity)
    }
    
    // If custom steps were provided, simulate adding them to the plan
    if (jobCardData.customSteps && jobCardData.customSteps.length > 0) {
      console.log('Job card created with custom steps:', jobCardData.customSteps)
    }
    
    // If a preset was selected, simulate applying it
    if (jobCardData.selectedPreset) {
      console.log('Job card created with preset:', jobCardData.selectedPreset)
    }
    
    return {
      message: 'Production Job Card Added Successfully',
      data: newJobCard,
      jobCardId: newId
    }
  },

  // Update job card
  updateJobCard: updateData => {
    const jobCard = mockJobCards.find(jc => jc.id === updateData.jobCardId)
    if (jobCard) {
      Object.assign(jobCard, updateData, { updatedAt: new Date().toISOString() })
    }
    
    return {
      message: 'Job Card Updated Successfully',
      data: jobCard
    }
  },

  // Submit QA report
  submitQAReport: qaData => {
    const newReport = {
      id: generateNewId(Object.values(mockQAReports)),
      ...qaData,
      timestamp: new Date().toISOString()
    }
    
    mockQAReports[qaData.jobCardId] = newReport
    
    return {
      message: 'QA Report Submitted Successfully',
      data: newReport
    }
  },

  // Update QA report
  updateQAReport: updateData => {
    if (mockQAReports[updateData.jobCardId]) {
      Object.assign(mockQAReports[updateData.jobCardId], updateData, {
        timestamp: new Date().toISOString()
      })
    }
    
    return {
      message: 'QA Report Updated Successfully',
      data: mockQAReports[updateData.jobCardId]
    }
  },

  // Add custom steps to production plan
  addCustomStepsToProductionPlan: ({ prodPlanId, steps, userId }) => {
    console.log(`Adding ${steps.length} custom steps to plan ${prodPlanId}`)
    
    return {
      message: 'Custom steps added to production plan successfully',
      data: {
        prodPlanId,
        stepsAdded: steps.length,
        addedBy: userId
      }
    }
  },

  // Assign preset to plan
  assignPresetToPlan: ({ planId, presetName }) => {
    const plan = mockProductionPlans.find(p => p.id === parseInt(planId))
    const preset = mockStepPresets.find(p => 
      p.name.toLowerCase().replace(/\s+/g, '-') === presetName.toLowerCase()
    )
    
    if (plan && preset) {
      plan.assignedPreset = presetName
      plan.presetSteps = preset.steps
    }
    
    return {
      message: 'Preset assigned to production plan successfully',
      data: { planId, presetName, stepsCount: preset?.steps?.length || 0 }
    }
  }
}
