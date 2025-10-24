import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { getProductionPlansWithQuantities } from '../../redux/api/productionAPI'
import {
  LayoutDashboard,
  Play,
  CheckCircle2,
  Clock,
  Plus,
  Calendar,
  RefreshCw,
  Settings,
  Pause,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const SimplifiedProductionSystem = () => {
  const dispatch = useDispatch()
  const [localCurrentPage, setLocalCurrentPage] = useState(1)
  const [localPageSize, setLocalPageSize] = useState(15)

  // Get production data from Redux store
  const {
    productionPlans,
    totalPlansCount,
    currentPage,
    pageSize,
    loading: productionLoading
  } = useSelector(state => state.productionDetails)

  // Update local current page when Redux state changes
  useEffect(() => {
    const page = currentPage || 1
    setLocalCurrentPage(page)
  }, [currentPage])

  // Load production plans data
  useEffect(() => {
    dispatch(
      getProductionPlansWithQuantities({
        page: 1,
        limit: 15,
        search: '',
        urgent: '',
        status: '',
        dateRange: null
      })
    )
  }, [dispatch])

  // Handle pagination change
  const handlePageChange = (newPage) => {
    setLocalCurrentPage(newPage)
    dispatch(
      getProductionPlansWithQuantities({
        page: newPage,
        limit: localPageSize,
        search: '',
        urgent: '',
        status: '',
        dateRange: null
      })
    )
  }

  const handlePageSizeChange = (newSize) => {
    setLocalPageSize(newSize)
    setLocalCurrentPage(1)
    dispatch(
      getProductionPlansWithQuantities({
        page: 1,
        limit: newSize,
        search: '',
        urgent: '',
        status: '',
        dateRange: null
      })
    )
  }

  // Calculate production stats from real data
  const productionStats = {
    totalJobs: totalPlansCount || 0,
    activeJobs:
      productionPlans.filter(
        plan =>
          plan.currentStepStatus === 'in_progress' || plan.status === 'active'
      ).length || 0,
    completedJobs:
      productionPlans.filter(
        plan =>
          plan.status === 'completed' || plan.currentStepStatus === 'completed'
      ).length || 0,
    pendingJobs:
      productionPlans.filter(
        plan =>
          plan.status === 'pending' || plan.currentStepStatus === 'pending'
      ).length || 0
  }

  const totalPages = Math.ceil(totalPlansCount / localPageSize)
  const startRecord = (localCurrentPage - 1) * localPageSize + 1
  const endRecord = Math.min(localCurrentPage * localPageSize, totalPlansCount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">
            Production Management
          </h1>
        </div>
        <p className="text-slate-600 ml-14">
          Streamlined production planning and job tracking system
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Jobs Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Total Jobs</p>
          <p className="text-3xl font-bold text-slate-800">
            {productionStats.totalJobs}
          </p>
        </div>

        {/* Active Jobs Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Play className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Active Jobs</p>
          <p className="text-3xl font-bold text-green-600">
            {productionStats.activeJobs}
          </p>
        </div>

        {/* Completed Jobs Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Completed</p>
          <p className="text-3xl font-bold text-emerald-600">
            {productionStats.completedJobs}
          </p>
        </div>

        {/* Pending Jobs Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-600">
            {productionStats.pendingJobs}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-800">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <Plus className="h-4 w-4" />
              Create New Job
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Production Plans */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Table Header with Filters */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Production Plans
            </h2>
            <div className="flex flex-wrap gap-3">
              <select className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <input
                type="date"
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {productionLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Production Plan
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Current Step
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {productionPlans.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-12 w-12 text-slate-300" />
                        <p className="text-slate-500">No production plans found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  productionPlans.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Production Plan */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span className="font-semibold text-blue-600">
                            #{record.id}
                          </span>
                          <span className="text-sm text-slate-600">
                            {record.targetProductName}
                          </span>
                          {record.urgent === 1 ||
                          record.urgent === '1' ||
                          record.urgent === true ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium w-fit">
                              <AlertCircle className="h-3 w-3" />
                              URGENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium w-fit">
                              NORMAL
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-slate-800">
                            {record.quantity?.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500">units</span>
                        </div>
                      </td>

                      {/* Current Step */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-slate-800">
                            {record.currentStepName || 'Not Started'}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {moment(record.createdAt).format('DD MMM YYYY')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {(record.currentStepStatus === 'pending' ||
                            record.status === 'pending') && (
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                              <Play className="h-3.5 w-3.5" />
                              Start
                            </button>
                          )}
                          {record.currentStepStatus === 'in_progress' && (
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                              <Pause className="h-3.5 w-3.5" />
                              Pause
                            </button>
                          )}
                          <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
                            <Settings className="h-3.5 w-3.5" />
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPlansCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Results Info */}
              <div className="text-sm text-slate-600">
                Showing {startRecord} to {endRecord} of {totalPlansCount} plans
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* Page Size Selector */}
                <select
                  value={localPageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 / page</option>
                  <option value={15}>15 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>

                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(localCurrentPage - 1)}
                  disabled={localCurrentPage === 1}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = idx + 1
                    } else if (localCurrentPage <= 3) {
                      pageNum = idx + 1
                    } else if (localCurrentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx
                    } else {
                      pageNum = localCurrentPage - 2 + idx
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          localCurrentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(localCurrentPage + 1)}
                  disabled={localCurrentPage === totalPages}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SimplifiedProductionSystem
