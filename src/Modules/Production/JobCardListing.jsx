import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Progress,
  Tooltip,
  Badge,
  Typography,
  Row,
  Col,
  Statistic,
  Modal,
  notification,
  Dropdown,
  Menu
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ToolOutlined,
  ArrowRightOutlined,
  MoreOutlined,
  ExportOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'

import Layout from '../Layout/layout'
import JobCardCreationModal from './JobCardCreationModal'
import JobCardDetailsModal from './JobCardDetailsModal'
import { getJobCardsWithDetails, getProductionPlansWithQuantities, updateJobCardProgress } from '../../redux/api/productionAPI'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { confirm } = Modal

// Production Steps Configuration
const PRODUCTION_STEPS = [
  { id: 1, name: 'Material Request', color: '#722ed1', icon: '📦' },
  { id: 2, name: 'Painting', color: '#eb2f96', icon: '🎨' },
  { id: 3, name: 'Machining', color: '#faad14', icon: '⚙️' },
  { id: 4, name: 'PVD Powder Coating', color: '#fa8c16', icon: '🔧' },
  { id: 5, name: 'PVD Process', color: '#a0d911', icon: '⚡' },
  { id: 6, name: 'Milling', color: '#52c41a', icon: '🏭' },
  { id: 7, name: 'Acrylic Coating', color: '#13c2c2', icon: '💧' },
  { id: 8, name: 'Lacquer Finish', color: '#1890ff', icon: '✨' },
  { id: 9, name: 'Packaging', color: '#2f54eb', icon: '📋' },
  { id: 10, name: 'Quality Check', color: '#f5222d', icon: '🔍' },
  { id: 11, name: 'Dispatch', color: '#389e0d', icon: '🚚' }
]

const JobCardListing = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state
  const { user } = useSelector(state => state.userDetails || {})

  // Local state
  const [jobCards, setJobCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStep, setSelectedStep] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [dateRange, setDateRange] = useState(null)
  
  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [selectedJobCard, setSelectedJobCard] = useState(null)

  // Load job cards and production plans with allocation details
  const loadJobCards = async () => {
    try {
      setLoading(true)
      
      // Get job cards with enhanced details
      const jobCardResult = await dispatch(getJobCardsWithDetails({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: selectedStatus === 'all' ? null : selectedStatus
      })).unwrap()
      
      // Get production plans with quantity tracking to enhance job cards
      const plansResult = await dispatch(getProductionPlansWithQuantities({
        page: 1,
        limit: 100
      })).unwrap()
      
      // Create a map of production plans for quick lookup
      const plansMap = {}
      if (plansResult?.productionPlans) {
        plansResult.productionPlans.forEach(plan => {
          plansMap[plan.id] = plan
        })
      }
      
      // Enhance job cards with production plan allocation details
      let enhancedJobCards = (jobCardResult.jobCards || []).map(jc => {
        const plan = plansMap[jc.prodPlanId] || {}
        const tracking = plan.quantityTracking || {}
        
        return {
          ...jc,
          // Plan details
          alloyName: jc.alloyName || plan.alloyName || 'Unknown Alloy',
          convertName: jc.convertName || plan.convertName || 'Unknown Conversion',
          isUrgent: jc.isUrgent || plan.urgent || false,
          
          // Allocation details
          planTotalQuantity: plan.quantity || 0,
          planAllocatedQuantity: tracking.totalJobCardQuantity || 0,
          planRemainingQuantity: tracking.remainingQuantity || 0,
          planCompletedQuantity: tracking.completedQuantity || 0,
          allocationPercentage: plan.quantity > 0 
            ? Math.round((jc.quantity / plan.quantity) * 100) 
            : 0
        }
      })
      
      // Apply local filtering if needed
      let filteredJobCards = enhancedJobCards
      
      if (searchTerm && !jobCardResult.jobCards) {
        // Only apply local search if API didn't handle it
        filteredJobCards = filteredJobCards.filter(jc =>
          jc.alloyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jc.convertName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jc.id?.toString().includes(searchTerm)
        )
      }
      
      // Update total count from API response
      setTotalCount(jobCardResult.totalCount || filteredJobCards.length)
      
      if (selectedStep !== 'all') {
        filteredJobCards = filteredJobCards.filter(jc => 
          jc.prodStep?.toString() === selectedStep
        )
      }
      
      if (selectedPriority !== 'all') {
        filteredJobCards = filteredJobCards.filter(jc =>
          selectedPriority === 'urgent' ? jc.isUrgent : !jc.isUrgent
        )
      }
      
      setJobCards(filteredJobCards)
      
      if (filteredJobCards.length === 0) {
        // No job cards found, show sample data
        notification.info({
          message: 'No Job Cards Found',
          description: 'No job cards exist in the system yet. Showing sample data for demonstration.',
          duration: 4
        })
        loadSampleJobCards()
      }
      
    } catch (error) {
      console.error('Job Cards Loading Error:', error)
      
      notification.info({
        message: 'Loading Sample Data',
        description: 'Using sample job cards for development. Real job cards will appear once created.',
        duration: 4
      })
      
      loadSampleJobCards()
    } finally {
      setLoading(false)
    }
  }

  // Load sample data for development mode
  const loadSampleJobCards = () => {
    const sampleData = [
      {
        id: 1,
        prodPlanId: 101,
        alloyName: 'Chrome Finish Alloy 18"',
        convertName: 'Diamond Cut Finish',
        quantity: 500,
        prodStep: 3,
        isUrgent: true,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        presetName: 'Standard 11-Step Process',
        stepAssignmentMode: 'preset',
        isPartialQuantity: false,
        createdAt: new Date().toISOString(),
        createdBy: 'System Demo'
      },
      {
        id: 2,
        prodPlanId: 102,
        alloyName: 'Silver Alloy 17"',
        convertName: 'Black Finish',
        quantity: 300,
        prodStep: 7,
        isUrgent: false,
        acceptedQuantity: 280,
        rejectedQuantity: 20,
        rejectionReason: 'Surface defects',
        presetName: 'Fast Track Process',
        stepAssignmentMode: 'preset',
        isPartialQuantity: true,
        reason: 'Customer requested reduced quantity for initial batch',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: 'John Doe'
      },
      {
        id: 3,
        prodPlanId: 103,
        alloyName: 'Gunmetal Alloy 19"',
        convertName: 'Chrome Finish',
        quantity: 200,
        prodStep: 11,
        isUrgent: false,
        acceptedQuantity: 200,
        rejectedQuantity: 0,
        presetName: 'Standard 11-Step Process',
        stepAssignmentMode: 'preset',
        isPartialQuantity: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        createdBy: 'Jane Smith'
      },
      {
        id: 4,
        prodPlanId: 104,
        alloyName: 'Anthracite Alloy 20"',
        convertName: 'Silver Finish',
        quantity: 150,
        prodStep: 1,
        isUrgent: true,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        presetName: 'Custom Steps',
        stepAssignmentMode: 'manual',
        isPartialQuantity: true,
        reason: 'Material shortage requires smaller batch size',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        createdBy: 'Production Team'
      }
    ]
    
    // Filter sample data based on current filters
    let filteredSample = sampleData
    
    if (searchTerm) {
      filteredSample = filteredSample.filter(item =>
        item.alloyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.convertName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toString().includes(searchTerm)
      )
    }
    
    if (selectedStep !== 'all') {
      filteredSample = filteredSample.filter(item => item.prodStep.toString() === selectedStep)
    }
    
    if (selectedPriority !== 'all') {
      filteredSample = filteredSample.filter(item => 
        selectedPriority === 'urgent' ? item.isUrgent : !item.isUrgent
      )
    }
    
    setJobCards(filteredSample)
    setTotalCount(filteredSample.length)
  }

  // Load data on mount and when filters change
  useEffect(() => {
    loadJobCards()
  }, [currentPage, pageSize, searchTerm, selectedStep, selectedStatus, selectedPriority, dateRange])

  // Get processing priority
  const getProcessingPriority = (record) => {
    const now = moment()
    const created = moment(record.createdAt)
    const hoursOld = now.diff(created, 'hours')
    
    if (record.isUrgent) return 'CRITICAL'
    if (record.prodStep >= 10) return 'QA_READY' // Ready for QA
    if (hoursOld > 48) return 'DELAYED'
    if (hoursOld > 24) return 'HIGH'
    return 'NORMAL'
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'CRITICAL': '#ff4d4f',
      'DELAYED': '#ff7a45',
      'HIGH': '#faad14',
      'QA_READY': '#52c41a',
      'NORMAL': '#1890ff'
    }
    return colors[priority] || '#1890ff'
  }

  // Get next action description
  const getNextAction = (record) => {
    if (record.prodStep >= 11) return 'Complete - Ready for Dispatch'
    if (record.prodStep === 10) return 'Pending Quality Check'
    
    const nextStep = PRODUCTION_STEPS.find(s => s.id === record.prodStep + 1)
    return `Process: ${nextStep?.name || 'Unknown Step'}`
  }

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = jobCards.length
    const inProgress = jobCards.filter(jc => jc.prodStep > 1 && jc.prodStep < 11).length
    const completed = jobCards.filter(jc => jc.prodStep === 11).length
    const urgent = jobCards.filter(jc => jc.isUrgent).length
    const critical = jobCards.filter(jc => getProcessingPriority(jc) === 'CRITICAL').length
    const delayed = jobCards.filter(jc => getProcessingPriority(jc) === 'DELAYED').length
    const qaReady = jobCards.filter(jc => jc.prodStep >= 10).length
    
    return {
      total,
      inProgress,
      completed,
      urgent,
      critical,
      delayed,
      qaReady,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }, [jobCards])

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'step':
        setSelectedStep(value)
        break
      case 'status':
        setSelectedStatus(value)
        break
      case 'priority':
        setSelectedPriority(value)
        break
      default:
        break
    }
    setCurrentPage(1)
  }

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates)
    setCurrentPage(1)
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedStep('all')
    setSelectedStatus('all')
    setSelectedPriority('all')
    setDateRange(null)
    setCurrentPage(1)
  }

  // Handle job card actions
  const handleViewDetails = (jobCard) => {
    setSelectedJobCard(jobCard)
    setDetailsModalVisible(true)
  }

  const handleMoveToNextStep = (jobCard) => {
    const currentStepName = PRODUCTION_STEPS.find(s => s.id === jobCard.prodStep)?.name || 'Unknown'
    const nextStepName = PRODUCTION_STEPS.find(s => s.id === jobCard.prodStep + 1)?.name || 'Complete'

    confirm({
      title: 'Move Job Card to Next Step',
      content: (
        <div>
          <p>Move job card #{jobCard.id} from <strong>{currentStepName}</strong> to <strong>{nextStepName}</strong>?</p>
          <div className="text-sm text-gray-600 mt-2">
            <div>Plan: {jobCard.alloyName} → {jobCard.convertName}</div>
            <div>Quantity: {jobCard.quantity}</div>
          </div>
        </div>
      ),
      okText: 'Move Forward',
      okType: 'primary',
      onOk: async () => {
        try {
          // Try to use Redux API first
          await dispatch(updateJobCardProgress({
            jobCardId: jobCard.id,
            prodStep: jobCard.prodStep + 1
          })).unwrap()

          notification.success({
            message: 'Step Updated Successfully',
            description: `Job card moved to ${nextStepName}`
          })
          loadJobCards()
        } catch (error) {
          console.error('Update Job Card Error:', error)
          
          // Update local sample data for demo
          setJobCards(prev => prev.map(jc => 
            jc.id === jobCard.id 
              ? { ...jc, prodStep: Math.min(jc.prodStep + 1, 11) }
              : jc
          ))
          
          notification.success({
            message: 'Demo: Step Updated',
            description: `Job card moved to ${nextStepName} (sample data)`
          })
        }
      }
    })
  }

  const handleDeleteJobCard = (jobCard) => {
    confirm({
      title: 'Delete Job Card',
      content: `Are you sure you want to delete job card #${jobCard.id}? This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`/v2/production/job-card/${jobCard.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${user?.token}`
            }
          })

          if (response.ok) {
            notification.success({
              message: 'Job Card Deleted',
              description: `Job card #${jobCard.id} has been deleted`
            })
            loadJobCards()
          } else {
            throw new Error('Failed to delete job card')
          }
        } catch (error) {
          notification.error({
            message: 'Delete Failed',
            description: error.message
          })
        }
      }
    })
  }

  // Get step info
  const getStepInfo = (stepId) => {
    return PRODUCTION_STEPS.find(s => s.id === stepId) || { name: 'Unknown', color: '#gray', icon: '❓' }
  }

  // Get status color
  const getStatusColor = (stepId, isUrgent) => {
    if (isUrgent) return '#f5222d'
    if (stepId === 11) return '#52c41a'
    if (stepId > 1) return '#1890ff'
    return '#faad14'
  }

  // Table columns with enhanced information
  const columns = [
    {
      title: 'Priority',
      key: 'priority',
      width: 100,
      fixed: 'left',
      render: (_, record) => {
        const priority = getProcessingPriority(record)
        const color = getPriorityColor(priority)
        
        return (
          <div className="text-center">
            <Badge 
              dot 
              color={color}
              style={{ transform: 'scale(1.5)', marginRight: 8 }}
            />
            <Tag color={color} size="small" className="text-xs font-semibold">
              {priority}
            </Tag>
          </div>
        )
      },
      sorter: (a, b) => {
        const priorityOrder = { CRITICAL: 5, DELAYED: 4, HIGH: 3, QA_READY: 2, NORMAL: 1 }
        const aPriority = getProcessingPriority(a)
        const bPriority = getProcessingPriority(b)
        return priorityOrder[bPriority] - priorityOrder[aPriority]
      }
    },
    {
      title: 'Job Details',
      key: 'jobDetails',
      width: 240,
      render: (_, record) => (
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Text strong className="text-blue-600">#{record.id}</Text>
            <Text className="text-xs text-gray-500">Plan #{record.prodPlanId}</Text>
          </div>
          <div className="text-sm font-medium mb-1">
            {record.alloyName}
          </div>
          <div className="text-xs text-gray-600 mb-1">
            → {record.convertName}
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <Text className="text-sm font-semibold">{record.quantity?.toLocaleString()}</Text>
            <Text className="text-xs text-gray-500">units</Text>
            {record.isUrgent && (
              <Tag color="red" icon={<FireOutlined />} size="small">
                URGENT
              </Tag>
            )}
          </div>
          {/* Step Preset Information */}
          <div className="flex items-center space-x-1">
            <SettingOutlined className="text-gray-400 text-xs" />
            <Text className="text-xs text-gray-600">
              {record.presetName || record.stepPresetName || 'Standard 11-Step Process'}
            </Text>
          </div>
          {/* Partial quantity reason */}
          {record.isPartialQuantity && record.reason && (
            <div className="mt-1">
              <Tooltip title={record.reason}>
                <Tag color="orange" size="small" className="text-xs">
                  PARTIAL QTY
                </Tag>
              </Tooltip>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Plan Allocation',
      key: 'planAllocation',
      width: 180,
      render: (_, record) => {
        const allocationPct = record.planTotalQuantity > 0 
          ? Math.round((record.planAllocatedQuantity / record.planTotalQuantity) * 100)
          : 0
        const contributionPct = record.allocationPercentage || 0
        
        return (
          <div>
            {/* Plan allocation status */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Plan Allocation</span>
                <span className="font-medium">{allocationPct}%</span>
              </div>
              <Progress 
                percent={allocationPct} 
                size="small" 
                showInfo={false}
                strokeColor={allocationPct === 100 ? '#52c41a' : allocationPct > 80 ? '#faad14' : '#1890ff'}
              />
              <div className="text-xs text-gray-500 mt-1">
                {record.planAllocatedQuantity?.toLocaleString()} / {record.planTotalQuantity?.toLocaleString()} units
              </div>
            </div>
            
            {/* This job card's contribution */}
            <div>
              <div className="text-xs text-gray-500 mb-1">
                This Job Card: {contributionPct}% of plan
              </div>
              <div className="flex items-center space-x-2">
                {record.planRemainingQuantity > 0 ? (
                  <Tag color="green" size="small" className="text-xs">
                    {record.planRemainingQuantity} Available
                  </Tag>
                ) : (
                  <Tag color="red" size="small" className="text-xs">
                    Fully Allocated
                  </Tag>
                )}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      title: 'Current Step Progress',
      key: 'currentStepProgress',
      width: 220,
      render: (_, record) => {
        const stepInfo = getStepInfo(record.prodStep)
        const overallProgress = Math.round((record.prodStep / 11) * 100)
        const priority = getProcessingPriority(record)
        
        // Simulated step-specific data (would come from API in real implementation)
        const stepProgress = record.stepProgress || Math.min(100, overallProgress + 20)
        const stepStatus = record.stepStatus || (record.prodStep >= 11 ? 'completed' : record.prodStep > 1 ? 'in_progress' : 'pending')
        const assignedUser = record.assignedUser || record.createdBy || 'Unassigned'
        const stepPriority = record.isUrgent ? 'urgent' : 'normal'
        
        const getStepStatusColor = (status) => {
          switch (status) {
            case 'completed': return 'text-green-600'
            case 'in_progress': return 'text-blue-600'
            case 'pending': return 'text-orange-600'
            case 'paused': return 'text-yellow-600'
            case 'on_hold': return 'text-red-600'
            default: return 'text-gray-500'
          }
        }

        const getStepStatusIcon = (status) => {
          switch (status) {
            case 'completed': return '✓'
            case 'in_progress': return '⚡'
            case 'pending': return '⏳'
            case 'paused': return '⏸'
            case 'on_hold': return '⚠'
            default: return '○'
          }
        }

        const getPriorityIcon = (priority) => {
          switch (priority) {
            case 'urgent': return '🔥'
            case 'critical': return '🚨' 
            case 'high': return '⚡'
            default: return ''
          }
        }
        
        return (
          <div className="w-full">
            {/* Step name and status */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${getStepStatusColor(stepStatus)}`}>
                  {getStepStatusIcon(stepStatus)}
                </span>
                <Text className="text-sm font-medium" style={{ color: stepInfo.color }}>
                  {stepInfo.name}
                </Text>
                {stepPriority === 'urgent' && (
                  <span className="text-xs">🔥</span>
                )}
              </div>
              <Text className="text-xs text-gray-500">
                {record.prodStep}/11
              </Text>
            </div>

            {/* Current step progress bar */}
            <div className="flex items-center gap-1 mb-1">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    stepStatus === 'completed' ? 'bg-green-500' :
                    stepStatus === 'in_progress' ? 'bg-blue-500' :
                    stepStatus === 'paused' ? 'bg-yellow-500' :
                    stepStatus === 'on_hold' ? 'bg-red-500' :
                    'bg-orange-500'
                  }`}
                  style={{ width: `${Math.max(stepProgress, 0)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 ml-1">
                {stepProgress}%
              </span>
            </div>

            {/* Overall workflow progress */}
            <div className="mb-1">
              <div className="flex justify-between items-center">
                <Text className="text-xs text-gray-500">Overall Progress</Text>
                <Text className="text-xs text-gray-500">{overallProgress}%</Text>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1">
                <div 
                  className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Assigned user and timing */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-blue-600 truncate max-w-24" title={assignedUser}>
                👤 {assignedUser.split(' ')[0]}
              </div>
              {priority === 'DELAYED' && (
                <Tag color="orange" size="small" className="text-xs">
                  DELAYED
                </Tag>
              )}
            </div>
          </div>
        )
      }
    },
    {
      title: 'Next Action & Timing',
      key: 'nextActionTiming',
      width: 190,
      render: (_, record) => {
        const nextAction = getNextAction(record)
        const hoursOld = moment().diff(moment(record.createdAt), 'hours')
        const daysOld = Math.floor(hoursOld / 24)
        const priority = getProcessingPriority(record)
        
        // Simulated timing data (would come from API)
        const estimatedCompletion = record.estimatedCompletion || moment().add(2, 'days')
        const stepDeadline = record.stepDeadline || moment().add(1, 'day')
        const isOverdue = moment().isAfter(stepDeadline)
        
        return (
          <div>
            {/* Next action */}
            <div className="text-sm font-medium mb-1">
              {nextAction}
            </div>
            
            {/* Timing information */}
            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                Created: {daysOld > 0 ? `${daysOld}d ago` : `${hoursOld}h ago`}
              </div>
              
              {record.prodStep < 11 && (
                <div className="text-xs text-gray-600">
                  Est. Complete: {moment(estimatedCompletion).fromNow()}
                </div>
              )}
              
              {/* Priority and urgency indicators */}
              <div className="flex items-center space-x-1">
                {isOverdue && (
                  <div className="flex items-center space-x-1">
                    <WarningOutlined className="text-red-500 text-xs" />
                    <Text className="text-xs text-red-600 font-medium">
                      OVERDUE
                    </Text>
                  </div>
                )}
                {!isOverdue && hoursOld > 48 && (
                  <div className="flex items-center space-x-1">
                    <ClockCircleOutlined className="text-orange-500 text-xs" />
                    <Text className="text-xs text-orange-600">
                      DELAYED
                    </Text>
                  </div>
                )}
                {!isOverdue && hoursOld > 24 && hoursOld <= 48 && (
                  <div className="flex items-center space-x-1">
                    <WarningOutlined className="text-yellow-500 text-xs" />
                    <Text className="text-xs text-yellow-600">
                      ATTENTION
                    </Text>
                  </div>
                )}
              </div>

              {/* Step assignment info */}
              {record.stepAssignedTo && (
                <div className="text-xs text-blue-600">
                  Assigned: {record.stepAssignedTo}
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      title: 'Quality Status',
      key: 'qualityStatus',
      width: 140,
      render: (_, record) => {
        if (record.prodStep >= 10) {
          // Job card is at or past quality check
          const rejectedQty = record.rejectedQuantity || 0
          const acceptedQty = record.acceptedQuantity || 0
          const totalQty = record.quantity || 0
          const pendingQA = totalQty - acceptedQty - rejectedQty
          
          return (
            <div>
              <div className="space-y-1">
                {acceptedQty > 0 && (
                  <div className="flex items-center space-x-1">
                    <CheckCircleOutlined className="text-green-500 text-xs" />
                    <Text className="text-xs text-green-600">✓ {acceptedQty}</Text>
                  </div>
                )}
                {rejectedQty > 0 && (
                  <div className="flex items-center space-x-1">
                    <CloseCircleOutlined className="text-red-500 text-xs" />
                    <Text className="text-xs text-red-600">✗ {rejectedQty}</Text>
                  </div>
                )}
                {pendingQA > 0 && (
                  <div className="flex items-center space-x-1">
                    <ClockCircleOutlined className="text-blue-500 text-xs" />
                    <Text className="text-xs text-blue-600">⏳ {pendingQA}</Text>
                  </div>
                )}
              </div>
              {rejectedQty > 0 && record.rejectionReason && (
                <Tooltip title={record.rejectionReason}>
                  <Tag color="red" size="small" className="mt-1">
                    {record.rejectionReason.substring(0, 8)}...
                  </Tag>
                </Tooltip>
              )}
            </div>
          )
        }
        
        return (
          <div className="text-center">
            <Tag color="default" size="small">
              Pre-QA
            </Tag>
            <div className="text-xs text-gray-500 mt-1">
              Step {record.prodStep}/11
            </div>
          </div>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => {
        const isCompleted = record.prodStep >= 11
        const isQAReady = record.prodStep === 10
        const priority = getProcessingPriority(record)
        const stepStatus = record.stepStatus || 'pending'
        
        // Create move to next step tooltip
        const getMoveTooltip = () => {
          if (isCompleted) return 'Job card completed'
          if (isQAReady) return 'Submit to Quality Assurance'
          if (stepStatus === 'in_progress') return 'Continue to next production step'
          if (stepStatus === 'pending') return 'Start current production step'
          return 'Move to next step'
        }
        
        const actionMenu = (
          <Menu
            items={[
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => handleViewDetails(record)
              },
              {
                key: 'nextStep',
                icon: <ArrowRightOutlined />,
                label: isQAReady ? 'Submit to QA' : 'Next Step',
                onClick: () => handleMoveToNextStep(record),
                disabled: isCompleted
              },
              {
                key: 'assignUser',
                icon: <ToolOutlined />,
                label: 'Assign User',
                onClick: () => {
                  // Handle user assignment
                  notification.info({ message: 'User assignment feature coming soon' })
                }
              },
              { type: 'divider' },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                onClick: () => handleDeleteJobCard(record),
                danger: true
              }
            ]}
          />
        )

        return (
          <div className="flex items-center justify-end gap-1">
            {/* Desktop View - Show all buttons */}
            <div className="hidden lg:flex items-center gap-1">
              <Tooltip title="View Job Card Details">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewDetails(record)
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  size="small"
                />
              </Tooltip>
              <Tooltip title={getMoveTooltip()}>
                <Button
                  type={priority === 'CRITICAL' ? 'primary' : isQAReady ? 'primary' : 'text'}
                  icon={isQAReady ? <CheckCircleOutlined /> : <ArrowRightOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveToNextStep(record)
                  }}
                  className={`p-1 ${
                    priority === 'CRITICAL' ? 'text-white' :
                    isQAReady ? 'text-white' :
                    'text-green-600 hover:text-green-800'
                  }`}
                  size="small"
                  disabled={isCompleted}
                  danger={priority === 'CRITICAL'}
                />
              </Tooltip>
              <Tooltip title="More Actions">
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  className="text-gray-600 hover:text-gray-800 p-1"
                  size="small"
                />
              </Tooltip>
            </div>

            {/* Mobile View - Show essential buttons + dropdown */}
            <div className="lg:hidden flex items-center gap-1">
              <Tooltip title="View Details">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewDetails(record)
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  size="small"
                />
              </Tooltip>
              <Tooltip title={getMoveTooltip()}>
                <Button
                  type={priority === 'CRITICAL' ? 'primary' : 'text'}
                  icon={<ArrowRightOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveToNextStep(record)
                  }}
                  className="text-green-600 hover:text-green-800 p-1"
                  size="small"
                  disabled={isCompleted}
                />
              </Tooltip>
              <Dropdown 
                menu={actionMenu} 
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-600 hover:text-gray-800 p-1"
                  size="small"
                />
              </Dropdown>
            </div>

            {/* Priority action button for urgent items */}
            {(priority === 'CRITICAL' || priority === 'DELAYED') && !isCompleted && (
              <div className="w-full mt-1 lg:hidden">
                <Button
                  type="primary"
                  size="small"
                  block
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveToNextStep(record)
                  }}
                  className="text-xs"
                  style={{ fontSize: '10px', height: '18px' }}
                  danger={priority === 'CRITICAL'}
                >
                  {priority === 'CRITICAL' ? 'URGENT' : 'DELAYED'}
                </Button>
              </div>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2">
                🏭 Job Card Management
              </Title>
              <Text className="text-gray-600 text-lg">
                Track and manage production job cards through manufacturing steps
              </Text>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                icon={<PlusOutlined />}
                type="primary"
                size="large"
                onClick={() => setCreateModalVisible(true)}
              >
                Create Job Card
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadJobCards}
                loading={loading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={6} md={4}>
            <Card>
              <Statistic
                title="Total Job Cards"
                value={statistics.total}
                prefix={<ToolOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Card>
              <Statistic
                title="Critical Priority"
                value={statistics.critical}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Card>
              <Statistic
                title="Delayed Items"
                value={statistics.delayed}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#ff7a45' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Card>
              <Statistic
                title="QA Ready"
                value={statistics.qaReady}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Card>
              <Statistic
                title="In Progress"
                value={statistics.inProgress}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Card>
              <Statistic
                title="Completed"
                value={statistics.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Search
                placeholder="Search job cards..."
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Filter by step"
                value={selectedStep}
                onChange={(value) => handleFilterChange('step', value)}
                style={{ width: '100%' }}
              >
                <Option value="all">All Steps</Option>
                {PRODUCTION_STEPS.map(step => (
                  <Option key={step.id} value={step.id}>
                    {step.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Filter by priority"
                value={selectedPriority}
                onChange={(value) => handleFilterChange('priority', value)}
                style={{ width: '100%' }}
              >
                <Option value="all">All Priorities</Option>
                <Option value="urgent">Urgent Only</Option>
                <Option value="normal">Normal Only</Option>
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={2}>
              <Button
                icon={<FilterOutlined />}
                onClick={handleClearFilters}
                style={{ width: '100%' }}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={jobCards}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalCount,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} job cards`,
              onChange: (page, size) => {
                setCurrentPage(page)
                setPageSize(size)
              }
            }}
            scroll={{ x: 1600 }}
            size="small"
            onRow={(record) => ({
              onClick: () => handleViewDetails(record),
              className: 'cursor-pointer hover:bg-gray-50'
            })}
          />
        </Card>

        {/* Modals */}
        <JobCardCreationModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onSuccess={() => {
            setCreateModalVisible(false)
            loadJobCards()
          }}
        />

        {detailsModalVisible && selectedJobCard && (
          <JobCardDetailsModal
            visible={detailsModalVisible}
            onCancel={() => {
              setDetailsModalVisible(false)
              setSelectedJobCard(null)
            }}
            jobCard={selectedJobCard}
            onRefresh={loadJobCards}
          />
        )}
      </div>
    </Layout>
  )
}

export default JobCardListing