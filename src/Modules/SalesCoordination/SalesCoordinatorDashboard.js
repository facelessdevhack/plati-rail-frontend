import React, { useState, useEffect } from 'react'
import { Button, Spin, Alert, message, Space } from 'antd'
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  getPendingEntriesAPI,
  getDispatchEntriesAPI,
  getInProductionEntriesAPI,
  getPendingEntriesComparisonAPI
} from '../../redux/api/entriesAPI'
import moment from 'moment'
import './SalesCoordinatorDashboard.css'

// Modern Lucide React Icons for shadcn style
import {
  Clock,
  Truck,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Activity
} from 'lucide-react'

const SalesCoordinatorDashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // KPI data states
  const [pendingEntries, setPendingEntries] = useState([])
  const [dispatchEntries, setDispatchEntries] = useState([])
  const [inProductionEntries, setInProductionEntries] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  // Comparison data for month-over-month analysis
  const [pendingComparison, setPendingComparison] = useState({
    currentCount: 0,
    previousCount: 0,
    percentageChange: 0,
    trend: 'neutral' // 'up', 'down', 'neutral'
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all data in parallel
      const [pendingRes, dispatchRes, inProductionRes, comparisonRes] =
        await Promise.all([
          dispatch(getPendingEntriesAPI()).unwrap(),
          dispatch(getDispatchEntriesAPI()).unwrap(),
          dispatch(getInProductionEntriesAPI()).unwrap(),
          dispatch(getPendingEntriesComparisonAPI()).unwrap()
        ])

      setPendingEntries(pendingRes.pendingEntries || [])
      setDispatchEntries(dispatchRes.dispatchEntries || [])
      setInProductionEntries(inProductionRes.inProdEntries || [])
      setLastUpdated(moment())

      // Set comparison data
      if (comparisonRes && comparisonRes.comparisonData) {
        setPendingComparison({
          currentCount: comparisonRes.comparisonData.currentCount || 0,
          previousCount: comparisonRes.comparisonData.previousCount || 0,
          percentageChange: comparisonRes.comparisonData.percentageChange || 0,
          trend: comparisonRes.comparisonData.trend || 'neutral'
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
      message.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchAllData()
  }

  const navigateToPage = path => {
    navigate(path)
  }

  // Modern KPI Card Component
  const KpiCard = ({
    title,
    value,
    icon: Icon,
    color,
    description,
    route,
    buttonText,
    comparison,
    status,
    bgColor = 'bg-white',
    borderColor = 'border-gray-200',
    hoverEffect = 'hover:shadow-lg hover:scale-[1.02]'
  }) => {
    const getTrendIcon = () => {
      switch (comparison?.trend) {
        case 'up':
          return <TrendingUp className='h-4 w-4 text-green-600' />
        case 'down':
          return <TrendingDown className='h-4 w-4 text-red-600' />
        default:
          return <Minus className='h-4 w-4 text-gray-500' />
      }
    }

    const getTrendColor = () => {
      switch (comparison?.trend) {
        case 'up':
          return 'text-green-600 bg-green-50'
        case 'down':
          return 'text-red-600 bg-red-50'
        default:
          return 'text-gray-600 bg-gray-50'
      }
    }

    const getStatusBadge = () => {
      if (value === 0) {
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            All clear
          </span>
        )
      }
      return (
        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 animate-pulse'>
          <Activity className='h-3 w-3 mr-1' />
          Needs attention
        </span>
      )
    }

    return (
      <div
        onClick={() => navigateToPage(route)}
        className={`
          relative overflow-hidden rounded-xl border-2 ${borderColor} ${bgColor}
          transition-all duration-300 ease-in-out cursor-pointer
          ${hoverEffect} hover:border-blue-200 group
          animate-fadeIn
        `}
      >
        {/* Gradient overlay for modern look */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
        />

        <div className='p-6 relative'>
          {/* Header with icon and title */}
          <div className='flex items-center justify-between mb-4'>
            <div
              className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div className='text-right'>{getStatusBadge()}</div>
          </div>

          {/* Main content */}
          <div className='space-y-3'>
            <div>
              <h3 className='text-sm font-medium text-gray-600 uppercase tracking-wide mb-1'>
                {title}
              </h3>
              <div className='flex items-baseline space-x-2'>
                <p className='text-3xl font-bold text-gray-900 tabular-nums'>
                  {value.toLocaleString()}
                </p>
                <span className='text-sm text-gray-500'>entries</span>
              </div>
            </div>

            <p className='text-sm text-gray-600 leading-relaxed'>
              {description}
            </p>

            {/* Comparison section */}
            {/* {comparison && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon()}
                    <span className={`text-sm font-semibold ${getTrendColor()} px-2 py-1 rounded-full`}>
                      {comparison.percentageChange > 0 ? '+' : ''}{comparison.percentageChange.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    vs last month
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {comparison.previousCount} → {comparison.currentCount}
                </div>
              </div>
            )} */}

            {/* Action button */}
            <button
              className={`
                w-full mt-4 px-4 py-2 text-sm font-medium rounded-lg
                bg-gradient-to-r ${color} text-black
                hover:opacity-90 transform hover:scale-[1.02]
                transition-all duration-200 focus:outline-none
                focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                shadow-md hover:shadow-lg
              `}
            >
              {buttonText}
            </button>
          </div>
        </div>

        {/* Subtle animation border */}
        <div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
        />
      </div>
    )
  }

  // KPI Cards Data with modern color schemes
  const kpiCards = [
    {
      title: 'Pending Entries',
      value: pendingEntries.length,
      icon: Clock,
      color: 'bg-amber-500 text-amber-600',
      description: 'Entries waiting for stock availability',
      route: '/sales-pending-entries',
      buttonText: 'View Pending Entries',
      comparison: pendingComparison,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      hoverEffect: 'hover:shadow-amber-100 hover:shadow-xl hover:scale-[1.02]'
    },
    {
      title: 'Dispatch Approval',
      value: dispatchEntries.length,
      icon: Truck,
      color: 'bg-blue-500 text-blue-600',
      description: 'Entries ready for coordinator approval',
      route: '/sales-dispatch-entries',
      buttonText: 'Review Dispatch Entries',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverEffect: 'hover:shadow-blue-100 hover:shadow-xl hover:scale-[1.02]'
    },
    {
      title: 'In Production',
      value: inProductionEntries.length,
      icon: Settings,
      color: 'bg-purple-500 text-purple-600',
      description: 'Entries currently in production',
      route: '/sales-inprod-entries',
      buttonText: 'View Production Queue',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverEffect: 'hover:shadow-purple-100 hover:shadow-xl hover:scale-[1.02]'
    }
  ]

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='relative'>
            <Spin size='large' />
            <div className='absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-20'></div>
          </div>
          <div className='space-y-2'>
            <h2 className='text-2xl font-semibold text-gray-800 animate-fadeIn'>
              Loading Dashboard...
            </h2>
            <p className='text-gray-600 animate-fadeIn animation-delay-200'>
              Preparing your sales insights
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50'>
      <div className='container mx-auto px-6 py-8'>
        {/* Modern Header */}
        <div className='mb-8'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>
                Sales Coordinator Dashboard
              </h1>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <Activity className='h-4 w-4' />
                <span>
                  {lastUpdated
                    ? `Last updated: ${lastUpdated.format(
                        'MMM DD, YYYY h:mm A'
                      )}`
                    : 'Loading...'}
                </span>
              </div>
            </div>
            <div className='flex space-x-3'>
              <Button
                icon={<RefreshCw className='h-4 w-4' />}
                onClick={handleRefresh}
                loading={loading}
                className='bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transition-all duration-200'
              >
                Refresh
              </Button>
              <Button
                icon={<Settings className='h-4 w-4' />}
                onClick={() => navigate('/settings')}
                className='bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transition-all duration-200'
              >
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className='mb-6 animate-slideInFromTop'>
            <Alert
              message='Error'
              description={error}
              type='error'
              showIcon
              closable
              onClose={() => setError(null)}
              className='rounded-lg border-l-4 border-red-500 bg-red-50'
            />
          </div>
        )}

        {/* Modern KPI Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          {kpiCards.map((kpi, index) => (
            <div
              key={index}
              className='animate-scaleIn'
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <KpiCard {...kpi} />
            </div>
          ))}
        </div>

        {/* Quick Stats Section */}
        {/* <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8'>
          <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                  Total Active
                </p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {(
                    pendingEntries.length +
                    dispatchEntries.length +
                    inProductionEntries.length
                  ).toLocaleString()}
                </p>
              </div>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <Activity className='h-5 w-5 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                  Pending Rate
                </p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {pendingEntries.length > 0 ? 'High' : 'Low'}
                </p>
              </div>
              <div className='p-2 bg-amber-100 rounded-lg'>
                <Clock className='h-5 w-5 text-amber-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                  Ready to Ship
                </p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {dispatchEntries.length.toLocaleString()}
                </p>
              </div>
              <div className='p-2 bg-green-100 rounded-lg'>
                <Truck className='h-5 w-5 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                  In Production
                </p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {inProductionEntries.length.toLocaleString()}
                </p>
              </div>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <Settings className='h-5 w-5 text-purple-600' />
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default SalesCoordinatorDashboard
