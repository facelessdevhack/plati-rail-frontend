import { createSlice } from "@reduxjs/toolkit";
import {
  getProductionPlans,
  getProductionPlansWithQuantities,
  getProductionPlanById,
  createProductionPlan,
  updateProductionPlan,
  deleteProductionPlan,
  getProductionSteps,
  getProductionPlanSteps,
  addCustomStepsToProductionPlan,
  getJobCards,
  getJobCardsWithDetails,
  createJobCard,
  updateJobCardProgress,
  getJobCardProgress,
  submitQAReport,
  updateQAReport,
  // Preset management
  getStepPresets,
  getPresetDetails,
  createStepPreset,
  updateStepPreset,
  deleteStepPreset,
  // AI suggestions
  getAIProductionSuggestions,
  // Sales metrics
  getSalesPerformanceMetrics,
  // Step-wise quantity tracking
  processStepProgress,
  getJobCardStepProgress,
  getPendingSummary,
  initializeJobCardSteps
} from "../api/productionAPI";

const initialState = {
  loading: false,
  success: false,
  error: {},
  status: "idle",
  
  // Production Plans
  productionPlans: [],
  totalPlansCount: 0,
  currentPage: 1,
  pageSize: 10,
  selectedPlan: null,
  
  // Production Plan Summary (from enhanced API)
  productionSummary: {
    totalPlans: 0,
    plansNeedingJobCards: 0,
    fullyAllocatedPlans: 0,
    completedPlans: 0
  },
  
  // Pagination details
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  },
  
  // Production Steps
  productionSteps: [],
  planSteps: [],
  
  // Job Cards
  jobCards: [],
  totalJobCardsCount: 0,
  selectedJobCard: null,
  jobCardProgress: [],
  
  // Step-wise quantity tracking
  stepProgressData: [],
  pendingSummary: null,
  stepProgressLoading: false,
  
  // Step Presets
  stepPresets: [],
  selectedPreset: null,
  presetDetails: null,
  
  // AI Suggestions
  aiSuggestions: [],
  aiInsights: {},
  aiMetadata: {},
  aiSuggestionsLoading: false,
  
  // Sales Performance Metrics
  salesMetrics: [],
  salesSummary: {},
  salesPagination: {
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  },
  salesFilters: {
    timeframe: '1m',
    search: '',
    sortBy: 'total_sold',
    sortOrder: 'desc'
  },
  salesMetricsLoading: false,

  // Finish Sales Metrics (for Smart Production Dashboard)
  finishSalesMetrics: {},
  finishSalesMetricsLoading: false,
  finishSalesMetricsError: null,

  // Filters and Search
  searchTerm: "",
  filters: {
    urgent: "",
    finish: "",
    status: "",
    dateRange: null
  },
  
  // UI States
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  showDetailsModal: false,
  showJobCardModal: false,
  showQAModal: false
};

const productionSlice = createSlice({
  name: "production",
  initialState: (() => {
    console.log('🔍 Initializing production slice with initial state:', initialState)
    return initialState
  })(),
  reducers: {
    // UI state management
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = "";
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    setSelectedPlan: (state, action) => {
      state.selectedPlan = action.payload;
    },
    setSelectedJobCard: (state, action) => {
      state.selectedJobCard = action.payload;
    },
    
    toggleDetailsModal: (state) => {
      state.showDetailsModal = !state.showDetailsModal;
    },
    toggleJobCardModal: (state) => {
      state.showJobCardModal = !state.showJobCardModal;
    },
    toggleQAModal: (state) => {
      state.showQAModal = !state.showQAModal;
    },
    
    // Reset states
    clearError: (state) => {
      state.error = {};
    },
    resetSuccess: (state) => {
      state.success = false;
    },
    resetProductionState: (state) => {
      return { ...initialState };
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Production Plans
      .addCase(getProductionPlans.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getProductionPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.productionPlans = action.payload.plans;
        state.totalPlansCount = action.payload.totalCount;
        state.currentPage = action.payload.currentPage;
        state.pageSize = action.payload.pageSize;
        state.success = true;
      })
      .addCase(getProductionPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Production Plans with Quantities (Enhanced)
      .addCase(getProductionPlansWithQuantities.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getProductionPlansWithQuantities.fulfilled, (state, action) => {
        state.loading = false;
        state.productionPlans = action.payload.productionPlans || [];
        state.totalPlansCount = action.payload.totalCount || 0;
        state.currentPage = action.payload.currentPage || 1;
        state.pageSize = action.payload.pageSize || 10;
        state.pagination = action.payload.pagination || state.pagination;
        state.productionSummary = action.payload.summary || state.productionSummary;
        state.success = true;
      })
      .addCase(getProductionPlansWithQuantities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: "Failed to fetch production plans with quantities" };
      })

      // Get Production Plan by ID
      .addCase(getProductionPlanById.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getProductionPlanById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPlan = action.payload;
        state.success = true;
      })
      .addCase(getProductionPlanById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Production Plan
      .addCase(createProductionPlan.pending, (state) => {
        state.isCreating = true;
        state.error = {};
      })
      .addCase(createProductionPlan.fulfilled, (state, action) => {
        state.isCreating = false;
        state.success = true;
      })
      .addCase(createProductionPlan.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // Update Production Plan
      .addCase(updateProductionPlan.pending, (state) => {
        state.isUpdating = true;
        state.error = {};
      })
      .addCase(updateProductionPlan.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.success = true;
        state.showDetailsModal = false;
      })
      .addCase(updateProductionPlan.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Delete Production Plan
      .addCase(deleteProductionPlan.pending, (state) => {
        state.isDeleting = true;
        state.error = {};
      })
      .addCase(deleteProductionPlan.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.success = true;
        state.productionPlans = state.productionPlans.filter(
          plan => plan.id !== action.payload.planId
        );
        state.totalPlansCount -= 1;
      })
      .addCase(deleteProductionPlan.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })

      // Get Production Steps
      .addCase(getProductionSteps.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getProductionSteps.fulfilled, (state, action) => {
        state.loading = false;
        state.productionSteps = action.payload;
        state.success = true;
      })
      .addCase(getProductionSteps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Production Plan Steps
      .addCase(getProductionPlanSteps.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getProductionPlanSteps.fulfilled, (state, action) => {
        state.loading = false;
        state.planSteps = action.payload;
        state.success = true;
      })
      .addCase(getProductionPlanSteps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Custom Steps to Production Plan
      .addCase(addCustomStepsToProductionPlan.pending, (state) => {
        state.isUpdating = true;
        state.error = {};
      })
      .addCase(addCustomStepsToProductionPlan.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.success = true;
      })
      .addCase(addCustomStepsToProductionPlan.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Get Job Cards
      .addCase(getJobCards.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getJobCards.fulfilled, (state, action) => {
        state.loading = false;
        state.jobCards = action.payload.jobCards;
        state.totalJobCardsCount = action.payload.totalCount;
        state.success = true;
      })
      .addCase(getJobCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Job Cards with Details (Enhanced)
      .addCase(getJobCardsWithDetails.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getJobCardsWithDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.jobCards = action.payload.jobCards || [];
        state.totalJobCardsCount = action.payload.totalCount || 0;
        state.pagination = {
          ...state.pagination,
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 0,
          hasNext: action.payload.hasNext || false,
          hasPrev: action.payload.hasPrev || false
        };
        state.success = true;
      })
      .addCase(getJobCardsWithDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: "Failed to fetch job cards with details" };
      })

      // Create Job Card
      .addCase(createJobCard.pending, (state) => {
        state.isCreating = true;
        state.error = {};
      })
      .addCase(createJobCard.fulfilled, (state, action) => {
        state.isCreating = false;
        state.success = true;
        state.showJobCardModal = false;
      })
      .addCase(createJobCard.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // Update Job Card Progress
      .addCase(updateJobCardProgress.pending, (state) => {
        state.isUpdating = true;
        state.error = {};
      })
      .addCase(updateJobCardProgress.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.success = true;
      })
      .addCase(updateJobCardProgress.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Get Job Card Progress
      .addCase(getJobCardProgress.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getJobCardProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.jobCardProgress = action.payload;
        state.success = true;
      })
      .addCase(getJobCardProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Submit QA Report
      .addCase(submitQAReport.pending, (state) => {
        state.isCreating = true;
        state.error = {};
      })
      .addCase(submitQAReport.fulfilled, (state, action) => {
        state.isCreating = false;
        state.success = true;
        state.showQAModal = false;
      })
      .addCase(submitQAReport.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // Update QA Report
      .addCase(updateQAReport.pending, (state) => {
        state.isUpdating = true;
        state.error = {};
      })
      .addCase(updateQAReport.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.success = true;
        state.showQAModal = false;
      })
      .addCase(updateQAReport.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Step Presets
      .addCase(getStepPresets.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getStepPresets.fulfilled, (state, action) => {
        state.loading = false;
        state.stepPresets = action.payload.data || [];
      })
      .addCase(getStepPresets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getPresetDetails.pending, (state) => {
        state.loading = true;
        state.error = {};
      })
      .addCase(getPresetDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.presetDetails = action.payload; // API returns data directly, not wrapped in .data
      })
      .addCase(getPresetDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createStepPreset.pending, (state) => {
        state.isCreating = true;
        state.error = {};
      })
      .addCase(createStepPreset.fulfilled, (state, action) => {
        state.isCreating = false;
        state.success = true;
      })
      .addCase(createStepPreset.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      .addCase(updateStepPreset.pending, (state) => {
        state.isUpdating = true;
        state.error = {};
      })
      .addCase(updateStepPreset.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.success = true;
      })
      .addCase(updateStepPreset.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      .addCase(deleteStepPreset.pending, (state) => {
        state.isDeleting = true;
        state.error = {};
      })
      .addCase(deleteStepPreset.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.success = true;
      })
      .addCase(deleteStepPreset.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })

      // AI Suggestions
      .addCase(getAIProductionSuggestions.pending, (state) => {
        state.aiSuggestionsLoading = true;
        state.error = {};
      })
      .addCase(getAIProductionSuggestions.fulfilled, (state, action) => {
        state.aiSuggestionsLoading = false;
        state.aiSuggestions = action.payload.data?.suggestions || [];
        state.aiInsights = action.payload.data?.insights || {};
        state.aiMetadata = action.payload.data?.metadata || {};
        state.success = true;
      })
      .addCase(getAIProductionSuggestions.rejected, (state, action) => {
        state.aiSuggestionsLoading = false;
        state.error = action.payload;
      })
      // Sales Performance Metrics
      .addCase(getSalesPerformanceMetrics.pending, (state) => {
        state.salesMetricsLoading = true;
        state.error = {};
      })
      .addCase(getSalesPerformanceMetrics.fulfilled, (state, action) => {
        state.salesMetricsLoading = false;
        state.salesMetrics = action.payload.data?.salesData || [];
        state.salesSummary = action.payload.data?.summary || {};
        state.salesPagination = action.payload.data?.pagination || {};
        state.salesFilters = { ...state.salesFilters, ...action.payload.data?.filters };
        state.success = true;
      })
      .addCase(getSalesPerformanceMetrics.rejected, (state, action) => {
        state.salesMetricsLoading = false;
        state.error = action.payload;
      })
      
      // Process step progress
      .addCase(processStepProgress.pending, (state) => {
        state.stepProgressLoading = true;
      })
      .addCase(processStepProgress.fulfilled, (state, action) => {
        state.stepProgressLoading = false;
        state.success = true;
        // Update the specific step in stepProgressData
        if (state.stepProgressData && action.payload.stepProgress) {
          const index = state.stepProgressData.findIndex(s => s.id === action.payload.stepProgress.id);
          if (index !== -1) {
            state.stepProgressData[index] = action.payload.stepProgress;
          }
        }
      })
      .addCase(processStepProgress.rejected, (state, action) => {
        state.stepProgressLoading = false;
        state.error = action.payload;
      })
      
      // Get job card step progress
      .addCase(getJobCardStepProgress.pending, (state) => {
        state.stepProgressLoading = true;
      })
      .addCase(getJobCardStepProgress.fulfilled, (state, action) => {
        state.stepProgressLoading = false;
        state.stepProgressData = action.payload.stepProgress || [];
      })
      .addCase(getJobCardStepProgress.rejected, (state, action) => {
        state.stepProgressLoading = false;
        state.error = action.payload;
      })
      
      // Get pending summary
      .addCase(getPendingSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPendingSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingSummary = action.payload.summary || null;
      })
      .addCase(getPendingSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Initialize job card steps
      .addCase(initializeJobCardSteps.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeJobCardSteps.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(initializeJobCardSteps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

  },
});

export const {
  setSearchTerm,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedPlan,
  setSelectedJobCard,
  toggleDetailsModal,
  toggleJobCardModal,
  toggleQAModal,
  clearError,
  resetSuccess,
  resetProductionState
} = productionSlice.actions;

export default productionSlice.reducer;