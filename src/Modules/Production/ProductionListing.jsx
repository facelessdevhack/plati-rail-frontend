import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Row,
  Col,
  Tag,
  Space,
  Button,
  Modal,
  message,
  Input,
  Select,
  DatePicker,
  Dropdown,
  Menu,
  Tooltip,
  Badge,
  Card,
  Divider
} from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  MoreOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import moment from 'moment'

import CustomTable from '../../Core/Components/CustomTable'
import CustomButton from '../../Core/Components/CustomButton'
import Layout from '../Layout/layout'
import ProductionPlanDetailsModal from './ProductionPlanDetailsModal'
import EditProductionPlanModal from './EditProductionPlanModal'
import AssignPresetModal from './AssignPresetModal'
import JobCardCreationModal from './JobCardCreationModal'
import {
  getProductionPlansWithQuantities,
  getProductionPlans,
  deleteProductionPlan,
  getProductionSteps,
  moveToNextStep
} from '../../redux/api/productionAPI'
import { mockJobCards } from '../../Utils/mockProductionData'
import {
  setSearchTerm,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedPlan,
  clearError,
  resetSuccess
} from '../../redux/slices/production.slice'

const { RangePicker } = DatePicker
const { confirm } = Modal

const ProductionListing = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [localSearch, setLocalSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null)
  const [assignPresetModalVisible, setAssignPresetModalVisible] =
    useState(false)
  const [selectedPlanForPreset, setSelectedPlanForPreset] = useState(null)
  const [jobCardModalVisible, setJobCardModalVisible] = useState(false)
  const [selectedPlanForJobCard, setSelectedPlanForJobCard] = useState(null)

  const {
    productionPlans,
    totalPlansCount,
    currentPage,
    pageSize,
    searchTerm,
    filters,
    loading,
    error,
    success,
    isDeleting
  } = useSelector(state => state.productionDetails)

  // Load data on component mount with enhanced quantity tracking
  useEffect(() => {
    dispatch(
      getProductionPlansWithQuantities({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        urgent: filters.urgent,
        status: filters.status
      })
    )
  }, [dispatch, currentPage, pageSize, searchTerm, filters])

  // Load initial data only once
  useEffect(() => {
    dispatch(getProductionSteps())
  }, [dispatch])

  // Handle success/error messages
  useEffect(() => {
    if (success) {
      message.success('Operation completed successfully')
      dispatch(resetSuccess())
    }
  }, [success, dispatch])

  useEffect(() => {
    if (error?.message) {
      message.error(error.message)
      dispatch(clearError())
    }
  }, [error, dispatch])

  // Handle search
  const handleSearch = () => {
    dispatch(setSearchTerm(localSearch))
    dispatch(setCurrentPage(1))
  }

  // Handle filters
  const handleFilterChange = (filterName, value) => {
    dispatch(setFilters({ [filterName]: value }))
    dispatch(setCurrentPage(1))
  }

  const handleDateRangeChange = dates => {
    dispatch(
      setFilters({
        dateRange: dates
          ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]
          : null
      })
    )
    dispatch(setCurrentPage(1))
  }

  const handleClearFilters = () => {
    setLocalSearch('')
    dispatch(clearFilters())
    dispatch(setCurrentPage(1))
  }

  // Handle pagination
  const handlePageChange = (page, size) => {
    dispatch(setCurrentPage(page))
    if (size !== pageSize) {
      dispatch(setPageSize(size))
    }
  }

  // Handle actions
  const handleView = record => {
    dispatch(setSelectedPlan(record))
    setSelectedPlanForDetails(record)
    setDetailsModalVisible(true)
  }

  const handleEdit = record => {
    dispatch(setSelectedPlan(record))
    setSelectedPlanForEdit(record)
    setEditModalVisible(true)
  }

  const handleDelete = record => {
    confirm({
      title: 'Delete Production Plan',
      content: `Are you sure you want to delete production plan ${record.id}? This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk () {
        dispatch(deleteProductionPlan(record.id))
      }
    })
  }

  const handleAssignPreset = record => {
    dispatch(setSelectedPlan(record))
    setSelectedPlanForPreset(record)
    setAssignPresetModalVisible(true)
  }

  const handleCreateJobCard = record => {
    dispatch(setSelectedPlan(record))
    setSelectedPlanForJobCard(record)
    setJobCardModalVisible(true)
  }

  const handleMoveToNextStep = record => {
    const hasWorkflow = record.workflowInfo?.hasCustomWorkflow
    const currentStep = record.currentStepName
    const stepStatus = record.currentStepStatus

    // Enhanced confirmation with workflow info
    const workflowText = hasWorkflow
      ? `\n\nWorkflow Progress: ${record.workflowInfo.completedSteps}/${record.workflowInfo.totalSteps} steps completed`
      : '\n\nThis will use the standard production sequence.'

    const statusText =
      stepStatus === 'in_progress'
        ? `\nCurrent step "${currentStep}" will be marked as completed.`
        : stepStatus === 'pending'
        ? `\nStep "${currentStep}" will be started.`
        : `\nStep status: ${stepStatus}`

    confirm({
      title: 'Move to Next Production Step',
      content: (
        <div>
          <p>Move production plan #{record.id} to the next step?</p>
          <div className='text-sm text-gray-600 mt-2'>
            {statusText}
            {workflowText}
          </div>
          {record.currentStepAssignedUser && (
            <div className='text-sm text-blue-600 mt-1'>
              Currently assigned to: {record.currentStepAssignedUser}
            </div>
          )}
        </div>
      ),
      okText: 'Yes, Move Forward',
      okType: 'primary',
      cancelText: 'Cancel',
      width: 500,
      onOk: async () => {
        try {
          // Enhanced API call with workflow support
          const movePayload = {
            notes: `Step progression via UI on ${new Date().toLocaleString()}`,
            priority: record.priority === 'urgent' ? 'urgent' : 'normal'
          }

          await dispatch(
            moveToNextStep({
              planId: record.id,
              ...movePayload
            })
          ).unwrap()

          message.success({
            content: (
              <div>
                <div className='font-semibold'>
                  Step progression successful!
                </div>
                <div className='text-sm'>
                  Production plan #{record.id} moved forward
                </div>
                {hasWorkflow && (
                  <div className='text-xs text-gray-600'>
                    Progress: {record.workflowInfo.completedSteps + 1}/
                    {record.workflowInfo.totalSteps}
                  </div>
                )}
              </div>
            ),
            duration: 4
          })

          // Refresh the production plans list
          dispatch(
            getProductionPlansWithQuantities({
              page: currentPage,
              limit: pageSize,
              search: searchTerm,
              urgent: filters.urgent,
              status: filters.status
            })
          )
        } catch (error) {
          message.error({
            content: (
              <div>
                <div className='font-semibold'>Failed to move to next step</div>
                <div className='text-sm'>
                  {error?.message || 'Unknown error occurred'}
                </div>
                {error?.planId && (
                  <div className='text-xs text-gray-600'>
                    Plan ID: {error.planId}
                  </div>
                )}
              </div>
            ),
            duration: 6
          })
        }
      }
    })
  }

  // Handle create plan navigation
  const handleCreatePlan = () => {
    navigate('/production-alloys')
  }

  // Handle details modal close
  const handleDetailsModalClose = () => {
    setDetailsModalVisible(false)
    setSelectedPlanForDetails(null)
  }

  // Handle edit modal close
  const handleEditModalClose = () => {
    setEditModalVisible(false)
    setSelectedPlanForEdit(null)
  }

  // Handle assign preset modal close
  const handleAssignPresetModalClose = () => {
    setAssignPresetModalVisible(false)
    setSelectedPlanForPreset(null)
  }

  // Handle successful edit
  const handleEditSuccess = () => {
    // Refresh the production plans list
    dispatch(
      getProductionPlansWithQuantities({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        urgent: filters.urgent,
        status: filters.status
      })
    )
  }

  // Handle successful preset assignment
  const handlePresetAssignSuccess = () => {
    setAssignPresetModalVisible(false)
    setSelectedPlanForPreset(null)
    message.success('Preset assigned successfully!')
    
    // Refresh the production plans list with a small delay to ensure backend updates
    setTimeout(() => {
      dispatch(
        getProductionPlansWithQuantities({
          page: currentPage,
          limit: pageSize,
          search: searchTerm,
          urgent: filters.urgent,
          status: filters.status
        })
      )
    }, 500)
  }

  // Handle job card modal close
  const handleJobCardModalClose = () => {
    setJobCardModalVisible(false)
    setSelectedPlanForJobCard(null)
  }

  // Handle successful job card creation
  const handleJobCardCreateSuccess = () => {
    setJobCardModalVisible(false)
    message.success('Job card created successfully!')

    // Add a small delay to ensure backend triggers have completed
    // then refresh the production plans list
    setTimeout(() => {
      dispatch(
        getProductionPlansWithQuantities({
          page: currentPage,
          limit: pageSize,
          search: searchTerm,
          urgent: filters.urgent,
          status: filters.status
        })
      )
    }, 500)
  }

  // Get status color for tags
  const getStatusColor = status => {
    const statusColors = {
      Pending: 'orange',
      'In Progress': 'blue',
      'Quality Check': 'purple',
      Completed: 'green',
      Cancelled: 'red',
      'On Hold': 'gray'
    }
    return statusColors[status] || 'default'
  }

  // Check if a plan can move to next step
  const canMoveToNextStep = record => {
    const completedStatuses = ['Completed', 'Cancelled']
    const stepStatus = record.currentStepStatus

    // Can't move if plan is completed/cancelled
    if (completedStatuses.includes(record.status)) return false

    // Check if has workflow steps defined (use workflowInfo for accurate check)
    const hasWorkflow = record.workflowInfo?.hasCustomWorkflow || record.hasWorkflowSteps
    if (!hasWorkflow && record.currentStepName === 'Not Started') {
      return false // No workflow defined
    }

    // Can move if step is pending, in_progress, or waiting (not started)
    return ['pending', 'in_progress', 'waiting'].includes(stepStatus)
  }

  // Check if a plan can create job cards
  const canCreateJobCard = record => {
    const completedStatuses = ['Completed', 'Cancelled']

    // Can't create job cards if plan is completed/cancelled
    if (completedStatuses.includes(record.status)) return false

    // Can create job cards if plan has remaining quantity available
    const remaining = record.quantityTracking?.remainingQuantity ?? 0
    return remaining > 0
  }

  // Get tooltip message for create job card button
  const getCreateJobCardTooltip = record => {
    const completedStatuses = ['Completed', 'Cancelled']
    const remaining = record.quantityTracking?.remainingQuantity ?? 0

    if (completedStatuses.includes(record.status)) {
      return 'Cannot create job cards - plan is completed or cancelled'
    }

    if (remaining <= 0) {
      return 'Cannot create job cards - no remaining quantity available'
    }

    return `Create job card from this production plan (${remaining.toLocaleString()} units available)`
  }

  // Get tooltip message for move to next step button
  const getMoveTooltip = record => {
    const completedStatuses = ['Completed', 'Cancelled']

    if (completedStatuses.includes(record.status)) {
      return 'Cannot move - plan is completed or cancelled'
    }

    const hasWorkflow = record.workflowInfo?.hasCustomWorkflow || record.hasWorkflowSteps
    if (!hasWorkflow && record.currentStepName === 'Not Started') {
      return 'No workflow defined - please assign a preset first'
    }

    if (record.currentStepStatus === 'completed') {
      return 'Current step is completed - click to move to next step'
    }

    return 'Move to next production step'
  }

  // Create dropdown menu for mobile actions
  const getActionMenu = record => (
    <Menu
      items={[
        {
          key: 'view',
          label: 'View Details',
          icon: <EyeOutlined />,
          onClick: () => handleView(record)
        },
        {
          key: 'edit',
          label: 'Edit Plan',
          icon: <EditOutlined />,
          onClick: () => handleEdit(record)
        },
        {
          key: 'createJobCard',
          label: 'Create Job Card',
          icon: <PlayCircleOutlined />,
          onClick: () => handleCreateJobCard(record),
          disabled: !canCreateJobCard(record)
        },
        // Only show Assign Preset if no workflow is assigned yet
        ...(!record.workflowInfo?.hasCustomWorkflow && !record.hasWorkflowSteps ? [{
          key: 'preset',
          label: 'Assign Preset',
          icon: <SettingOutlined />,
          onClick: () => handleAssignPreset(record)
        }] : []),
        {
          key: 'nextStep',
          label: 'Move to Next Step',
          icon: <ArrowRightOutlined />,
          onClick: () => handleMoveToNextStep(record),
          disabled: !canMoveToNextStep(record)
        },
        {
          type: 'divider'
        },
        {
          key: 'delete',
          label: 'Delete Plan',
          icon: <DeleteOutlined />,
          onClick: () => handleDelete(record),
          danger: true
        }
      ]}
    />
  )

  // Table columns configuration
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 40,
      fixed: 'left',
      sorter: (a, b) => a.id - b.id,
      render: id => (
        <div className='font-medium text-blue-600 text-xs'>#{id}</div>
      )
    },
    {
      title: 'Source Product',
      key: 'sourceProduct',
      width: 240,
      ellipsis: true,
      render: (_, record) => {
        // Use the complete product description from backend if available
        const fullProduct = record.sourceProduct
        // Fallback to individual fields if needed
        const productName =
          record.alloyName ||
          record.sourceproductname ||
          `Alloy ${record.alloyId}`
        console.log(record, 'RECORD')
        console.log('Workflow Check:', {
          hasWorkflowSteps: record.hasWorkflowSteps,
          workflowInfo: record.workflowInfo,
          currentStepStatus: record.currentStepStatus,
          canMove: canMoveToNextStep(record)
        })
        return (
          <div className='w-full'>
            {fullProduct ? (
              <div className='font-medium text-xs' title={fullProduct}>
                {fullProduct}
              </div>
            ) : (
              <>
                <div
                  className='font-medium text-xs truncate'
                  title={productName}
                >
                  {productName}
                </div>
                {(record.sourceModelName || record.sourceFinish) && (
                  <div className='text-xs text-gray-500 truncate'>
                    {record.sourceModelName}{' '}
                    {record.sourceFinish && `- ${record.sourceFinish}`}
                  </div>
                )}
              </>
            )}
          </div>
        )
      }
    },
    {
      title: 'Target Product',
      key: 'targetProduct',
      width: 240,
      ellipsis: true,
      render: (_, record) => {
        // Use the complete product description from backend if available
        const fullProduct = record.targetProduct
        // Fallback to individual fields if needed
        const productName =
          record.convertName ||
          record.targetproductname ||
          `Convert ${record.convertToAlloyId}`

        return (
          <div className='w-full'>
            {fullProduct ? (
              <div className='font-medium text-xs' title={fullProduct}>
                {fullProduct}
              </div>
            ) : (
              <>
                <div
                  className='font-medium text-xs truncate'
                  title={productName}
                >
                  {productName}
                </div>
                {(record.targetModelName || record.targetFinish) && (
                  <div className='text-xs text-gray-500 truncate'>
                    {record.targetModelName}{' '}
                    {record.targetFinish && `- ${record.targetFinish}`}
                  </div>
                )}
              </>
            )}
          </div>
        )
      }
    },
    {
      title: 'Total Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      sorter: (a, b) => a.quantity - b.quantity,
      render: quantity => (
        <div className='font-medium text-xs'>{quantity?.toLocaleString()}</div>
      )
    },
    {
      title: 'Allocated',
      key: 'allocatedQuantity',
      width: 100,
      render: (_, record) => {
        const allocated = record.quantityTracking?.allocatedQuantity || 0
        const total = record.quantity || 0
        const percentage = total > 0 ? Math.round((allocated / total) * 100) : 0

        return (
          <div className='text-xs'>
            <div className='font-medium'>{allocated.toLocaleString()}</div>
            <div className='text-gray-500'>{percentage}%</div>
          </div>
        )
      }
    },
    {
      title: 'Remaining',
      key: 'remainingQuantity',
      width: 100,
      render: (_, record) => {
        const remaining = record.quantityTracking?.remainingQuantity || 0
        const canCreate = remaining > 0

        return (
          <div className='text-xs'>
            <div
              className={`font-medium ${
                remaining > 0 ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {remaining.toLocaleString()}
            </div>
            {canCreate && (
              <Tag color='green' style={{ fontSize: '10px', padding: '0 4px' }}>
                Available
              </Tag>
            )}
          </div>
        )
      }
    },
    {
      title: 'Job Cards',
      key: 'jobCards',
      width: 80,
      render: (_, record) => {
        const jobCards =
          record.jobCardsCount || record.quantityTracking?.totalJobCards || 0
        return (
          <Badge
            count={jobCards}
            showZero
            style={{ backgroundColor: jobCards > 0 ? '#52c41a' : '#d9d9d9' }}
          >
            <span className='text-xs'>Cards</span>
          </Badge>
        )
      }
    },
    {
      title: 'Allocation Status',
      key: 'allocationStatus',
      width: 120,
      render: (_, record) => {
        const allocated = record.quantityTracking?.allocatedQuantity || 0
        const total = record.quantity || 0
        const percentage = total > 0 ? Math.round((allocated / total) * 100) : 0

        let status = 'Open'
        if (percentage === 100) status = 'Fully Allocated'
        else if (percentage > 0) status = 'Partially Allocated'

        let color = 'default'
        let text = 'Open'

        if (status === 'Fully Allocated') {
          color = 'red'
          text = 'Fully Allocated'
        } else if (status === 'Partially Allocated') {
          color = 'orange'
          text = `${percentage}% Allocated`
        } else {
          color = 'green'
          text = 'Open'
        }

        return (
          <Tag color={color} style={{ fontSize: '11px' }}>
            {text}
          </Tag>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: status => (
        <Tag color={getStatusColor(status)} className='text-xs px-1 py-0'>
          {(status || 'Pending').substring(0, 8)}
        </Tag>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'urgent',
      key: 'urgent',
      width: 70,
      render: urgent => (
        <Tag color={urgent ? 'red' : 'default'} className='text-xs px-1 py-0'>
          {urgent ? 'Urgent' : 'Normal'}
        </Tag>
      )
    },
    {
      title: 'Current Step',
      dataIndex: 'currentStepName',
      key: 'currentStepName',
      width: 140,
      ellipsis: true,
      render: (stepName, record) => {
        const getStatusColor = status => {
          switch (status) {
            case 'completed':
              return 'text-green-600'
            case 'in_progress':
              return 'text-blue-600'
            case 'pending':
              return 'text-orange-600'
            case 'paused':
              return 'text-yellow-600'
            case 'on_hold':
              return 'text-red-600'
            case 'waiting':
              return 'text-gray-500'
            default:
              return 'text-gray-500'
          }
        }

        const getStatusIcon = status => {
          switch (status) {
            case 'completed':
              return '✓'
            case 'in_progress':
              return '⚡'
            case 'pending':
              return '⏳'
            case 'paused':
              return '⏸'
            case 'on_hold':
              return '⚠'
            case 'waiting':
              return '○'
            default:
              return '○'
          }
        }

        const getPriorityColor = priority => {
          switch (priority) {
            case 'urgent':
            case 'critical':
              return 'text-red-500'
            case 'high':
              return 'text-orange-500'
            case 'normal':
              return 'text-gray-500'
            case 'low':
              return 'text-gray-400'
            default:
              return 'text-gray-500'
          }
        }

        const progress = record.currentStepProgress || 0
        const status = record.currentStepStatus || 'waiting'
        const priority =
          record.currentStepPriority || record.priority || 'normal'
        const assignedUser = record.currentStepAssignedUser
        const workflowInfo = record.workflowInfo || {}

        return (
          <div className='w-full'>
            {/* Step name and status */}
            <div className='flex items-center gap-1'>
              <span className={`text-xs ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
              </span>
              <div className='font-medium text-xs truncate flex-1'>
                {stepName || 'Not Started'}
              </div>
              {priority !== 'normal' && (
                <span
                  className={`text-xs ${getPriorityColor(priority)} font-bold`}
                >
                  {priority === 'urgent'
                    ? '🔥'
                    : priority === 'critical'
                    ? '🚨'
                    : priority === 'high'
                    ? '⚡'
                    : ''}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {status !== 'waiting' && (
              <div className='flex items-center gap-1 mt-1'>
                <div className='flex-1 bg-gray-200 rounded-full h-1'>
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      status === 'completed'
                        ? 'bg-green-500'
                        : status === 'in_progress'
                        ? 'bg-blue-500'
                        : status === 'paused'
                        ? 'bg-yellow-500'
                        : status === 'on_hold'
                        ? 'bg-red-500'
                        : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.max(progress, 0)}%` }}
                  />
                </div>
                <span className='text-xs text-gray-500 ml-1'>
                  {progress >= 0 ? `${progress}%` : ''}
                </span>
              </div>
            )}

            {/* Step info and assigned user */}
            <div className='flex items-center justify-between mt-0.5'>
              {workflowInfo.hasCustomWorkflow && (
                <div className='text-xs text-gray-400'>
                  {record.currentStepOrder}/{workflowInfo.totalSteps}
                </div>
              )}
              {assignedUser && (
                <div
                  className='text-xs text-blue-600 truncate max-w-20'
                  title={assignedUser}
                >
                  👤 {assignedUser.split(' ')[0]}
                </div>
              )}
            </div>

            {/* Overall workflow progress */}
            {workflowInfo.hasCustomWorkflow && workflowInfo.totalSteps > 0 && (
              <div className='mt-1'>
                <div className='text-xs text-gray-500 mb-0.5'>
                  Overall: {workflowInfo.completedSteps}/
                  {workflowInfo.totalSteps}
                </div>
                <div className='w-full bg-gray-100 rounded-full h-0.5'>
                  <div
                    className='bg-purple-500 h-0.5 rounded-full transition-all duration-300'
                    style={{ width: `${record.overallProgress || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 90,
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      render: date => (
        <div className='max-w-[90px]'>
          <div className='text-xs'>{moment(date).format('MMM DD')}</div>
          <div className='text-xs text-gray-500'>
            {moment(date).format('HH:mm')}
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <div className='flex items-center justify-end gap-1'>
          {/* Desktop View - Show all buttons */}
          <div className='hidden lg:flex items-center gap-1'>
            <Tooltip title='View Details'>
              <Button
                type='text'
                icon={<EyeOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  handleView(record)
                }}
                className='text-blue-600 hover:text-blue-800 p-1'
                size='small'
              />
            </Tooltip>
            <Tooltip title='Edit Plan'>
              <Button
                type='text'
                icon={<EditOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  handleEdit(record)
                }}
                className='text-green-600 hover:text-green-800 p-1'
                size='small'
              />
            </Tooltip>
            <Tooltip title={getCreateJobCardTooltip(record)}>
              <Button
                type='text'
                icon={<PlayCircleOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  handleCreateJobCard(record)
                }}
                className='text-blue-500 hover:text-blue-700 p-1'
                size='small'
                disabled={!canCreateJobCard(record)}
              />
            </Tooltip>
            {!record.workflowInfo?.hasCustomWorkflow && !record.hasWorkflowSteps && (
              <Tooltip title='Assign Preset'>
                <Button
                  type='text'
                  icon={<SettingOutlined />}
                  onClick={e => {
                    e.stopPropagation()
                    handleAssignPreset(record)
                  }}
                  className='text-purple-600 hover:text-purple-800 p-1'
                  size='small'
                />
              </Tooltip>
            )}
            <Tooltip title={getMoveTooltip(record)}>
              <Button
                type='text'
                icon={<ArrowRightOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  handleMoveToNextStep(record)
                }}
                className='text-orange-600 hover:text-orange-800 p-1'
                size='small'
                disabled={!canMoveToNextStep(record)}
              />
            </Tooltip>
            <Tooltip title='Delete Plan'>
              <Button
                type='text'
                icon={<DeleteOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  handleDelete(record)
                }}
                className='text-red-600 hover:text-red-800 p-1'
                loading={isDeleting}
                size='small'
              />
            </Tooltip>
          </div>

          {/* Tablet/Mobile View - Show essential buttons + dropdown */}
          <div className='lg:hidden flex items-center gap-1'>
            <Tooltip title='View Details'>
              <Button
                type='text'
                icon={<EyeOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  handleView(record)
                }}
                className='text-blue-600 hover:text-blue-800 p-1'
                size='small'
              />
            </Tooltip>
            <Tooltip title='Edit Plan'>
              <Button
                type='text'
                icon={<EditOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  handleEdit(record)
                }}
                className='text-green-600 hover:text-green-800 p-1'
                size='small'
              />
            </Tooltip>
            <Dropdown
              menu={getActionMenu(record)}
              trigger={['click']}
              placement='bottomRight'
            >
              <Button
                type='text'
                icon={<MoreOutlined />}
                onClick={e => e.stopPropagation()}
                className='text-gray-600 hover:text-gray-800 p-1'
                size='small'
              />
            </Dropdown>
          </div>
        </div>
      )
    }
  ]

  // Filter options
  const urgentOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'true', label: 'Urgent' },
    { value: 'false', label: 'Normal' }
  ]

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Quality Check', label: 'Quality Check' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'On Hold', label: 'On Hold' }
  ]

  return (
    <Layout>
      <div className='p-2 sm:p-4 md:p-6 bg-gray-50 min-h-screen w-[calc(100vw-100px)] overflow-hidden'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-3 md:mb-6 w-full'>
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4'>
            <div>
              <h1 className='text-xl md:text-2xl font-bold text-gray-900'>
                Production Plans
              </h1>
              <p className='text-gray-600 mt-1 text-sm md:text-base'>
                Manage and track your production planning
              </p>
            </div>
            <div className='flex flex-col sm:flex-row gap-2'>
              <CustomButton
                type='primary'
                icon={<PlusOutlined />}
                size='middle'
                onClick={handleCreatePlan}
                className='w-full sm:w-auto px-5 py-3'
              >
                Create Plan
              </CustomButton>
              <CustomButton
                type='primary'
                icon={<ArrowRightOutlined />}
                size='middle'
                onClick={() => navigate('/smart-production')}
                className='w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0'
              >
                🚀 Smart Bulk Planner
              </CustomButton>
            </div>
          </div>

          {/* Search and Filters */}
          <div className='space-y-3'>
            {/* Search Bar */}
            <div className='flex flex-col md:flex-row gap-2 md:gap-3 items-stretch md:items-center'>
              <div className='flex-1 max-w-full md:max-w-md'>
                <Input
                  placeholder='Search plans...'
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  onPressEnter={handleSearch}
                  prefix={<SearchOutlined className='text-gray-400' />}
                  allowClear
                  size='middle'
                />
              </div>
              <div className='flex gap-2 flex-wrap'>
                <Button
                  type='primary'
                  onClick={handleSearch}
                  icon={<SearchOutlined />}
                  size='middle'
                  className='flex-shrink-0'
                >
                  Search
                </Button>
                <Button
                  type='default'
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilters(!showFilters)}
                  size='middle'
                  className='flex-shrink-0'
                >
                  Filters
                </Button>
                {(searchTerm ||
                  filters.urgent ||
                  filters.status ||
                  filters.dateRange) && (
                  <Button
                    onClick={handleClearFilters}
                    size='middle'
                    className='flex-shrink-0'
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Row */}
            {showFilters && (
              <div className='bg-gray-50 p-3 md:p-4 rounded-lg'>
                <Row gutter={[8, 12]} className='max-w-full'>
                  <Col xs={24} sm={12} md={6}>
                    <div className='mb-2 text-xs md:text-sm font-medium text-gray-700'>
                      Priority
                    </div>
                    <Select
                      value={filters.urgent}
                      onChange={value => handleFilterChange('urgent', value)}
                      options={urgentOptions}
                      className='w-full'
                      placeholder='Priority'
                      size='small'
                    />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div className='mb-2 text-xs md:text-sm font-medium text-gray-700'>
                      Status
                    </div>
                    <Select
                      value={filters.status}
                      onChange={value => handleFilterChange('status', value)}
                      options={statusOptions}
                      className='w-full'
                      placeholder='Status'
                      size='small'
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div className='mb-2 text-xs md:text-sm font-medium text-gray-700'>
                      Date Range
                    </div>
                    <RangePicker
                      value={
                        filters.dateRange
                          ? [
                              moment(filters.dateRange[0]),
                              moment(filters.dateRange[1])
                            ]
                          : null
                      }
                      onChange={handleDateRangeChange}
                      className='w-full'
                      placeholder={['Start', 'End']}
                      size='small'
                    />
                  </Col>
                  <Col xs={24} sm={12} md={4}>
                    <div className='mb-2 hidden md:block'>&nbsp;</div>
                    <Button
                      onClick={handleClearFilters}
                      className='w-full'
                      size='small'
                    >
                      Clear Filters
                    </Button>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-4 md:mt-6 pt-4 border-t border-gray-200'>
            <div className='bg-blue-50 p-2 sm:p-3 md:p-4 rounded-lg text-center hover:shadow-sm transition-shadow'>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-blue-600'>
                {totalPlansCount}
              </div>
              <div className='text-xs sm:text-sm text-gray-600 mt-1'>
                Total Plans
              </div>
            </div>
            <div className='bg-orange-50 p-2 sm:p-3 md:p-4 rounded-lg text-center hover:shadow-sm transition-shadow'>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-orange-600'>
                {productionPlans.filter(p => p.urgent).length}
              </div>
              <div className='text-xs sm:text-sm text-gray-600 mt-1'>
                Urgent Plans
              </div>
            </div>
            <div className='bg-green-50 p-2 sm:p-3 md:p-4 rounded-lg text-center hover:shadow-sm transition-shadow'>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-green-600'>
                {productionPlans.filter(p => p.status === 'Completed').length}
              </div>
              <div className='text-xs sm:text-sm text-gray-600 mt-1'>
                Completed
              </div>
            </div>
            <div className='bg-purple-50 p-2 sm:p-3 md:p-4 rounded-lg text-center hover:shadow-sm transition-shadow'>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-purple-600'>
                {productionPlans.filter(p => p.status === 'In Progress').length}
              </div>
              <div className='text-xs sm:text-sm text-gray-600 mt-1'>
                In Progress
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
          <div className='p-3 md:p-4 border-b border-gray-200'>
            <h2 className='text-base md:text-lg font-semibold text-gray-900'>
              Production Plans List
            </h2>
            <p className='text-xs md:text-sm text-gray-500 mt-1'>
              {totalPlansCount > 0
                ? `Showing ${productionPlans.length} of ${totalPlansCount} plans`
                : 'No plans found'}
            </p>
          </div>
          <div className='overflow-x-auto'>
            <CustomTable
              title=''
              data={productionPlans}
              totalCount={totalPlansCount}
              columns={columns}
              currentPage={currentPage}
              currentPageSize={pageSize}
              handlePageChange={handlePageChange}
              loading={loading}
              scroll={{ x: 800 }}
              onRowClick={handleView}
              showSort={true}
              size='small'
              pagination={{
                showSizeChanger: false,
                showQuickJumper: false,
                size: 'small'
              }}
            />
          </div>
        </div>

        {/* Production Plan Details Modal */}
        <ProductionPlanDetailsModal
          visible={detailsModalVisible}
          onClose={handleDetailsModalClose}
          planId={selectedPlanForDetails?.id}
          planData={selectedPlanForDetails}
        />

        {/* Edit Production Plan Modal */}
        <EditProductionPlanModal
          visible={editModalVisible}
          onClose={handleEditModalClose}
          planData={selectedPlanForEdit}
          onSuccess={handleEditSuccess}
        />

        {/* Assign Preset Modal */}
        <AssignPresetModal
          visible={assignPresetModalVisible}
          onClose={handleAssignPresetModalClose}
          planData={selectedPlanForPreset}
          onSuccess={handlePresetAssignSuccess}
        />

        {/* Job Card Creation Modal */}
        <JobCardCreationModal
          visible={jobCardModalVisible}
          onCancel={handleJobCardModalClose}
          onSuccess={handleJobCardCreateSuccess}
          selectedPlan={selectedPlanForJobCard}
        />
      </div>
    </Layout>
  )
}

export default ProductionListing
