import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Settings,
  TrendingUp,
  FileText,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ArrowRight,
  BarChart3,
  Activity
} from 'lucide-react'

import {
  getProductionPlanById,
  getJobCardsWithDetails
} from '../../redux/api/productionAPI'
import JobCardDetailsModal from './JobCardDetailsModal'

const ProductionPlanDetailsPage = () => {
  const { planId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(true)
  const [planDetails, setPlanDetails] = useState(null)
  const [jobCards, setJobCards] = useState([])
  const [jobCardsLoading, setJobCardsLoading] = useState(false)
  const [selectedJobCard, setSelectedJobCard] = useState(null)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)

  // Get selected plan from Redux if available
  const { selectedPlan, productionPlans } = useSelector(state => state.productionDetails)

  // Load production plan details
  useEffect(() => {
    if (planId) {
      // First try to find the plan in already loaded data
      const existingPlan = productionPlans.find(p => p.id === parseInt(planId))
      if (existingPlan) {
        console.log('Using existing plan from Redux:', existingPlan)
        setPlanDetails(existingPlan)
        setLoading(false)
      } else if (selectedPlan && selectedPlan.id === parseInt(planId)) {
        console.log('Using selected plan from Redux:', selectedPlan)
        setPlanDetails(selectedPlan)
        setLoading(false)
      } else {
        // Load from API if not in Redux
        loadPlanDetails()
      }
      loadJobCards()
    }
  }, [planId, productionPlans, selectedPlan])

  const loadPlanDetails = async () => {
    setLoading(true)
    try {
      const response = await dispatch(getProductionPlanById(planId)).unwrap()
      console.log('Production Plan Response:', response)

      // Handle different response structures
      if (response) {
        setPlanDetails(response)
      } else {
        console.error('No plan data received')
        setPlanDetails(null)
      }
    } catch (error) {
      console.error('Error loading plan details:', error)
      setPlanDetails(null)
    } finally {
      setLoading(false)
    }
  }

  const loadJobCards = async () => {
    setJobCardsLoading(true)
    try {
      const response = await dispatch(
        getJobCardsWithDetails({
          prodPlanId: planId,
          page: 1,
          limit: 100
        })
      ).unwrap()
      setJobCards(response.jobCards || [])
    } catch (error) {
      console.error('Error loading job cards:', error)
      setJobCards([])
    } finally {
      setJobCardsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      on_hold: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status] || colors.pending
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      in_progress: <Play className="h-4 w-4" />,
      completed: <CheckCircle2 className="h-4 w-4" />,
      on_hold: <AlertCircle className="h-4 w-4" />,
      cancelled: <AlertCircle className="h-4 w-4" />
    }
    return icons[status] || icons.pending
  }

  const handleViewDetails = (jobCard) => {
    setSelectedJobCard(jobCard)
    setDetailsModalVisible(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading production plan...</p>
        </div>
      </div>
    )
  }

  if (!planDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg mb-2">Production plan not found</p>
          <p className="text-slate-500 text-sm mb-4">Plan ID: {planId}</p>
          <button
            onClick={() => navigate('/production-plans-modern')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Production Plans
          </button>
        </div>
      </div>
    )
  }

  console.log('Rendering with plan details:', planDetails)

  const totalQuantity = planDetails.quantity || 0
  const allocatedQuantity = planDetails.quantityTracking?.allocatedQuantity || 0
  const remainingQuantity = totalQuantity - allocatedQuantity
  const progressPercentage = totalQuantity > 0 ? Math.round((allocatedQuantity / totalQuantity) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/production-plans-modern')}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Plans</span>
            </button>

            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                <Edit2 className="h-4 w-4" />
                Edit Plan
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Plus className="h-4 w-4" />
                Create Job Card
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-slate-800">
                  Production Plan #{planDetails.id}
                </h1>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${
                  planDetails.urgent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  <AlertCircle className="h-4 w-4" />
                  {planDetails.urgent ? 'URGENT' : 'NORMAL'}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${
                  getStatusColor(planDetails.currentStepStatus || 'pending')
                }`}>
                  {getStatusIcon(planDetails.currentStepStatus || 'pending')}
                  {(planDetails.currentStepStatus || 'pending').replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Created {moment(planDetails.createdAt).format('MMM DD, YYYY [at] HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>By {planDetails.createdBy || 'Unknown'}</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-slate-800">Total: {totalQuantity.toLocaleString()} units</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-slate-800">Pending: {remainingQuantity.toLocaleString()} units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Combined Plan Details Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header with Progress */}
          <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-5 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-slate-800">Production Plan Overview</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">Allocated:</span>
                <span className="text-2xl font-bold text-blue-600">{allocatedQuantity.toLocaleString()}</span>
                <span className="text-sm text-slate-500">of {totalQuantity.toLocaleString()} ({progressPercentage}%)</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="p-6">
            <div className="flex items-center gap-4">
              {/* Source Alloy */}
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Source Material</p>
                    <h3 className="text-lg font-bold text-slate-800">
                      {planDetails.alloyName || planDetails.sourceProduct || `Alloy ${planDetails.alloyId}`}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-green-100 rounded-full shadow-sm">
                  <ArrowRight className="h-6 w-6 text-slate-700" strokeWidth={2.5} />
                </div>
              </div>

              {/* Target Alloy */}
              <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-0.5">Target Product</p>
                    <h3 className="text-lg font-bold text-slate-800">
                      {planDetails.convertName || planDetails.targetProduct || `Alloy ${planDetails.convertToAlloyId}`}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Cards Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Job Cards ({jobCards.length})
              </h3>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <Plus className="h-4 w-4" />
                Create Job Card
              </button>
            </div>
          </div>

          {jobCardsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : jobCards.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-2">No job cards created yet</p>
              <p className="text-slate-500 text-sm mb-4">Create your first job card to start production</p>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Plus className="h-4 w-4" />
                Create First Job Card
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Job Card ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Created Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Current Step</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobCards.map((card) => (
                    <tr key={card.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">#{card.jobCardId || card.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600">{moment(card.createdAt).format('MMM DD, YYYY')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{card.quantity?.toLocaleString()} units</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600">{card.currentStepName || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                          getStatusColor(card.status || 'pending')
                        }`}>
                          {getStatusIcon(card.status || 'pending')}
                          {(card.status || 'pending').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium">
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notes */}
        {planDetails.note && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Notes
            </h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-slate-700">{planDetails.note}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductionPlanDetailsPage
