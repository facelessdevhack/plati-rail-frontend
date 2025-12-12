import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  message,
  Input,
  Select,
  DatePicker,
  Dropdown,
  Menu,
  Badge,
  Table,
  Card,
  Space,
  Modal,
  Tag
} from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilterOutlined
} from '@ant-design/icons'
import moment from 'moment'

import CustomTable from '../../Core/Components/CustomTable'
import JobCardDetailsModal from './JobCardDetailsModal'
import CustomButton from '../../Core/Components/CustomButton'
import Layout from '../Layout/layout'
import ProductionPlanDetailsModal from './ProductionPlanDetailsModal'
import ModernProductionHeader from './components/ModernProductionHeader'
import ProductionTable from './components/ProductionTable'
import EditProductionPlanModal from './EditProductionPlanModal'
import AssignPresetModal from './AssignPresetModal'
import JobCardCreationModal from './JobCardCreationModal'
import {
  getProductionPlansWithQuantities,
  getProductionKPIData,
  getProductionPlans,
  deleteProductionPlan,
  getProductionSteps,
  moveToNextStep,
  getJobCardsWithDetails
} from '../../redux/api/productionAPI'
import { mockJobCards } from '../../Utils/mockProductionData'
import {
  setSearchTerm,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSorting,
  setSelectedPlan,
  clearError,
  resetSuccess
} from '../../redux/slices/production.slice'

const { RangePicker } = DatePicker
const { confirm } = Modal

const ProductionListingV2 = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [localSearch, setLocalSearch] = useState('')
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null)
  const [assignPresetModalVisible, setAssignPresetModalVisible] =
    useState(false)
  const [selectedPlanForPreset, setSelectedPlanForPreset] = useState(null)
  const [jobCardModalVisible, setJobCardModalVisible] = useState(false)
  const [selectedPlanForJobCard, setSelectedPlanForJobCard] = useState(null)
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [jobCardsData, setJobCardsData] = useState({})
  const [loadingJobCards, setLoadingJobCards] = useState({})
  const [isTodayFilter, setIsTodayFilter] = useState(false)

  const {
    productionPlans,
    totalPlansCount,
    currentPage,
    pageSize,
    searchTerm,
    filters,
    sortField,
    sortOrder,
    loading,
    error,
    success,
    isDeleting,
    totalKPIs,
    kpisLoading,
    lastKPIUpdate
  } = useSelector(state => state.productionDetails)

  // Helper function to get API parameters with all current filters
  const getApiParams = (extraParams = {}) => {
    return {
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      sortField,
      sortOrder,
      urgent: filters.urgent,
      dateRange: filters.dateRange,
      ...extraParams
    }
  }

  // Load data on component mount with enhanced quantity tracking
  useEffect(() => {
    dispatch(getProductionPlansWithQuantities(getApiParams()))
  }, [
    dispatch,
    currentPage,
    pageSize,
    searchTerm,
    filters,
    sortField,
    sortOrder
  ])

  // Load initial data only once
  useEffect(() => {
    dispatch(getProductionSteps())
  }, [dispatch])

  // Load KPI data for total dataset (not paginated)
  useEffect(() => {
    dispatch(
      getProductionKPIData({
        search: searchTerm,
        urgent: filters.urgent,
        status: filters.status,
        dateRange: filters.dateRange
      })
    )
  }, [dispatch, searchTerm, filters.urgent, filters.status, filters.dateRange])

  // Handle success/error messages (removed to avoid excessive popups)

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
    // Turn off Today filter when user manually changes date range
    if (isTodayFilter) {
      setIsTodayFilter(false)
    }

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
    setIsTodayFilter(false)
    dispatch(clearFilters())
    dispatch(setCurrentPage(1))
  }

  // Calculate total quantity from filtered production plans
  const getTotalQuantity = () => {
    return productionPlans.reduce((total, plan) => {
      return total + (plan.quantity || 0)
    }, 0)
  }

  // Handle Today filter
  const handleTodayFilter = () => {
    const today = moment().format('YYYY-MM-DD')
    const newTodayState = !isTodayFilter

    setIsTodayFilter(newTodayState)

    if (newTodayState) {
      // Set date range to today only
      dispatch(
        setFilters({
          dateRange: [today, today]
        })
      )
    } else {
      // Clear date range filter
      dispatch(
        setFilters({
          dateRange: null
        })
      )
    }

    dispatch(setCurrentPage(1))
  }

  // Handle pagination
  const handlePageChange = (page, size) => {
    dispatch(setCurrentPage(page))
    if (size !== pageSize) {
      dispatch(setPageSize(size))
    }
  }

  // Handle table changes (pagination, sorting, etc.)
  const handleTableChange = (pagination, filters, sorter) => {
    // Handle sorting - Fix three-state sorting cycle
    if (sorter && sorter.field) {
      let order = null
      if (sorter.order === 'ascend') {
        order = 'asc'
      } else if (sorter.order === 'descend') {
        order = 'desc'
      } else {
        // sorter.order is null or undefined, which means "no sort"
        order = null
      }
      dispatch(setSorting({ field: sorter.field, order }))
    } else {
      // Completely clear sorting when no field is selected
      dispatch(setSorting({ field: null, order: null }))
    }

    // Handle pagination
    if (
      pagination.current !== currentPage ||
      pagination.pageSize !== pageSize
    ) {
      handlePageChange(pagination.current, pagination.pageSize)
    }
  }

  // Handle actions
  const handleView = record => {
    dispatch(setSelectedPlan(record))
    // Navigate to production plan details page instead of opening modal
    navigate(`/production-plan/${record.id}`)
  }

  const handleEdit = record => {
    dispatch(setSelectedPlan(record))
    setSelectedPlanForEdit(record)
    setEditModalVisible(true)
  }

  const handleDelete = record => {
    const jobCardCount =
      record.jobCardsCount || record.quantityTracking?.totalJobCards || 0
    const hasJobCards = jobCardCount > 0

    const warningContent = hasJobCards ? (
      <div>
        <p className='mb-3'>
          Are you sure you want to delete production plan #{record.id}?
        </p>
        <div className='bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3'>
          <div className='flex items-start gap-2'>
            <span className='text-orange-500 text-lg'>⚠️</span>
            <div>
              <div className='font-semibold text-orange-800 mb-1'>Warning</div>
              <div className='text-orange-700 text-sm'>
                This production plan has{' '}
                <strong>
                  {jobCardCount} job card{jobCardCount > 1 ? 's' : ''}
                </strong>{' '}
                associated with it.
              </div>
              <div className='text-orange-700 text-sm mt-1'>
                All job cards and their progress will be permanently deleted
                along with the production plan.
              </div>
            </div>
          </div>
        </div>
        <p className='text-red-600 font-medium'>
          This action cannot be undone.
        </p>
      </div>
    ) : (
      `Are you sure you want to delete production plan #${record.id}? This action cannot be undone.`
    )

    confirm({
      title: 'Delete Production Plan',
      content: warningContent,
      okText: hasJobCards ? 'Yes, Delete All' : 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      width: hasJobCards ? 500 : 416,
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
          dispatch(getProductionPlansWithQuantities(getApiParams()))
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
    navigate('/production-planner-v2')
  }

  // Handle export to Excel/CSV
  const handleExport = async format => {
    try {
      // Show loading message
      const loadingMessage = message.loading(
        'Fetching all production plans for export...'
      )

      // Fetch ALL production plans (without pagination)
      const allPlansResponse = await dispatch(
        getProductionPlansWithQuantities({
          ...getApiParams(),
          page: 1,
          limit: 10000 // Large number to get all plans
        })
      ).unwrap()

      const allPlans = allPlansResponse.productionPlans || []

      loadingMessage()

      // Prepare data for export
      const exportData = allPlans.map(plan => {
        const sourceProduct =
          plan.alloyName ||
          plan.sourceProduct ||
          plan.sourceproductname ||
          `Alloy ${plan.alloyId}`
        const targetProduct =
          plan.convertName ||
          plan.targetProduct ||
          plan.targetproductname ||
          `Convert ${plan.convertToAlloyId}`

        return {
          'Production Plan ID': plan.id,
          Date: plan.createdAt
            ? moment(plan.createdAt).format('YYYY-MM-DD')
            : '',
          'From Alloy': sourceProduct,
          'To Alloy': targetProduct,
          Quantity: plan.quantity
        }
      })

      if (format === 'csv') {
        // CSV Export
        const headers = Object.keys(exportData[0])
        const csvContent = [
          headers.join(','),
          ...exportData.map(row =>
            headers
              .map(header => {
                const value = row[header]
                // Escape commas and quotes in values
                return typeof value === 'string' &&
                  (value.includes(',') || value.includes('"'))
                  ? `"${value.replace(/"/g, '""')}"`
                  : value
              })
              .join(',')
          )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `production_plans_${moment().format('YYYY-MM-DD')}.csv`
        link.click()
        message.success(
          `${allPlans.length} production plans exported to CSV successfully`
        )
      } else {
        // Excel Export - using simple HTML table method
        const tableHTML = `
          <table>
            <thead>
              <tr>
                ${Object.keys(exportData[0])
                  .map(header => `<th>${header}</th>`)
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${exportData
                .map(
                  row => `
                <tr>
                  ${Object.values(row)
                    .map(value => `<td>${value}</td>`)
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `

        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `production_plans_${moment().format('YYYY-MM-DD')}.xls`
        link.click()
        message.success(
          `${allPlans.length} production plans exported to Excel successfully`
        )
      }
    } catch (error) {
      console.error('Export error:', error)
      message.error('Failed to export data')
    }
  }

  // Export menu items
  const exportMenuItems = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Export All Plans to Excel',
      onClick: () => handleExport('excel')
    },
    {
      key: 'csv',
      icon: <DownloadOutlined />,
      label: 'Export All Plans to CSV',
      onClick: () => handleExport('csv')
    }
  ]

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
    dispatch(getProductionPlansWithQuantities(getApiParams()))
  }

  // Handle successful preset assignment
  const handlePresetAssignSuccess = () => {
    setAssignPresetModalVisible(false)
    setSelectedPlanForPreset(null)
    message.success('Preset assigned successfully!')

    // Refresh the production plans list with a small delay to ensure backend updates
    setTimeout(() => {
      dispatch(getProductionPlansWithQuantities(getApiParams()))
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
      dispatch(getProductionPlansWithQuantities(getApiParams()))
    }, 500)
  }

  // Check if a plan can move to next step
  const canMoveToNextStep = record => {
    const stepStatus = record.currentStepStatus

    // Check if has workflow steps defined (use workflowInfo for accurate check)
    const hasWorkflow =
      record.workflowInfo?.hasCustomWorkflow || record.hasWorkflowSteps
    if (!hasWorkflow && record.currentStepName === 'Not Started') {
      return false // No workflow defined
    }

    // Can move if step is pending, in_progress, or waiting (not started)
    return ['pending', 'in_progress', 'waiting'].includes(stepStatus)
  }

  // Check if a plan can create job cards
  const canCreateJobCard = record => {
    // Require a preset/workflow on the plan AND remaining quantity
    const remaining = record.quantityTracking?.remainingQuantity ?? 0
    const hasWorkflow =
      record.workflowInfo?.hasCustomWorkflow || record.hasWorkflowSteps
    const hasPreset =
      record.workflowInfo?.presetName || record.presetName || record.preset_name
    return remaining > 0 && (hasWorkflow || hasPreset)
  }

  // Get tooltip message for create job card button
  const getCreateJobCardTooltip = record => {
    const remaining = record.quantityTracking?.remainingQuantity ?? 0
    const hasWorkflow =
      record.workflowInfo?.hasCustomWorkflow || record.hasWorkflowSteps
    const hasPreset =
      record.workflowInfo?.presetName || record.presetName || record.preset_name
    if (!hasWorkflow && !hasPreset)
      return 'Assign a preset/workflow to the plan before creating job cards'
    if (remaining <= 0)
      return 'Cannot create job cards - no remaining quantity available'
    return `Create job card from this production plan (${remaining.toLocaleString()} units available)`
  }

  // Get tooltip message for move to next step button
  const getMoveTooltip = record => {
    const hasWorkflow =
      record.workflowInfo?.hasCustomWorkflow || record.hasWorkflowSteps
    if (!hasWorkflow && record.currentStepName === 'Not Started') {
      return 'No workflow defined - please assign a preset first'
    }

    if (record.currentStepStatus === 'completed') {
      return 'Current step is completed - click to move to next step'
    }

    return 'Move to next production step'
  }

  // Handle expanding a row to show job cards
  const handleExpand = async (expanded, record) => {
    const keys = expanded
      ? [...expandedRowKeys, record.id]
      : expandedRowKeys.filter(key => key !== record.id)
    setExpandedRowKeys(keys)

    // Fetch job cards if expanding and not already loaded
    if (expanded && !jobCardsData[record.id]) {
      setLoadingJobCards(prev => ({ ...prev, [record.id]: true }))
      try {
        const response = await dispatch(
          getJobCardsWithDetails({ prodPlanId: record.id })
        ).unwrap()
        setJobCardsData(prev => ({
          ...prev,
          [record.id]: response.jobCards || []
        }))
      } catch (error) {
        console.error('Error loading job cards:', error)
        message.error('Failed to load job cards')
        setJobCardsData(prev => ({ ...prev, [record.id]: [] }))
      } finally {
        setLoadingJobCards(prev => ({ ...prev, [record.id]: false }))
      }
    }
  }

  // Render expanded row content (job cards)
  const expandedRowRender = record => {
    const jobCards = jobCardsData[record.id] || []
    const loading = loadingJobCards[record.id]

    if (loading) {
      return (
        <div className='p-8 text-center'>
          <div className='text-gray-500'>Loading job cards...</div>
        </div>
      )
    }

    if (jobCards.length === 0) {
      const hasWorkflow =
        record.workflowInfo?.hasCustomWorkflow || record.hasWorkflowSteps
      return (
        <div className='p-8 text-center'>
          <div className='text-gray-500'>No job cards created yet</div>
          {hasWorkflow ? (
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => handleCreateJobCard(record)}
              className='mt-4'
            >
              Create First Job Card
            </Button>
          ) : (
            <Button
              type='primary'
              icon={<SettingOutlined />}
              onClick={() => handleAssignPreset(record)}
              className='mt-4'
            >
              Assign Preset to Plan
            </Button>
          )}
        </div>
      )
    }

    // Job cards table columns
    const jobCardColumns = [
      {
        title: 'Job Card ID',
        dataIndex: 'jobCardId',
        key: 'jobCardId',
        width: 100,
        render: id => <span className='font-semibold text-blue-600'>#{id}</span>
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 120,
        render: qty => (
          <div className='text-center'>
            <div className='text-lg font-semibold'>{qty?.toLocaleString()}</div>
            <div className='text-xs text-gray-500'>units</div>
          </div>
        )
      },
      {
        title: 'Current Step',
        key: 'currentStep',
        width: 200,
        render: (_, jobCard) => {
          const totalSteps =
            jobCard.totalWorkflowSteps || jobCard.total_workflow_steps || 11
          const currentStepNum = jobCard.prodStep || jobCard.prod_step || 1
          const progress = Math.round((currentStepNum / totalSteps) * 100)
          const presetName =
            jobCard.presetName || jobCard.preset_name || 'Standard'

          return (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>
                  Step {currentStepNum} of {totalSteps}
                </span>
                <Tag
                  color={progress === 100 ? 'green' : 'blue'}
                  className='text-xs'
                >
                  {progress}%
                </Tag>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.max(progress, 2)}%` }}
                />
              </div>
              <div className='text-xs text-gray-500'>Preset: {presetName}</div>
            </div>
          )
        }
      },
      {
        title: 'Status',
        key: 'status',
        width: 120,
        render: (_, jobCard) => {
          const totalSteps =
            jobCard.totalWorkflowSteps || jobCard.total_workflow_steps || 11
          const currentStep = jobCard.prodStep || jobCard.prod_step || 1
          const isCompleted = currentStep >= totalSteps

          return (
            <Tag color={isCompleted ? 'green' : 'blue'}>
              {isCompleted ? 'Completed' : 'In Progress'}
            </Tag>
          )
        }
      },
      {
        title: 'Accepted/Rejected',
        key: 'quantities',
        width: 150,
        render: (_, jobCard) => (
          <div className='flex gap-2'>
            <div className='text-center'>
              <div className='text-green-600 font-semibold'>
                {jobCard.acceptedQuantity || jobCard.accepted_quantity || 0}
              </div>
              <div className='text-xs text-gray-500'>Accepted</div>
            </div>
            <div className='text-center'>
              <div className='text-red-600 font-semibold'>
                {jobCard.rejectedQuantity || jobCard.rejected_quantity || 0}
              </div>
              <div className='text-xs text-gray-500'>Rejected</div>
            </div>
          </div>
        )
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_, jobCard) => (
          <Button
            type='link'
            onClick={() => navigate(`/job-cards?id=${jobCard.id}`)}
            icon={<EyeOutlined />}
          >
            View Details
          </Button>
        )
      }
    ]

    return (
      <div className='p-4 bg-gray-50'>
        <div className='mb-3 flex justify-between items-center'>
          <h3 className='text-sm font-semibold text-gray-700'>
            Job Cards ({jobCards.length})
          </h3>
          <Button
            size='small'
            icon={<PlusOutlined />}
            onClick={() => handleCreateJobCard(record)}
            disabled={!canCreateJobCard(record)}
          >
            Add Job Card
          </Button>
        </div>
        <Table
          columns={jobCardColumns}
          dataSource={jobCards}
          rowKey='id'
          pagination={false}
          size='small'
          className='bg-white'
        />
      </div>
    )
  }

  // Create dropdown menu for mobile actions
  const getActionMenu = record => {
    const menuItems = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: e => {
          e.domEvent?.stopPropagation?.()
          handleView(record)
        }
      },
      {
        key: 'edit',
        label: 'Edit Plan',
        icon: <EditOutlined />,
        onClick: e => {
          e.domEvent?.stopPropagation?.()
          handleEdit(record)
        }
      },
      {
        key: 'createJobCard',
        label: 'Create Job Card',
        icon: <PlayCircleOutlined />,
        onClick: e => {
          e.domEvent?.stopPropagation?.()
          handleCreateJobCard(record)
        },
        disabled: !canCreateJobCard(record)
      }
    ]

    // Only add Assign Preset if no workflow is assigned yet
    if (!record.workflowInfo?.hasCustomWorkflow && !record.hasWorkflowSteps) {
      menuItems.push({
        key: 'preset',
        label: 'Assign Preset',
        icon: <SettingOutlined />,
        onClick: e => {
          e.domEvent?.stopPropagation?.()
          handleAssignPreset(record)
        }
      })
    }

    menuItems.push(
      {
        key: 'nextStep',
        label: 'Move to Next Step',
        icon: <ArrowRightOutlined />,
        onClick: e => {
          e.domEvent?.stopPropagation?.()
          handleMoveToNextStep(record)
        },
        disabled: !canMoveToNextStep(record)
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        label: 'Delete Plan',
        icon: <DeleteOutlined />,
        onClick: e => {
          e.domEvent?.stopPropagation?.()
          handleDelete(record)
        },
        danger: true
      }
    )

    return { items: menuItems }
  }

  // Filter options
  const urgentOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'true', label: 'Urgent' },
    { value: 'false', label: 'Normal' }
  ]

  // Simplified table columns with inline filters
  const columns = [
    {
      title: (
        <div className='space-y-2'>
          <div className='font-semibold'>Production Plan</div>
          <Input
            placeholder='Search plans...'
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined className='text-gray-400' />}
            size='small'
            allowClear
          />
        </div>
      ),
      key: 'planDetails',
      width: 300,
      fixed: 'left',
      render: (_, record) => {
        const sourceProduct =
          record.alloyName ||
          record.sourceProduct ||
          record.sourceproductname ||
          `Alloy ${record.alloyId}`
        const targetProduct =
          record.convertName ||
          record.targetProduct ||
          record.targetproductname ||
          `Convert ${record.convertToAlloyId}`

        return (
          <div className='py-2'>
            <div className='flex items-center justify-between mb-2'>
              <span className='font-semibold text-blue-600 text-sm'>
                #{record.id}
              </span>
              {record.urgent && (
                <Tag color='red' size='small' className='text-xs font-medium'>
                  🔥 URGENT
                </Tag>
              )}
            </div>

            <div className='bg-gray-50 rounded-lg p-3 space-y-2'>
              <div>
                <div className='text-xs text-gray-600 mb-1'>From:</div>
                <div
                  className='font-medium text-sm text-gray-900 truncate'
                  title={sourceProduct}
                >
                  {sourceProduct}
                </div>
              </div>

              <div className='flex items-center justify-center'>
                <div className='flex-1 h-px bg-gray-300'></div>
                <span className='px-2 text-gray-400'>→</span>
                <div className='flex-1 h-px bg-gray-300'></div>
              </div>

              <div>
                <div className='text-xs text-gray-600 mb-1'>To:</div>
                <div
                  className='font-medium text-sm text-blue-700 truncate'
                  title={targetProduct}
                >
                  {targetProduct}
                </div>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      title: (
        <div className='space-y-2'>
          <div className='font-semibold'>Date & Priority</div>
          <Select
            value={filters.urgent}
            onChange={value => handleFilterChange('urgent', value)}
            options={urgentOptions}
            className='w-full'
            placeholder='Priority'
            size='small'
            allowClear
          />
        </div>
      ),
      key: 'datePriority',
      width: 150,
      render: (_, record) => (
        <div className='py-2 space-y-1'>
          <div className='text-sm font-medium'>
            {moment(record.createdAt).format('MMM DD, YYYY')}
          </div>
          <div className='text-xs text-gray-500'>
            {moment(record.createdAt).format('HH:mm')}
          </div>
          {record.urgent && (
            <Tag color='red' size='small' className='mt-1'>
              URGENT
            </Tag>
          )}
        </div>
      )
    },
    {
      title: (
        <div className='space-y-2'>
          <div className='font-semibold'>Quantity</div>
          <div className='text-xs text-gray-500'>Total & Progress</div>
        </div>
      ),
      key: 'quantity',
      width: 150,
      render: (_, record) => {
        const total = record.quantity || 0
        const allocated = record.quantityTracking?.allocatedQuantity || 0
        const remaining = record.quantityTracking?.remainingQuantity || 0
        // Calculate pending quantity as the remaining amount that needs to be allocated
        // Pending = Total quantity - Already allocated to job cards
        const totalPendingQuantity = Math.max(0, total - (record.quantityTracking?.allocatedQuantity || 0))

        // Calculate the ratio as "totalPendingQuantity across job cards / total quantity"
        const displayRatio =
          totalPendingQuantity > 0
            ? `${totalPendingQuantity.toLocaleString()} / ${total.toLocaleString()}`
            : `0 / ${total.toLocaleString()}`

        // Calculate percentage based on pending quantity vs total
        const percentage =
          total > 0 ? Math.round((totalPendingQuantity / total) * 100) : 0

        return (
          <div className='py-2 space-y-2'>
            <div className='text-center'>
              <div className='text-lg font-bold text-gray-900'>
                {displayRatio}
              </div>
              <div className='text-xs text-gray-500'>Pending / Total</div>
            </div>

            <div className='space-y-1'>
              <div className='flex justify-between text-xs'>
                <span className='text-gray-600'>Pending</span>
                <span className='font-medium'>{percentage}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    percentage === 100
                      ? 'bg-red-500'
                      : percentage > 50
                      ? 'bg-orange-500'
                      : percentage > 0
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
            </div>
          </div>
        )
      }
    },
    {
      title: (
        <div className='space-y-2'>
          <div className='font-semibold'>Status</div>
          <div className='text-xs text-gray-500'>Current Step</div>
        </div>
      ),
      key: 'status',
      width: 180,
      render: (_, record) => {
        const stepName = record.currentStepName || 'Not Started'
        const status = record.currentStepStatus || 'waiting'

        const getStatusColor = status => {
          switch (status) {
            case 'completed':
              return 'bg-green-100 text-green-800'
            case 'in_progress':
              return 'bg-blue-100 text-blue-800'
            case 'pending':
              return 'bg-orange-100 text-orange-800'
            case 'paused':
              return 'bg-yellow-100 text-yellow-800'
            case 'waiting':
              return 'bg-gray-100 text-gray-600'
            default:
              return 'bg-gray-100 text-gray-600'
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
            default:
              return '○'
          }
        }

        return (
          <div className='py-2 space-y-2'>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                status
              )}`}
            >
              <span>{getStatusIcon(status)}</span>
              <span className='truncate max-w-[120px]' title={stepName}>
                {stepName}
              </span>
            </div>

            {record.jobCardsCount > 0 && (
              <div className='text-xs text-gray-500'>
                {record.jobCardsCount} job cards
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: (
        <div className='space-y-2'>
          <div className='font-semibold'>Actions</div>
          <div className='text-xs text-gray-500'>Manage Plan</div>
        </div>
      ),
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => {
        const hasWorkflowOrPreset =
          record.workflowInfo?.hasCustomWorkflow ||
          record.hasWorkflowSteps ||
          record.workflowInfo?.presetName ||
          record.presetName ||
          record.preset_name

        return (
          <div className='flex items-center justify-center'>
            <div className='flex gap-1'>
              {hasWorkflowOrPreset ? (
                // Show Job Card button when preset/workflow is assigned
                <Button
                  type='primary'
                  icon={<PlayCircleOutlined />}
                  onClick={e => {
                    e.stopPropagation()
                    handleCreateJobCard(record)
                  }}
                  size='small'
                  disabled={!canCreateJobCard(record)}
                  title={getCreateJobCardTooltip(record)}
                >
                  Job Card
                </Button>
              ) : (
                // Show Preset button when no preset/workflow is assigned
                <Button
                  type='default'
                  icon={<SettingOutlined />}
                  onClick={e => {
                    e.stopPropagation()
                    handleAssignPreset(record)
                  }}
                  size='small'
                  title='Assign a preset/workflow to this production plan'
                >
                  Preset
                </Button>
              )}

              <Dropdown
                menu={getActionMenu(record)}
                trigger={['click']}
                placement='bottomRight'
              >
                <Button
                  type='text'
                  icon={<MoreOutlined />}
                  size='small'
                  onClick={e => e.stopPropagation()}
                />
              </Dropdown>
            </div>
          </div>
        )
      }
    }
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Production Table with Integrated Filters */}
      <div className='p-6'>
        <ProductionTable
          productionPlans={productionPlans}
          loading={loading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPlansCount={totalPlansCount}
          handlePageChange={handlePageChange}
          handleTableChange={handleTableChange}
          handleView={handleView}
          getActionMenu={getActionMenu}
          localSearch={localSearch}
          setLocalSearch={setLocalSearch}
          handleSearch={handleSearch}
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleDateRangeChange={handleDateRangeChange}
          isTodayFilter={isTodayFilter}
          handleTodayFilter={handleTodayFilter}
          handleClearFilters={handleClearFilters}
          searchTerm={searchTerm}
          handleCreatePlan={handleCreatePlan}
          navigate={navigate}
          exportMenuItems={exportMenuItems}
          expandedRowKeys={expandedRowKeys}
          handleExpand={handleExpand}
          expandedRowRender={expandedRowRender}
          jobCardsData={jobCardsData}
          loadingJobCards={loadingJobCards}
          totalKPIs={totalKPIs}
          kpisLoading={kpisLoading}
          lastKPIUpdate={lastKPIUpdate}
        />
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
  )
}

export default ProductionListingV2
