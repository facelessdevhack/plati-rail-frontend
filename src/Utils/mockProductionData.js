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
    status: 'In Progress'
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
    status: 'In Progress'
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
    status: 'In Progress'
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
    status: 'Quality Check'
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
    status: 'Completed'
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

// Mock API response functions
export const mockApiResponses = {
  // Get production steps
  getProductionSteps: () => {
    return {
      result: mockProductionSteps
    }
  },

  // Get job cards
  getJobCards: () => {
    return {
      result: mockJobCards
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
  getProductionPlans: () => {
    return {
      result: mockProductionPlans
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
    return {
      message: 'Plan Added Successfully'
    }
  },

  // Create job card
  createJobCard: jobCardData => {
    return {
      message: 'Production Job Card Added'
    }
  },

  // Update job card
  updateJobCard: updateData => {
    return {
      message: 'Updated Successfully'
    }
  },

  // Submit QA report
  submitQAReport: qaData => {
    return {
      message: 'QA Report Submitted'
    }
  },

  // Update QA report
  updateQAReport: updateData => {
    return {
      message: 'QA Report Updated'
    }
  }
}
