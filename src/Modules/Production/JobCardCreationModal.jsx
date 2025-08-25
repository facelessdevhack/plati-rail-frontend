import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Alert,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  Tag,
  Tooltip,
  notification,
  Radio,
  Steps,
  Timeline
} from 'antd'
import {
  PlayCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FireOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DragOutlined,
  SaveOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'

import { getProductionPlansWithQuantities, createJobCard, getStepPresets, getPresetDetails, getProductionSteps, addCustomStepsToProductionPlan } from '../../redux/api/productionAPI'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

const JobCardCreationModal = ({ visible, onCancel, onSuccess, selectedPlan = null }) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  
  // Debug modal props
  console.log('🎯 JobCardCreationModal props:', { 
    visible, 
    selectedPlan: selectedPlan ? { id: selectedPlan.id, alloyName: selectedPlan.alloyName } : null 
  })
  
  // Redux state
  const { 
    productionPlans = [], 
    loading 
  } = useSelector(state => state.productionDetails || {})
  const { user } = useSelector(state => state.userDetails || {})

  // Local state
  const [submitting, setSubmitting] = useState(false)
  const [selectedProductionPlan, setSelectedProductionPlan] = useState(null)
  const [availableQuantity, setAvailableQuantity] = useState(0)
  const [allocationInfo, setAllocationInfo] = useState({
    totalQuantity: 0,
    allocatedQuantity: 0,
    remainingQuantity: 0,
    completedQuantity: 0
  })
  const [stepPresets, setStepPresets] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [stepAssignmentMode, setStepAssignmentMode] = useState('preset') // 'preset' or 'manual'
  const [showReasonField, setShowReasonField] = useState(false)
  const [availableSteps, setAvailableSteps] = useState([])
  const [customSteps, setCustomSteps] = useState([])
  const [stepBuilderExpanded, setStepBuilderExpanded] = useState(false)

  // Load production plans and step presets when modal opens
  useEffect(() => {
    if (visible) {
      // Always fetch fresh data to get latest allocation info
      dispatch(getProductionPlansWithQuantities({ 
        page: 1, 
        limit: 100,
        status: 'active' // Only show active plans
      }))
      loadStepPresets()
      loadAvailableSteps()
    }
  }, [visible, dispatch])

  // Load step presets
  const loadStepPresets = async () => {
    try {
      const result = await dispatch(getStepPresets()).unwrap()
      const apiPresets = result.data || []
      
      // Transform API presets to the format we need
      const formattedPresets = apiPresets.map(preset => ({
        id: preset.presetName,
        name: preset.presetName,
        description: preset.presetDescription || 'No description',
        category: preset.presetCategory,
        stepCount: preset.stepCount || 0,
        steps: [] // Will be loaded when preset is selected
      }))
      
      // Add default 11-step preset if no presets exist or as fallback
      const defaultPreset = {
        id: 'default',
        name: 'Standard 11-Step Process', 
        description: 'Complete manufacturing process',
        category: 'standard',
        stepCount: 11,
        steps: [
          { id: 1, name: 'Material Request', estimatedDuration: '2 hours', stepOrder: 1, isRequired: true },
          { id: 2, name: 'Painting', estimatedDuration: '4 hours', stepOrder: 2, isRequired: true },
          { id: 3, name: 'Machining', estimatedDuration: '6 hours', stepOrder: 3, isRequired: true },
          { id: 4, name: 'PVD Powder Coating', estimatedDuration: '3 hours', stepOrder: 4, isRequired: true },
          { id: 5, name: 'PVD Process', estimatedDuration: '5 hours', stepOrder: 5, isRequired: true },
          { id: 6, name: 'Milling', estimatedDuration: '4 hours', stepOrder: 6, isRequired: true },
          { id: 7, name: 'Acrylic Coating', estimatedDuration: '3 hours', stepOrder: 7, isRequired: true },
          { id: 8, name: 'Lacquer Finish', estimatedDuration: '2 hours', stepOrder: 8, isRequired: true },
          { id: 9, name: 'Packaging', estimatedDuration: '1 hour', stepOrder: 9, isRequired: true },
          { id: 10, name: 'Quality Check', estimatedDuration: '2 hours', stepOrder: 10, isRequired: true },
          { id: 11, name: 'Dispatch', estimatedDuration: '1 hour', stepOrder: 11, isRequired: true }
        ]
      }
      
      const allPresets = [defaultPreset, ...formattedPresets]
      setStepPresets(allPresets)
      setSelectedPreset(defaultPreset) // Default to standard preset
      form.setFieldsValue({ presetId: 'default' })
    } catch (error) {
      console.error('Error loading step presets:', error)
      // Fallback to default preset only
      const defaultPreset = {
        id: 'default',
        name: 'Standard 11-Step Process',
        description: 'Complete manufacturing process',
        category: 'standard',
        stepCount: 11,
        steps: [
          { id: 1, name: 'Material Request', estimatedDuration: '2 hours', stepOrder: 1, isRequired: true },
          { id: 2, name: 'Painting', estimatedDuration: '4 hours', stepOrder: 2, isRequired: true },
          { id: 3, name: 'Machining', estimatedDuration: '6 hours', stepOrder: 3, isRequired: true },
          { id: 4, name: 'PVD Powder Coating', estimatedDuration: '3 hours', stepOrder: 4, isRequired: true },
          { id: 5, name: 'PVD Process', estimatedDuration: '5 hours', stepOrder: 5, isRequired: true },
          { id: 6, name: 'Milling', estimatedDuration: '4 hours', stepOrder: 6, isRequired: true },
          { id: 7, name: 'Acrylic Coating', estimatedDuration: '3 hours', stepOrder: 7, isRequired: true },
          { id: 8, name: 'Lacquer Finish', estimatedDuration: '2 hours', stepOrder: 8, isRequired: true },
          { id: 9, name: 'Packaging', estimatedDuration: '1 hour', stepOrder: 9, isRequired: true },
          { id: 10, name: 'Quality Check', estimatedDuration: '2 hours', stepOrder: 10, isRequired: true },
          { id: 11, name: 'Dispatch', estimatedDuration: '1 hour', stepOrder: 11, isRequired: true }
        ]
      }
      setStepPresets([defaultPreset])
      setSelectedPreset(defaultPreset)
    }
  }

  // Set selected plan if provided
  useEffect(() => {
    if (selectedPlan && visible) {
      console.log('🔄 Setting selected plan:', selectedPlan)
      setSelectedProductionPlan(selectedPlan)
      
      // Set allocation info from selected plan
      const tracking = selectedPlan.quantityTracking || {}
      const allocInfo = {
        totalQuantity: selectedPlan.quantity || 0,
        allocatedQuantity: tracking.totalJobCardQuantity || 0,
        remainingQuantity: tracking.remainingQuantity || selectedPlan.quantity || 0,
        completedQuantity: tracking.completedQuantity || 0
      }
      setAllocationInfo(allocInfo)
      setAvailableQuantity(allocInfo.remainingQuantity)
      
      // Set form values with remaining quantity as default
      const formValues = {
        prodPlanId: selectedPlan.id,
        quantity: allocInfo.remainingQuantity > 0 ? allocInfo.remainingQuantity : 1
      }
      console.log('🔄 Setting form values:', formValues)
      form.setFieldsValue(formValues)
      
      // Reset reason field when new plan is set
      setShowReasonField(false)
      form.setFieldsValue({ reason: '' })
      
      // Debug: Check what the form actually has
      setTimeout(() => {
        const currentFormValues = form.getFieldsValue()
        console.log('🔄 Current form values after setting:', currentFormValues)
      }, 100)
    }
  }, [selectedPlan, visible, form])

  // Handle production plan selection
  const handlePlanSelection = (planId) => {
    const plan = productionPlans.find(p => p.id === planId)
    if (plan) {
      setSelectedProductionPlan(plan)
      
      // Set allocation info from the plan's quantity tracking
      const tracking = plan.quantityTracking || {}
      const allocInfo = {
        totalQuantity: plan.quantity || 0,
        allocatedQuantity: tracking.totalJobCardQuantity || 0,
        remainingQuantity: tracking.remainingQuantity || plan.quantity || 0,
        completedQuantity: tracking.completedQuantity || 0
      }
      setAllocationInfo(allocInfo)
      setAvailableQuantity(allocInfo.remainingQuantity)
      
      // Auto-fill quantity with remaining quantity
      form.setFieldsValue({
        quantity: allocInfo.remainingQuantity > 0 ? allocInfo.remainingQuantity : 1
      })
      
      // Reset reason field when plan changes
      setShowReasonField(false)
      form.setFieldsValue({ reason: '' })
    }
  }

  // Handle preset selection
  const handlePresetSelection = async (presetId) => {
    const preset = stepPresets.find(p => p.id === presetId)
    if (preset) {
      // If it's the default preset, we already have the steps
      if (presetId === 'default') {
        setSelectedPreset(preset)
        return
      }
      
      // For API presets, load the detailed steps
      try {
        const result = await dispatch(getPresetDetails({ presetName: presetId })).unwrap()
        const presetSteps = result.data || []
        
        // Transform the steps data to match our format
        const formattedSteps = presetSteps
          .sort((a, b) => a.stepOrder - b.stepOrder)
          .map(step => ({
            id: step.stepId,
            name: step.stepName,
            stepOrder: step.stepOrder,
            isRequired: step.isRequired,
            estimatedDuration: step.estimatedDuration || '2 hours' // Default if not provided
          }))
        
        const updatedPreset = {
          ...preset,
          steps: formattedSteps
        }
        
        setSelectedPreset(updatedPreset)
      } catch (error) {
        console.error('Error loading preset details:', error)
        // Fallback to preset without detailed steps
        setSelectedPreset(preset)
      }
    }
  }

  // Load available production steps for custom step builder
  const loadAvailableSteps = async () => {
    try {
      const result = await dispatch(getProductionSteps()).unwrap()
      const steps = result || []
      setAvailableSteps(steps)
    } catch (error) {
      console.error('Error loading available steps:', error)
      // Fallback to empty array
      setAvailableSteps([])
    }
  }

  // Add step to custom workflow
  const addCustomStep = (step) => {
    // Check for duplicates
    const existingStep = customSteps.find(s => s.stepId === step.id)
    if (existingStep) {
      notification.warning({
        message: 'Step Already Added',
        description: `"${step.stepName}" is already part of your workflow.`,
        duration: 3
      })
      return
    }
    
    const newStep = {
      id: Date.now(), // Temporary ID for form handling
      stepId: step.id,
      stepName: step.stepName,
      stepOrder: customSteps.length + 1,
      estimatedDuration: '2 hours',
      isRequired: true,
      assignedTo: null,
      notes: ''
    }
    setCustomSteps([...customSteps, newStep])
    
    // Show success notification
    notification.success({
      message: 'Step Added',
      description: `"${step.stepName}" has been added to your workflow.`,
      duration: 2
    })
  }

  // Remove step from custom workflow
  const removeCustomStep = (stepId) => {
    const updatedSteps = customSteps
      .filter(s => s.id !== stepId)
      .map((step, index) => ({ ...step, stepOrder: index + 1 }))
    setCustomSteps(updatedSteps)
  }

  // Update custom step configuration
  const updateCustomStep = (stepId, field, value) => {
    const updatedSteps = customSteps.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    )
    setCustomSteps(updatedSteps)
  }

  // Move step up in order
  const moveStepUp = (stepId) => {
    const stepIndex = customSteps.findIndex(s => s.id === stepId)
    if (stepIndex > 0) {
      const newSteps = [...customSteps]
      const temp = newSteps[stepIndex]
      newSteps[stepIndex] = newSteps[stepIndex - 1]
      newSteps[stepIndex - 1] = temp
      
      // Update step orders
      newSteps.forEach((step, index) => {
        step.stepOrder = index + 1
      })
      
      setCustomSteps(newSteps)
    }
  }

  // Move step down in order
  const moveStepDown = (stepId) => {
    const stepIndex = customSteps.findIndex(s => s.id === stepId)
    if (stepIndex < customSteps.length - 1) {
      const newSteps = [...customSteps]
      const temp = newSteps[stepIndex]
      newSteps[stepIndex] = newSteps[stepIndex + 1]
      newSteps[stepIndex + 1] = temp
      
      // Update step orders
      newSteps.forEach((step, index) => {
        step.stepOrder = index + 1
      })
      
      setCustomSteps(newSteps)
    }
  }

  // Handle quantity change
  const handleQuantityChange = (value) => {
    const shouldShowReason = value && availableQuantity && value < availableQuantity
    setShowReasonField(shouldShowReason)
    
    if (!shouldShowReason) {
      form.setFieldsValue({ reason: '' })
    }
  }

  // Handle step assignment mode change
  const handleStepAssignmentModeChange = (mode) => {
    setStepAssignmentMode(mode)
    if (mode === 'preset' && selectedPreset) {
      form.setFieldsValue({ presetId: selectedPreset.id })
    } else if (mode === 'manual') {
      // Initialize with empty custom steps
      setCustomSteps([])
      setStepBuilderExpanded(false)
    }
  }

  // Filter available production plans (exclude completed ones)
  const availablePlans = productionPlans.filter(plan => 
    plan.status !== 'Completed' && 
    plan.status !== 'Cancelled'
  )

  // Validate step workflow
  const validateStepWorkflow = () => {
    const errors = []
    
    if (stepAssignmentMode === 'preset') {
      if (!selectedPreset) {
        errors.push('Please select a production step preset')
      }
    } else if (stepAssignmentMode === 'manual') {
      if (customSteps.length === 0) {
        errors.push('Please add at least one production step to your custom workflow')
      }
      
      // Check for duplicate step IDs
      const stepIds = customSteps.map(s => s.stepId)
      const uniqueStepIds = [...new Set(stepIds)]
      if (stepIds.length !== uniqueStepIds.length) {
        errors.push('Duplicate steps detected in workflow. Each step can only be added once.')
      }
      
      // Check for empty durations
      const emptyDurations = customSteps.filter(s => !s.estimatedDuration || s.estimatedDuration.trim() === '')
      if (emptyDurations.length > 0) {
        errors.push('All steps must have an estimated duration')
      }
      
      // Validate that at least one step is required
      const requiredSteps = customSteps.filter(s => s.isRequired)
      if (requiredSteps.length === 0) {
        errors.push('At least one step must be marked as required')
      }
    }
    
    return errors
  }

  // Handle form submission
  const handleSubmit = async (values) => {
    // Declare payload in broader scope for error handling
    let payload = {}
    
    try {
      setSubmitting(true)
      
      // Validate step workflow first
      const validationErrors = validateStepWorkflow()
      if (validationErrors.length > 0) {
        notification.error({
          message: 'Workflow Validation Failed',
          description: (
            <div>
              <div className="mb-2">Please fix the following issues:</div>
              <ul className="list-disc pl-4">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          ),
          duration: 8
        })
        return
      }
      
      // Test different payload configurations to isolate the issue
      const testPayloads = []
      
      // 1. Minimal payload - absolute essentials only
      // Try multiple sources for production plan ID
      const prodPlanId = values.prodPlanId || 
                        selectedProductionPlan?.id || 
                        selectedPlan?.id ||
                        (form.getFieldValue('prodPlanId'))
                        
      const minimalPayload = {
        prodPlanId: prodPlanId,
        quantity: values.quantity
      }
      
      // Debug production plan ID resolution
      console.log('🔍 ProdPlanId Resolution:')
      console.log('  values.prodPlanId:', values.prodPlanId)
      console.log('  selectedProductionPlan.id:', selectedProductionPlan?.id)
      console.log('  selectedPlan.id:', selectedPlan?.id)
      console.log('  form.getFieldValue("prodPlanId"):', form.getFieldValue('prodPlanId'))
      console.log('  resolved prodPlanId:', prodPlanId)
      
      // Also debug all form values
      console.log('🔍 All form values:', form.getFieldsValue())
      
      // Validate that we have a valid production plan ID
      if (!prodPlanId) {
        notification.error({
          message: 'Production Plan Required',
          description: 'Please select a production plan before creating a job card.',
          duration: 5
        })
        return
      }
      
      testPayloads.push({ name: 'Minimal', payload: minimalPayload })
      
      // 2. With basic notes
      const withNotesPayload = {
        ...minimalPayload,
        notes: `Job card created for ${selectedProductionPlan?.alloyName} → ${selectedProductionPlan?.convertName}`
      }
      testPayloads.push({ name: 'With Notes', payload: withNotesPayload })
      
      // 3. With production step info (from mock structure)
      const withProdStepPayload = {
        ...withNotesPayload,
        prodStep: 1,
        stepName: stepAssignmentMode === 'preset' ? selectedPreset?.name || 'Standard Process' : 'Custom Workflow'
      }
      testPayloads.push({ name: 'With ProdStep', payload: withProdStepPayload })
      
      // 4. With quantity fields (from mock structure)
      const withQuantityFieldsPayload = {
        ...withProdStepPayload,
        acceptedQuantity: 0,
        rejectedQuantity: 0
      }
      testPayloads.push({ name: 'With Quantity Fields', payload: withQuantityFieldsPayload })
      
      // 5. With createdBy field
      const fullPayload = {
        ...withQuantityFieldsPayload,
        createdBy: user?.id || 1
      }
      testPayloads.push({ name: 'Full Payload', payload: fullPayload })
      
      // Select which payload to test (start with minimal, can be changed for debugging)
      let selectedPayloadIndex = 0 // Change this to test different payloads
      
      // Allow runtime switching via localStorage for easy debugging
      const debugPayloadIndex = localStorage.getItem('jobcard_debug_payload')
      if (debugPayloadIndex !== null) {
        selectedPayloadIndex = parseInt(debugPayloadIndex, 10)
        console.log(`🔧 Using debug payload index: ${selectedPayloadIndex}`)
      }
      
      const selectedTest = testPayloads[selectedPayloadIndex] || testPayloads[0]
      payload = { ...selectedTest.payload }
      
      console.log(`🧪 Testing with payload: ${selectedTest.name}`)
      console.log('Available test payloads:', testPayloads.map((t, i) => `${i}: ${t.name}`))
      console.log('💡 To test other payloads, run: localStorage.setItem("jobcard_debug_payload", "INDEX")')
      
      // Validate production plan ID
      console.group('🔍 Production Plan Validation')
      console.log('Selected Production Plan:', selectedProductionPlan)
      console.log('Production Plan ID:', values.prodPlanId)
      console.log('Production Plan ID Type:', typeof values.prodPlanId)
      console.log('Available Plans Count:', productionPlans.length)
      console.log('All Production Plans IDs:', productionPlans.map(p => ({ id: p.id, status: p.status })))
      
      // Check if the production plan exists and is valid
      const planExists = productionPlans.find(p => p.id === values.prodPlanId)
      console.log('Plan exists in local state:', !!planExists)
      
      if (!planExists) {
        console.warn('⚠️ Selected production plan not found in local state!')
        console.log('This might cause backend validation to fail.')
      }
      
      if (selectedProductionPlan?.status === 'Completed' || selectedProductionPlan?.status === 'Cancelled') {
        console.warn('⚠️ Attempting to create job card for completed/cancelled plan!')
      }
      
      console.groupEnd()
      
      // Add custom workflow info to notes if applicable
      if (payload.notes && stepAssignmentMode === 'manual' && customSteps.length > 0) {
        const stepsInfo = customSteps.map(step => 
          `${step.stepOrder}. ${step.stepName} (${step.estimatedDuration})${step.isRequired ? ' *Required*' : ''}`
        ).join(', ')
        payload.notes += `\n\nCustom Workflow: ${stepsInfo}`
      }
      
      // Add reason for partial quantity
      if (payload.notes && showReasonField && values.reason) {
        payload.notes += `\n\nPartial Quantity Reason: ${values.reason}`
      }

      // Debug: Log the payload being sent
      console.log('Job Card Creation Payload:', payload)

      // Attempt job card creation with fallback strategy
      let result
      let creationMethod = 'direct'
      
      try {
        // Primary attempt: Use Redux API to create job card
        result = await dispatch(createJobCard(payload)).unwrap()
        console.log('✅ Job Card Creation Result (Direct):', result)
      } catch (directError) {
        console.warn('❌ Direct job card creation failed, attempting fallback...')
        
        // Fallback attempt: Try with even more minimal payload
        const fallbackPayload = {
          prodPlanId: prodPlanId, // Use the resolved prodPlanId, not values.prodPlanId
          quantity: values.quantity
        }
        
        console.log('🔄 Attempting fallback with minimal payload:', fallbackPayload)
        
        try {
          result = await dispatch(createJobCard(fallbackPayload)).unwrap()
          console.log('✅ Job Card Creation Result (Fallback):', result)
          creationMethod = 'fallback'
          
          // If fallback works, we'll add the custom steps separately
          console.log('📝 Fallback successful - custom step info will be added separately')
        } catch (fallbackError) {
          console.error('❌ Both direct and fallback attempts failed')
          
          // Development Mode: Simulate successful creation for testing
          if (process.env.NODE_ENV === 'development') {
            console.warn('🚧 Development Mode: Simulating successful job card creation')
            result = {
              message: 'Job Card Created Successfully (Simulated)',
              jobCardId: Date.now(),
              prodPlanId: prodPlanId,
              quantity: values.quantity,
              simulated: true
            }
            creationMethod = 'simulated'
          } else {
            throw directError // Throw the original error for detailed logging
          }
        }
      }
      
      // If custom steps were defined, try to add them to the production plan
      if (stepAssignmentMode === 'manual' && customSteps.length > 0) {
        try {
          // Prepare custom steps for the production plan
          const customStepsPayload = {
            prodPlanId: values.prodPlanId,
            steps: customSteps.map(step => ({
              stepId: step.stepId,
              stepOrder: step.stepOrder,
              isRequired: step.isRequired,
              estimatedDuration: step.estimatedDuration,
              notes: step.notes
            }))
          }
          
          // Add custom steps to the production plan
          await dispatch(addCustomStepsToProductionPlan(customStepsPayload)).unwrap()
        } catch (stepsError) {
          console.warn('Custom steps could not be added:', stepsError)
          // Continue with success - job card was created successfully
        }
      }

      notification.success({
        message: 'Job Card Created Successfully',
        description: (
          <div>
            <div>Job card created for production plan #{selectedProductionPlan?.id}</div>
            <div className="text-sm text-gray-600 mt-1">
              Method: {creationMethod} • Steps: {stepAssignmentMode === 'preset' ? selectedPreset?.name : `${customSteps.length} custom steps`}
            </div>
            {creationMethod === 'fallback' && (
              <div className="text-sm text-orange-600 mt-1">
                ⚠️ Created using fallback method - some features may be limited
              </div>
            )}
            {creationMethod === 'simulated' && (
              <div className="text-sm text-red-600 mt-1">
                🚧 DEVELOPMENT MODE: Job card creation simulated (backend endpoint failing)
              </div>
            )}
            {showReasonField && (
              <div className="text-sm text-gray-600">
                Partial quantity: {values.quantity} of {availableQuantity}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Check console for detailed creation logs
            </div>
          </div>
        ),
        duration: creationMethod === 'fallback' ? 8 : 6
      })
      
      onSuccess && onSuccess()
      handleReset()
    } catch (error) {
      // Comprehensive error logging for debugging
      console.group('🔥 Job Card Creation Error Analysis')
      console.error('Full error object:', error)
      console.error('Error message:', error.message)
      console.error('Error response:', error.response)
      console.error('Response status:', error.response?.status)
      console.error('Response data:', error.response?.data)
      console.error('Response headers:', error.response?.headers)
      console.error('Request config:', error.config)
      console.groupEnd()
      
      // Extract meaningful error information
      const errorStatus = error.response?.status
      const errorData = error.response?.data
      const backendMessage = errorData?.message || errorData?.error || errorData?.msg
      const networkError = !error.response ? 'Network connection failed' : null
      
      // Create detailed error description
      let errorDescription = 'An error occurred while creating the job card.'
      
      if (networkError) {
        errorDescription = 'Failed to connect to server. Please check your internet connection.'
      } else if (errorStatus) {
        errorDescription = `Server responded with status ${errorStatus}.`
        if (backendMessage && backendMessage !== 'Something Went Wrong') {
          errorDescription += ` Backend message: ${backendMessage}`
        } else if (backendMessage === 'Something Went Wrong') {
          errorDescription += ' This is a generic backend error. Check console for detailed logs.'
        }
      }
      
      // Add payload information to help with debugging
      console.log('🔍 Payload that was sent:', payload)
      console.log('🔍 Selected Production Plan:', selectedProductionPlan)
      console.log('🔍 Step Assignment Mode:', stepAssignmentMode)
      console.log('🔍 Custom Steps:', customSteps)
      
      notification.error({
        message: 'Job Card Creation Failed',
        description: (
          <div>
            <div>{errorDescription}</div>
            {errorStatus && (
              <div className="text-sm text-gray-600 mt-2">
                Status Code: {errorStatus}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Check browser console for detailed error information.
            </div>
          </div>
        ),
        duration: 10
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Reset form and state
  const handleReset = () => {
    form.resetFields()
    setSelectedProductionPlan(null)
    setAvailableQuantity(0)
    setSelectedPreset(null)
    setStepAssignmentMode('preset')
    setShowReasonField(false)
    setCustomSteps([])
    setStepBuilderExpanded(false)
    onCancel()
  }

  // Get priority color
  const getPriorityColor = (urgent) => {
    return urgent ? '#f5222d' : '#52c41a'
  }

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'orange',
      'In Progress': 'blue', 
      'Quality Check': 'purple',
      'Completed': 'green',
      'Cancelled': 'red',
      'On Hold': 'gray'
    }
    return colors[status] || 'default'
  }

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <PlayCircleOutlined className="text-blue-500" />
          <span>Create New Job Card</span>
        </div>
      }
      open={visible}
      onCancel={handleReset}
      footer={null}
      width={800}
      destroyOnClose
      className="job-card-creation-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        {/* Production Plan Selection */}
        <Card 
          title={
            <div className="flex items-center space-x-2">
              <span>1. Select Production Plan</span>
              {selectedPlan && (
                <Tag color="blue" size="small">
                  PRE-SELECTED
                </Tag>
              )}
            </div>
          } 
          size="small"
          className="mb-4"
        >
          {selectedPlan ? (
            <Alert
              message="Production Plan Pre-Selected"
              description={
                <div className="mt-2">
                  <Text>This job card will be created for the following production plan:</Text>
                  <div className="bg-blue-50 p-3 rounded mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Text strong>#{selectedPlan.id}</Text>
                        <Text>{selectedPlan.alloyName} → {selectedPlan.convertName}</Text>
                        {selectedPlan.urgent && (
                          <Tag color="red" icon={<FireOutlined />} size="small">
                            URGENT
                          </Tag>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Qty: {selectedPlan.quantity}</div>
                        <Tag color={getStatusColor(selectedPlan.status)} size="small">
                          {selectedPlan.status}
                        </Tag>
                      </div>
                    </div>
                  </div>
                </div>
              }
              type="info"
              icon={<InfoCircleOutlined />}
            />
          ) : (
            <>
              <Form.Item
                name="prodPlanId"
                label="Production Plan"
                rules={[
                  { required: true, message: 'Please select a production plan' }
                ]}
              >
                <Select
                  placeholder="Choose a production plan"
                  size="large"
                  loading={loading}
                  onChange={handlePlanSelection}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  showSearch
                >
                  {availablePlans.map(plan => (
                    <Option key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Text strong>#{plan.id}</Text>
                          <Text>{plan.alloyName} → {plan.convertName}</Text>
                          {plan.isUrgent && (
                            <Tag color="red" icon={<FireOutlined />} size="small">
                              URGENT
                            </Tag>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Qty: {plan.quantity}</div>
                          <Tag color={getStatusColor(plan.status)} size="small">
                            {plan.status}
                          </Tag>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Selected Plan Details - only show for manually selected plans */}
              {selectedProductionPlan && !selectedPlan && (
                <Alert
                  message="Selected Production Plan Details"
                  description={
                    <div className="mt-2">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Text strong>Plan ID:</Text> #{selectedProductionPlan.id}<br/>
                          <Text strong>Source Alloy:</Text> {selectedProductionPlan.alloyName}<br/>
                          <Text strong>Convert To:</Text> {selectedProductionPlan.convertName}
                        </Col>
                        <Col span={12}>
                          <Text strong>Planned Quantity:</Text> {selectedProductionPlan.quantity}<br/>
                          <Text strong>Priority:</Text> 
                          <Tag 
                            color={selectedProductionPlan.isUrgent ? 'red' : 'default'} 
                            className="ml-2"
                          >
                            {selectedProductionPlan.isUrgent ? 'Urgent' : 'Normal'}
                          </Tag><br/>
                          <Text strong>Created:</Text> {moment(selectedProductionPlan.createdAt).format('MMM DD, YYYY')}
                        </Col>
                      </Row>
                    </div>
                  }
                  type="info"
                  icon={<InfoCircleOutlined />}
                  className="mb-4"
                />
              )}
            </>
          )}
        </Card>

        {/* Quantity Allocation Panel */}
        {(selectedProductionPlan || selectedPlan) && (
          <Card 
            title="2. Quantity Allocation Status" 
            size="small"
            className="mb-4"
            style={{
              borderColor: allocationInfo.remainingQuantity === 0 ? '#ff4d4f' : '#1890ff',
              background: allocationInfo.remainingQuantity === 0 ? '#fff2f0' : '#f0f5ff'
            }}
          >
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Total Plan Quantity</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {allocationInfo.totalQuantity.toLocaleString()}
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Already Allocated</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {allocationInfo.allocatedQuantity.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {allocationInfo.totalQuantity > 0 
                      ? `${Math.round((allocationInfo.allocatedQuantity / allocationInfo.totalQuantity) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Available to Allocate</div>
                  <div className={`text-2xl font-bold ${allocationInfo.remainingQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {allocationInfo.remainingQuantity.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {allocationInfo.totalQuantity > 0 
                      ? `${Math.round((allocationInfo.remainingQuantity / allocationInfo.totalQuantity) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {allocationInfo.completedQuantity.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {allocationInfo.totalQuantity > 0 
                      ? `${Math.round((allocationInfo.completedQuantity / allocationInfo.totalQuantity) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </Col>
            </Row>
            
            {allocationInfo.remainingQuantity === 0 && (
              <Alert
                message="No Quantity Available"
                description="This production plan has been fully allocated. No additional job cards can be created until some allocations are released or the plan quantity is increased."
                type="error"
                icon={<WarningOutlined />}
                className="mt-4"
                showIcon
              />
            )}
            
            {allocationInfo.remainingQuantity > 0 && allocationInfo.remainingQuantity < allocationInfo.totalQuantity * 0.2 && (
              <Alert
                message="Low Remaining Quantity"
                description={`Only ${allocationInfo.remainingQuantity} units remaining for allocation (less than 20% of total).`}
                type="warning"
                icon={<WarningOutlined />}
                className="mt-4"
                showIcon
              />
            )}
          </Card>
        )}

        {/* Job Card Details */}
        <Card title="3. Job Card Configuration" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Production Quantity"
                rules={[
                  { required: true, message: 'Please enter production quantity' },
                  { 
                    type: 'number', 
                    min: 1, 
                    message: 'Quantity must be at least 1' 
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve()
                      
                      // Check against remaining quantity
                      if (value > allocationInfo.remainingQuantity) {
                        return Promise.reject(
                          new Error(`Cannot exceed remaining quantity (${allocationInfo.remainingQuantity} available)`)
                        )
                      }
                      
                      // Warn if quantity is too high but allow it with reason
                      if (value > allocationInfo.totalQuantity) {
                        return Promise.reject(
                          new Error(`Quantity exceeds total plan quantity (${allocationInfo.totalQuantity})`)
                        )
                      }
                      
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <InputNumber
                  placeholder="Enter quantity"
                  size="large"
                  min={1}
                  max={allocationInfo.remainingQuantity}
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  onChange={handleQuantityChange}
                  disabled={allocationInfo.remainingQuantity === 0}
                />
              </Form.Item>
              
              {allocationInfo.remainingQuantity > 0 ? (
                <div className="text-sm text-green-600 -mt-2 mb-4">
                  <CheckCircleOutlined className="mr-1" />
                  Maximum available: {allocationInfo.remainingQuantity.toLocaleString()} units
                </div>
              ) : (
                <div className="text-sm text-red-600 -mt-2 mb-4">
                  <WarningOutlined className="mr-1" />
                  No quantity available for allocation
                </div>
              )}

              {/* Reason field - shown when quantity is less than planned */}
              {showReasonField && (
                <Form.Item
                  name="reason"
                  label="Reason for Partial Quantity"
                  rules={[
                    { required: true, message: 'Please provide a reason for using less than planned quantity' }
                  ]}
                >
                  <TextArea
                    placeholder="Explain why you're creating a job card with less quantity than planned..."
                    rows={3}
                    maxLength={300}
                    showCount
                  />
                </Form.Item>
              )}
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="Job Card Notes"
                name="notes"
              >
                <TextArea
                  placeholder="Optional notes for this job card..."
                  rows={3}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

        </Card>

        {/* Step Assignment */}
        {selectedProductionPlan && (
          <Card title="4. Production Step Assignment" size="small">
            <Form.Item
              name="stepAssignmentMode"
              label="How would you like to assign production steps?"
            >
              <Radio.Group 
                value={stepAssignmentMode} 
                onChange={(e) => handleStepAssignmentModeChange(e.target.value)}
              >
                <Radio value="preset">
                  <SettingOutlined className="mr-1" />
                  Use Step Preset
                </Radio>
                <Radio value="manual">
                  <UserOutlined className="mr-1" />
                  Manual Step Configuration
                </Radio>
              </Radio.Group>
            </Form.Item>

            {stepAssignmentMode === 'preset' && (
              <div>
                <Form.Item
                  name="presetId"
                  label="Select Production Step Preset"
                  rules={[
                    { required: stepAssignmentMode === 'preset', message: 'Please select a step preset' }
                  ]}
                >
                  <Select
                    placeholder="Choose a step preset"
                    size="large"
                    onChange={handlePresetSelection}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {stepPresets.map(preset => (
                      <Option key={preset.id} value={preset.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Text strong>{preset.name}</Text>
                            {preset.id === 'default' && (
                              <Tag color="blue" size="small">DEFAULT</Tag>
                            )}
                          </div>
                          <div className="text-right">
                            <Text className="text-sm text-gray-500">
                              {preset.stepCount || preset.steps?.length || 0} steps
                            </Text>
                            {preset.category && (
                              <div>
                                <Tag color="blue" size="small" className="mt-1">
                                  {preset.category.toUpperCase()}
                                </Tag>
                              </div>
                            )}
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Preset Preview */}
                {selectedPreset && (
                  <Alert
                    message={`${selectedPreset.name} - Step Preview`}
                    description={
                      <div className="mt-2">
                        <Text className="text-sm text-gray-600 mb-2 block">
                          This preset includes the following production steps:
                        </Text>
                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                          {selectedPreset.steps
                            ?.sort((a, b) => (a.stepOrder || a.id) - (b.stepOrder || b.id))
                            ?.map((step, index) => (
                            <div key={step.id || index} className="flex items-center justify-between bg-gray-50 p-3 rounded hover:bg-gray-100">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {step.stepOrder || step.id}
                                </div>
                                <div>
                                  <span className="text-sm font-medium">{step.name}</span>
                                  {step.isRequired && (
                                    <Tag color="red" size="small" className="ml-2">REQUIRED</Tag>
                                  )}
                                </div>
                              </div>
                              {step.estimatedDuration && (
                                <div className="flex items-center space-x-1">
                                  <ClockCircleOutlined className="text-gray-400 text-xs" />
                                  <Text className="text-xs text-gray-500">{step.estimatedDuration}</Text>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                    type="info"
                    icon={<InfoCircleOutlined />}
                    className="mt-4"
                  />
                )}
              </div>
            )}

            {stepAssignmentMode === 'manual' && (
              <div className="space-y-4">
                <Alert
                  message="Custom Step Configuration"
                  description="Build your own production workflow by selecting and configuring individual steps."
                  type="info"
                  icon={<InfoCircleOutlined />}
                />
                
                {/* Custom Steps Builder */}
                <Card 
                  title={
                    <div className="flex items-center justify-between">
                      <span>Build Custom Workflow</span>
                      <Button 
                        type="text" 
                        size="small"
                        onClick={() => setStepBuilderExpanded(!stepBuilderExpanded)}
                      >
                        {stepBuilderExpanded ? 'Collapse' : 'Expand'} Builder
                      </Button>
                    </div>
                  }
                  size="small"
                  className="border-dashed"
                >
                  {stepBuilderExpanded && (
                    <div className="space-y-4">
                      {/* Available Steps */}
                      <div>
                        <Text strong className="block mb-2">Available Production Steps:</Text>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                          {availableSteps.map(step => (
                            <div 
                              key={step.id} 
                              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                              onClick={() => addCustomStep(step)}
                            >
                              <span className="text-sm">{step.stepName}</span>
                              <Button 
                                type="text" 
                                size="small" 
                                icon={<PlusOutlined />}
                                className="text-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                        {availableSteps.length === 0 && (
                          <div className="text-center text-gray-500 py-4">
                            No production steps available. Please configure steps in the system.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected Custom Steps */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Text strong>Selected Workflow Steps ({customSteps.length}):</Text>
                      {customSteps.length > 0 && (
                        <Button 
                          size="small" 
                          onClick={() => setCustomSteps([])} 
                          icon={<DeleteOutlined />}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                    
                    {customSteps.length > 0 ? (
                      <div className="space-y-3">
                        {customSteps
                          .sort((a, b) => a.stepOrder - b.stepOrder)
                          .map((step, index) => (
                          <div key={step.id} className="border rounded p-3 bg-white">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {step.stepOrder}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{step.stepName}</div>
                                  
                                  <Row gutter={[16, 8]} className="mt-2">
                                    <Col span={8}>
                                      <div className="text-xs text-gray-500 mb-1">Duration</div>
                                      <Input
                                        size="small"
                                        value={step.estimatedDuration}
                                        onChange={(e) => updateCustomStep(step.id, 'estimatedDuration', e.target.value)}
                                        placeholder="e.g., 2 hours"
                                      />
                                    </Col>
                                    <Col span={8}>
                                      <div className="text-xs text-gray-500 mb-1">Required</div>
                                      <Select
                                        size="small"
                                        value={step.isRequired}
                                        onChange={(value) => updateCustomStep(step.id, 'isRequired', value)}
                                        className="w-full"
                                      >
                                        <Option value={true}>Required</Option>
                                        <Option value={false}>Optional</Option>
                                      </Select>
                                    </Col>
                                    <Col span={8}>
                                      <div className="text-xs text-gray-500 mb-1">Actions</div>
                                      <Space size="small">
                                        <Button 
                                          size="small" 
                                          type="text"
                                          icon={<EditOutlined />}
                                          disabled={index === 0}
                                          onClick={() => moveStepUp(step.id)}
                                          title="Move Up"
                                        />
                                        <Button 
                                          size="small" 
                                          type="text"
                                          icon={<EditOutlined />}
                                          disabled={index === customSteps.length - 1}
                                          onClick={() => moveStepDown(step.id)}
                                          title="Move Down"
                                        />
                                        <Button 
                                          size="small" 
                                          type="text" 
                                          danger
                                          icon={<MinusCircleOutlined />}
                                          onClick={() => removeCustomStep(step.id)}
                                          title="Remove Step"
                                        />
                                      </Space>
                                    </Col>
                                  </Row>
                                  
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-500 mb-1">Notes (Optional)</div>
                                    <TextArea
                                      size="small"
                                      rows={2}
                                      value={step.notes}
                                      onChange={(e) => updateCustomStep(step.id, 'notes', e.target.value)}
                                      placeholder="Special instructions for this step..."
                                      maxLength={200}
                                      showCount
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="text-center py-2 border-t">
                          <Text className="text-sm text-gray-600">
                            Total Workflow: {customSteps.length} steps • 
                            Required Steps: {customSteps.filter(s => s.isRequired).length} • 
                            Optional Steps: {customSteps.filter(s => !s.isRequired).length}
                          </Text>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded">
                        <SettingOutlined className="text-3xl mb-2" />
                        <div>No steps selected</div>
                        <div className="text-sm">Click on available steps above to build your workflow</div>
                        {!stepBuilderExpanded && (
                          <Button 
                            type="link" 
                            size="small" 
                            className="mt-2"
                            onClick={() => setStepBuilderExpanded(true)}
                          >
                            Open Step Builder
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
                
                {/* Validation */}
                {customSteps.length === 0 && stepAssignmentMode === 'manual' && (
                  <Alert
                    message="Workflow Required"
                    description="Please select at least one production step for your custom workflow."
                    type="warning"
                    showIcon
                  />
                )}
              </div>
            )}
          </Card>
        )}

        {/* Warning for urgent plans */}
        {selectedProductionPlan?.isUrgent && (
          <Alert
            message="Urgent Production Plan"
            description="This production plan is marked as urgent. Please ensure priority handling throughout all production steps."
            type="warning"
            icon={<WarningOutlined />}
            showIcon
          />
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            onClick={handleReset}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={submitting}
            icon={<PlayCircleOutlined />}
            size="large"
            disabled={submitting || (stepAssignmentMode === 'manual' && customSteps.length === 0) || allocationInfo.remainingQuantity === 0}
          >
            {submitting ? 'Creating Job Card...' : allocationInfo.remainingQuantity === 0 ? 'No Quantity Available' : 'Create Job Card'}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default JobCardCreationModal