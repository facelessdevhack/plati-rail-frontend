import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login from '../../Modules/Authentication/Login'
import InventoryDashboard from '../../Modules/Inventory/InventoryDashboard'
import InventoryInForm from '../../Modules/Inventory/InventoryInForm'
import AdminDashboard from '../../Modules/Admin/dashboard'
import { MissingRoute } from './MissingRoute'
import AdminLayout from '../../Modules/Layout/adminLayout'
import EntryDashboard from '../../Modules/DataEntry/EntryDashboard'
import { entrySiderRoutes } from '../../Modules/Layout/Routes/entrySiderRoutes'
import AddStock from '../../Modules/Stock/AddStock'
import AddModel from '../../Modules/AddModules/AddModel'
import AddPcd from '../../Modules/AddModules/AddPcd'
import AddDailyEntry from '../../Modules/DataEntry/AddDailyEntry'
import DailyEntryAdmin from '../../Modules/DailyEntry'
import AdminDailyEntryDealersPage from '../../Modules/DailyEntry/DailyEntryDealers'
import AdminDealerDetails from '../../Modules/DailyEntry/Dealers/DealersDetails'
import AddPMEntry from '../../Modules/DataEntry/AddPMEntry'
import PrivateRoute from './PrivateRoute'
import UnauthorizedPage from './UnauthorizedPage'
import StockList from '../../Modules/Stock/StockList'
import AddDailyPurchaseEntry from '../../Modules/DataEntry/AddDailyPurchaseEntry'
import AddCapStock from '../../Modules/AddModules/AddCapModel'
import AddFinish from '../../Modules/AddModules/AddFinish'
import EntryLayout from '../../Modules/Layout/entryLayout'
import AddDailyEntryTYRES from '../../Modules/DataEntry/AddDailyEntry-TYRES'
import AddDailyEntryALLOYS from '../../Modules/DataEntry/AddDailyEntry-ALLOYS'
import AddDailyEntryCAP from '../../Modules/DataEntry/AddDailyEntry-CAP'
import AddDailyEntryPPF from '../../Modules/DataEntry/AddDailyEntry-PPF'
import AddChargesEntry from '../../Modules/DataEntry/AddChargesEntry'
import { adminSiderRoutes } from '../../Modules/Layout/Routes/adminSiderRoutes'
import AdminOrderDashboard from '../../Modules/AdminOrderDashboard/OrderDashboard'
import DealerMetrics from '../../Modules/DealerMetrics'
import DealerMetricsDetails from '../../Modules/DealerMetrics/DealerMetricsDetails'
import DealerMetricsDetailsBySize from '../../Modules/DealerMetrics/DealerMetricsDetailsBySize'
import DealerMetricsForSize from '../../Modules/DealerMetrics/index-size'
import CreateProductionPlan from '../../Modules/Production/CreateProductionPlan'
import ProductionPlansList from '../../Modules/Production/ProductionPlansList'
import ProductionPlanDetails from '../../Modules/Production/ProductionPlanDetails'
import CreateJobCard from '../../Modules/Production/CreateJobCard'
import JobCardsList from '../../Modules/Production/JobCardsList'
import JobCardDetails from '../../Modules/Production/JobCardDetails'
import ProductionWorkflow from '../../Modules/Production/ProductionWorkflow'

const StackNavigation = () => {
  const { loggedIn, user } = useSelector(state => state.userDetails)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loggedIn && user) {
      const roleId = Number(user.roleId)

      // Only navigate if the user is on the login page or root
      if (location.pathname === '/login' || location.pathname === '/') {
        if ([4, 5].includes(roleId)) {
          navigate('/admin-daily-entry-dealers')
        } else if (roleId === 3) {
          navigate('/entry-dashboard')
        } else if (roleId === 1) {
          navigate('/inventory-dashboard')
        } else {
          navigate('/unauthorized')
        }
      }
    }
  }, [loggedIn, user, navigate, location.pathname])

  return (
    <Routes>
      {/* Public Routes */}
      <Route path='login' element={<Login />} />
      <Route path='unauthorized' element={<UnauthorizedPage />} />
      <Route path='*' element={<MissingRoute />} />

      {/* Private Routes */}
      <Route
        path='/admin-daily-entry-dealers'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Daily Entry Dealers'
              content={<AdminDailyEntryDealersPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-daily-entry'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout title='Daily Entry' content={<DailyEntryAdmin />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealers/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminDealerDetails />
          </PrivateRoute>
        }
      />

      <Route
        path='/admin-stock-list'
        element={
          <PrivateRoute allowedRoles={[4]}>
            <AdminLayout title='Stock List' content={<StockList />} />
          </PrivateRoute>
        }
      />

      {/* Data Entry Routes */}
      <Route
        path='/entry-dashboard'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<EntryDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-stock'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddStock />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddDailyEntry />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-alloys'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddDailyEntryALLOYS />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-tyres'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddDailyEntryTYRES />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-caps'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddDailyEntryCAP />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-ppf'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddDailyEntryPPF />}
            />
          </PrivateRoute>
        }
      />

      {/* Add Inwards Entry */}
      <Route
        path='add-payment-entry'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddPMEntry />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-charges-entry'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddChargesEntry />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-inwards-entry'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddDailyPurchaseEntry />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-cap-stock'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddCapStock />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-finish'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddFinish />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-model'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={entrySiderRoutes}
              content={<AddModel />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/entry-daily-entry-dealers'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              items={entrySiderRoutes}
              title='Daily Entry Dealers'
              content={<AdminDailyEntryDealersPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              items={adminSiderRoutes}
              title='Select Dealer For Metrics'
              content={<DealerMetrics />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics-for-size'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              items={adminSiderRoutes}
              title='Select Dealer For Metrics'
              content={<DealerMetricsForSize />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealer-metrics'
        element={
          <PrivateRoute allowedRoles={[3, 4]}>
            <AdminLayout
              items={entrySiderRoutes}
              title='Select Dealer For Metrics'
              content={<DealerMetrics />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics-details/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <DealerMetricsDetails />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics-by-size/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <DealerMetricsDetailsBySize />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-orders-dashboard/:id'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminOrderDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path='/stock-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <StockList />
          </PrivateRoute>
        }
      />

      {/* Production Module Routes */}
      <Route
        path='/production-plans'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Production Plans'
              items={adminSiderRoutes}
              content={<ProductionPlansList />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plan/create'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Create Production Plan'
              items={adminSiderRoutes}
              content={<CreateProductionPlan />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plan/:planId'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Production Plan Details'
              items={adminSiderRoutes}
              content={<ProductionPlanDetails />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-job-cards'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Job Cards'
              items={adminSiderRoutes}
              content={<JobCardsList />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-job-card/create/:planId'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Create Job Card'
              items={adminSiderRoutes}
              content={<CreateJobCard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-job-card/:jobCardId'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Job Card Details'
              items={adminSiderRoutes}
              content={<JobCardDetails />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-workflow'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Production Workflow'
              items={adminSiderRoutes}
              content={<ProductionWorkflow />}
            />
          </PrivateRoute>
        }
      />
      {/* <Route
        path="/entry-daily-entry"
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout items={entrySiderRoutes} title="Daily Entry" content={<DailyEntryAdmin />} />
          </PrivateRoute>
        }
      /> */}
      {/* ...other routes wrapped with PrivateRoute */}
    </Routes>
  )
}

export default StackNavigation
