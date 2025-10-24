import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Play,
  Settings,
  ChevronDown,
  ChevronRight,
  Calendar,
  AlertCircle,
  Package,
  TrendingUp,
  Clock,
  ArrowRight,
  Rocket,
  X
} from 'lucide-react'

import {
  getProductionPlansWithQuantities,
  deleteProductionPlan,
  getProductionSteps
} from '../../redux/api/productionAPI'
import {
  setSearchTerm,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedPlan
} from '../../redux/slices/production.slice'

import EditProductionPlanModal from './EditProductionPlanModal'
import AssignPresetModal from './AssignPresetModal'
import JobCardCreationModal from './JobCardCreationModal'

const ProductionListingModern = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [localSearch, setLocalSearch] = useState('')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null)
  const [assignPresetModalVisible, setAssignPresetModalVisible] = useState(false)
  const [selectedPlanForPreset, setSelectedPlanForPreset] = useState(null)
  const [jobCardModalVisible, setJobCardModalVisible] = useState(false)
  const [selectedPlanForJobCard, setSelectedPlanForJobCard] = useState(null)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const {
    productionPlans,
    totalPlansCount,
    currentPage,
    pageSize,
    searchTerm,
    filters,
    loading
  } = useSelector(state => state.productionDetails)

  // Load data
  useEffect(() => {
    dispatch(
      getProductionPlansWithQuantities({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        urgent: filters.urgent,
        dateRange: filters.dateRange
      })
    )
  }, [dispatch, currentPage, pageSize, searchTerm, filters])

  useEffect(() => {
    dispatch(getProductionSteps())
  }, [dispatch])

  // Handlers
  const handleSearch = () => {
    dispatch(setSearchTerm(localSearch))
    dispatch(setCurrentPage(1))
  }

  const handleFilterChange = (filterName, value) => {
    dispatch(setFilters({ [filterName]: value }))
    dispatch(setCurrentPage(1))
  }

  const handleClearFilters = () => {
    setLocalSearch('')
    dispatch(clearFilters())
    dispatch(setCurrentPage(1))
  }

  const handlePageChange = (newPage) => {
    dispatch(setCurrentPage(newPage))
  }

  const handlePageSizeChange = (newSize) => {
    dispatch(setPageSize(newSize))
    dispatch(setCurrentPage(1))
  }

  const handleView = (record) => {
    navigate(`/production-plan/${record.id}`)
  }

  const handleEdit = (record, e) => {
    e.stopPropagation()
    dispatch(setSelectedPlan(record))
    setSelectedPlanForEdit(record)
    setEditModalVisible(true)
  }

  const handleDelete = (record, e) => {
    e.stopPropagation()
    setDeleteConfirm(record)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      dispatch(deleteProductionPlan(deleteConfirm.id))
      setDeleteConfirm(null)
    }
  }

  const handleCreateJobCard = (record, e) => {
    e.stopPropagation()
    dispatch(setSelectedPlan(record))
    setSelectedPlanForJobCard(record)
    setJobCardModalVisible(true)
  }

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  // Calculate stats
  const getTotalQuantity = () => {
    return productionPlans.reduce((total, plan) => total + (plan.quantity || 0), 0)
  }

  const urgentCount = productionPlans.filter(p => p.urgent).length
  const activeCount = productionPlans.filter(p =>
    ['pending', 'in_progress'].includes(p.currentStepStatus)
  ).length

  const totalPages = Math.ceil(totalPlansCount / pageSize)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">
              Production Plans
            </h1>
            <p className="text-sm text-slate-600">
              Manage and track all production orders
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => navigate('/production/create')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              Create Plan
            </button>
            <button
              onClick={() => navigate('/smart-production')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm"
            >
              <Rocket className="h-4 w-4" />
              Smart Planner
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700 font-medium">Total Quantity</p>
                <p className="text-lg font-bold text-blue-900">{getTotalQuantity().toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-700 font-medium">Urgent Plans</p>
                <p className="text-lg font-bold text-amber-900">{urgentCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-700 font-medium">Active Plans</p>
                <p className="text-lg font-bold text-green-900">{activeCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search production plans..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={filters.urgent || ''}
            onChange={(e) => handleFilterChange('urgent', e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Priority</option>
            <option value="1">Urgent Only</option>
            <option value="0">Normal Only</option>
          </select>
          {(searchTerm || filters.urgent) && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : productionPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No production plans found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                        Production Plan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {productionPlans.map((record) => (
                      <tr
                        key={record.id}
                        onClick={() => handleView(record)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        {/* Production Plan */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-600">
                                #{record.id}
                              </span>
                              {record.urgent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-medium">
                                  <AlertCircle className="h-3 w-3" />
                                  URGENT
                                </span>
                              )}
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2 space-y-1">
                              <div className="text-xs text-slate-500">From:</div>
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {record.alloyName || record.sourceProduct || `Alloy ${record.alloyId}`}
                              </div>
                              <div className="flex items-center justify-center">
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                              </div>
                              <div className="text-xs text-slate-500">To:</div>
                              <div className="text-sm font-medium text-blue-700 truncate">
                                {record.convertName || record.targetProduct || `Convert ${record.convertToAlloyId}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800">
                              {moment(record.createdAt).format('MMM DD, YYYY')}
                            </span>
                            <span className="text-xs text-slate-500">
                              {moment(record.createdAt).format('HH:mm')}
                            </span>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-center">
                              <div className="text-lg font-bold text-slate-800">
                                {(record.quantity || 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500">units</div>
                            </div>
                            {record.quantityTracking && (
                              <div className="w-full">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-600">Progress</span>
                                  <span className="font-medium">
                                    {Math.round(((record.quantityTracking.allocatedQuantity || 0) / record.quantity) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(((record.quantityTracking.allocatedQuantity || 0) / record.quantity) * 100, 100)}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800">
                              {record.currentStepName || 'Not Started'}
                            </span>
                            {record.currentStepStatus && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium w-fit ${
                                record.currentStepStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                record.currentStepStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {record.currentStepStatus === 'in_progress' && <Play className="h-3 w-3" />}
                                {record.currentStepStatus.replace('_', ' ').toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => handleView(record)}
                              className="group inline-flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={(e) => handleEdit(record, e)}
                              className="group inline-flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm font-medium"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={(e) => handleCreateJobCard(record, e)}
                              className="group inline-flex items-center gap-2 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Job Card</span>
                            </button>
                            <button
                              onClick={(e) => handleDelete(record, e)}
                              className="group inline-flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalPlansCount)} of {totalPlansCount} plans
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>

                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180 text-slate-600" />
                    </button>

                    <div className="flex gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = idx + 1
                        } else if (currentPage <= 3) {
                          pageNum = idx + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx
                        } else {
                          pageNum = currentPage - 2 + idx
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  Delete Production Plan
                </h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete production plan #{deleteConfirm.id}? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditProductionPlanModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        planData={selectedPlanForEdit}
        onSuccess={() => {
          setEditModalVisible(false)
          dispatch(getProductionPlansWithQuantities({
            page: currentPage,
            limit: pageSize,
            search: searchTerm,
            urgent: filters.urgent,
            dateRange: filters.dateRange
          }))
        }}
      />

      <AssignPresetModal
        visible={assignPresetModalVisible}
        onClose={() => setAssignPresetModalVisible(false)}
        planData={selectedPlanForPreset}
        onSuccess={() => {
          setAssignPresetModalVisible(false)
          dispatch(getProductionPlansWithQuantities({
            page: currentPage,
            limit: pageSize,
            search: searchTerm,
            urgent: filters.urgent,
            dateRange: filters.dateRange
          }))
        }}
      />

      <JobCardCreationModal
        visible={jobCardModalVisible}
        onCancel={() => setJobCardModalVisible(false)}
        onSuccess={() => {
          setJobCardModalVisible(false)
          dispatch(getProductionPlansWithQuantities({
            page: currentPage,
            limit: pageSize,
            search: searchTerm,
            urgent: filters.urgent,
            dateRange: filters.dateRange
          }))
        }}
        selectedPlan={selectedPlanForJobCard}
      />
    </div>
  )
}

export default ProductionListingModern
