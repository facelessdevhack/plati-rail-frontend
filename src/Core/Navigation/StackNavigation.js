import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login from '../../Modules/Authentication/Login'
import InventoryDashboard from '../../Modules/Inventory/InventoryDashboard'
import InventoryInForm from '../../Modules/Inventory/InventoryInForm'
import AdminSalesDashboard from '../../Modules/Admin/AdminSalesDashboard'
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

import StockManagementDashboard from '../../Modules/Stock/StockManagementDashboard'
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
import { dataUserSiderRoutes } from '../../Modules/Layout/Routes/dataUserSiderRoutes'
import { saleCoSidebarRoutes } from '../../Modules/Layout/Routes/saleCoSidebarRoutes'
import { superadminSiderRoutes } from '../../Modules/Layout/Routes/superadminSiderRoutes'
import AdminOrderDashboard from '../../Modules/AdminOrderDashboard/OrderDashboard'
import DealerMetrics from '../../Modules/Admin/DealerMetrics'
import DealerMetricsDetails from '../../Modules/DealerMetrics/DealerMetricsDetails'
import DealerMetricsDetailsBySize from '../../Modules/DealerMetrics/DealerMetricsDetailsBySize'
import DealerMetricsForSize from '../../Modules/DealerMetrics/index-size'
import DealerWarrantyList from '../../Modules/DealerWarranty/DealerWarrantyList'
import DealerWarrantyDetail from '../../Modules/DealerWarranty/DealerWarrantyDetail'

import BulkStockAnalysis from '../../Modules/Stock/BulkStockAnalysis'
import InventoryManagement from '../../Modules/Inventory/InventoryManagement'
import QuickAddInventoryAdvanced from '../../Modules/Inventory/QuickAddInventoryAdvanced'
import DealersList from '../../Modules/DataEntry/DealersList';
import AddDealer from '../../Modules/DataEntry/AddDealer';
import EditDealer from '../../Modules/DataEntry/EditDealer';
import ProductionListing from '../../Modules/Production/ProductionListing';
import ProductionListingV2 from '../../Modules/Production/ProductionListingV2';
import ProductionListingModern from '../../Modules/Production/ProductionListingModern';
import ProductionPlanDetailsPage from '../../Modules/Production/ProductionPlanDetailsPage';
import AlloySelection from '../../Modules/Production/AlloySelection';
import PresetManagement from '../../Modules/Production/PresetManagement';
import SmartProductionDashboard from '../../Modules/Production/SmartProductionDashboard';
import ProductionPlannerV2 from '../../Modules/Production/ProductionPlannerV2';
import JobCardListing from '../../Modules/Production/JobCardListing';
import ProductionDashboard from '../../Modules/Production/ProductionDashboard';
import InventoryRequests from '../../Modules/Production/InventoryRequests';
import PurchaseDashboard from '../../Modules/PurchaseSystem/PurchaseDashboard';
import SmartPurchasing from '../../Modules/PurchaseSystem/smartPurchasing';
import PendingEntriesView from '../../Modules/SalesCoordination/PendingEntriesView';
import InProductionEntriesView from '../../Modules/SalesCoordination/InProductionEntriesView';
import DispatchEntriesView from '../../Modules/SalesCoordination/DispatchEntriesView';
import PricingEntriesView from '../../Modules/DataEntry/PricingEntriesView';
import CreateOrderView from '../../Modules/SalesCoordination/CreateOrderView';
import CreateOrderAlloys from '../../Modules/SalesCoordination/CreateOrderAlloys';
import SalesCoordinatorDashboard from '../../Modules/SalesCoordination/SalesCoordinatorDashboard';
import StockLogViewer from '../../Components/StockLogViewer';
import StockReconciliation from '../../Components/StockReconciliation';
import PriceListPage from '../../Modules/Admin/PriceListPage';
import EditPriceListPage from '../../Modules/Admin/EditPriceListPage';


import RejectedStockManagement from '../../Modules/Production/RejectedStockManagement';
import DiscardedStockManagement from '../../Modules/Production/DiscardedStockManagement';
import DispatchToSales from '../../Modules/Production/DispatchToSales';
import UserProductionSteps from '../../Modules/Admin/UserProductionSteps';
import EquipmentManagement from '../../Modules/Production/EquipmentManagement';
import StepPositionMapping from '../../Modules/Production/StepPositionMapping';
import { InventoryLocationsPage, InventoryLocationDetailsPage, InventoryMovementsPage } from '../../Modules/InventorySystem';
import { CostCategoriesPage, MonthlyOverheadsPage, ProfitDashboardPage, PLDashboardPage, CEODashboard } from '../../Modules/CostManagement';
import { MoldManagementDashboard } from '../../Modules/Ordering';
import TempCostingView from '../../Modules/Admin/TempCostingView';

const StackNavigation = () => {
  const { loggedIn, user } = useSelector(state => state.userDetails)
  const navigate = useNavigate()
  const location = useLocation()

  // Helper function to get sidebar routes based on roleId
  const getSidebarRoutes = (roleId) => {
    const id = Number(roleId)
    if (id === 999) return superadminSiderRoutes // Superadmin - all access
    if (id === 5) return adminSiderRoutes // Admin
    if (id === 6) return dataUserSiderRoutes // Production/Data user
    if (id === 3) return entrySiderRoutes // Entry user
    if (id === 7) return saleCoSidebarRoutes // Sales coordinator
    if (id === 1) return dataUserSiderRoutes // Inventory user
    return adminSiderRoutes // Default fallback
  }

  useEffect(() => {
    if (loggedIn && user) {
      const roleId = Number(user.roleId)

      // Only navigate if the user is on the login page or root
      if (location.pathname === '/login' || location.pathname === '/') {
        if (roleId === 999) {
          navigate('/admin-dashboard') // Superadmin goes to admin dashboard
        } else if (roleId === 5) {
          navigate('/admin-dashboard')
        } else if (roleId === 7) {
          navigate('/sales-coordinator-dashboard')
        } else if (roleId === 3) {
          navigate('/entry-dashboard')
        } else if (roleId === 6) {
          navigate('/production-dashboard')
        } else if (roleId === 1) {
          navigate('/inventory-dashboard')
        } else {
          navigate('/dealer-warranty')
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
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
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
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout title='Daily Entry' content={<DailyEntryAdmin />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealers/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminDealerDetails />
          </PrivateRoute>
        }
      />

      {/* <Route
        path='/admin-stock-list'
        element={
          <PrivateRoute allowedRoles={[4]}>
            <AdminLayout title='Stock List' content={<StockList />} />
          </PrivateRoute>
        }
      /> */}

      {/* Data Entry Routes */}
      <Route
        path='/entry-dashboard'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<EntryDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-stock'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddStock />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddDailyEntry />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-alloys'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddDailyEntryALLOYS />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-tyres'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddDailyEntryTYRES />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-caps'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddDailyEntryCAP />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-ppf'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <AdminLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddDailyEntryPPF />}
            />
          </PrivateRoute>
        }
      />

      {/* Add Inwards Entry */}
      <Route
        path='add-payment-entry'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddPMEntry />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-charges-entry'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddChargesEntry />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-inwards-entry'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddDailyPurchaseEntry />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-cap-stock'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddCapStock />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-finish'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddFinish />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='add-model'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <EntryLayout
              title={`Welcome, ${user.firstName || ''} ${user.lastName || ''}`}
              items={getSidebarRoutes(user?.roleId)}
              content={<AddModel />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/entry-daily-entry-dealers'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout
              items={getSidebarRoutes(user?.roleId)}
              title='Daily Entry Dealers'
              content={<AdminDailyEntryDealersPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout
              items={getSidebarRoutes(user?.roleId)}
              title='Select Dealer For Metrics'
              content={<DealerMetrics />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics-for-size'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout
              items={getSidebarRoutes(user?.roleId)}
              title='Select Dealer For Metrics'
              content={<DealerMetricsForSize />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealer-metrics'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='Dealer Performance Metrics'
              items={getSidebarRoutes(user?.roleId)}
              content={<DealerMetrics />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics-details/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <DealerMetricsDetails />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics-by-size/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <DealerMetricsDetailsBySize />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-orders-dashboard/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminOrderDashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path='/stock-management'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout
              title='Stock Management Dashboard'
              items={getSidebarRoutes(user?.roleId)}
              content={<StockManagementDashboard />}
            />
          </PrivateRoute>
        }
      />
      
      <Route
        path='/bulk-stock-analysis'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <BulkStockAnalysis />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dashboard'
        element={
          <PrivateRoute allowedRoles={[5, 999]}>
            <AdminLayout
              title='Admin Sales Dashboard'
              items={getSidebarRoutes(user?.roleId)}
              content={<AdminSalesDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-coordinator-dashboard'
        element={
          <PrivateRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 999]}>
            <AdminLayout
              title='📊 Sales Coordinator Dashboard'
              items={getSidebarRoutes(user?.roleId)}
              content={<SalesCoordinatorDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealer-warranty'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout
              title='Dealer Warranty Registrations'
              items={getSidebarRoutes(user?.roleId)}
              content={<DealerWarrantyList />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealer-warranty/edit/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout
              title='Edit Warranty Registration'
              items={getSidebarRoutes(user?.roleId)}
              content={<DealerWarrantyDetail />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealers-list'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <EntryLayout
              title='Dealers List'
              content={<DealersList />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-dealer'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <EntryLayout title='Add Dealer' content={<AddDealer />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/edit-dealer'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <EntryLayout title='Edit Dealer' content={<EditDealer />} />
          </PrivateRoute>
        }
      />


      {/* Entry Inventory Management System */}
      <Route
        path='/entry-inventory-system'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <EntryLayout
              title='Inventory Management'
              items={getSidebarRoutes(user?.roleId)}
              content={<InventoryManagement />}
            />
          </PrivateRoute>
        }
      />

      {/* New Inventory Management System */}
      <Route
        path='/inventory-management-v2'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <AdminLayout
              title='Inventory Management'
              items={getSidebarRoutes(user?.roleId)}
              content={<InventoryManagement />}
            />
          </PrivateRoute>
        }
      />

      {/* Stock Logging System */}
      <Route
        path='/stock-logs'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <AdminLayout
              title='Stock Logs'
              items={getSidebarRoutes(user?.roleId)}
              content={<StockLogViewer />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/stock-reconciliation'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <AdminLayout
              title='Stock Reconciliation'
              items={getSidebarRoutes(user?.roleId)}
              content={<StockReconciliation />}
            />
          </PrivateRoute>
        }
      />

      {/* Inventory System Routes */}
      <Route
        path='/inventory-locations'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <AdminLayout
              title='Inventory Locations'
              items={getSidebarRoutes(user?.roleId)}
              content={<InventoryLocationsPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/inventory-locations/:locationId'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <AdminLayout
              title='Location Details'
              items={getSidebarRoutes(user?.roleId)}
              content={<InventoryLocationDetailsPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/inventory-movements'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <AdminLayout
              title='Inventory Movements'
              items={getSidebarRoutes(user?.roleId)}
              content={<InventoryMovementsPage />}
            />
          </PrivateRoute>
        }
      />

      {/* Production Routes */}
      <Route
        path='/production-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Production Dashboard'
              items={getSidebarRoutes(user?.roleId)}
              content={<ProductionDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plans'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Production Plans'
              items={getSidebarRoutes(user?.roleId)}
              content={<ProductionListing />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plans-v2'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Production Plans V2'
              items={getSidebarRoutes(user?.roleId)}
              content={<ProductionListingV2 />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plans-modern'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <ProductionListingModern />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plan/:planId'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <ProductionPlanDetailsPage />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-alloys'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Alloy Selection'
              items={getSidebarRoutes(user?.roleId)}
              content={<AlloySelection />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-presets'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Preset Management'
              items={getSidebarRoutes(user?.roleId)}
              content={<PresetManagement />}
            />
          </PrivateRoute>
        }
      />
       <Route
         path='/rejected-stock'
         element={
           <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
             <AdminLayout
               title='Rejected Stock Management'
               items={getSidebarRoutes(user?.roleId)}
               content={<RejectedStockManagement />}
             />
           </PrivateRoute>
         }
       />
      <Route
        path='/dispatch-to-sales'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Dispatch to Sales - Ready Units'
              items={getSidebarRoutes(user?.roleId)}
              content={<DispatchToSales />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/discarded-stock-management'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='Discarded Stock Management'
              items={getSidebarRoutes(user?.roleId)}
              content={<DiscardedStockManagement />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/smart-production'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Smart Production Dashboard'
              items={getSidebarRoutes(user?.roleId)}
              content={<SmartProductionDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-planner-v2'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Production Planner V2'
              items={getSidebarRoutes(user?.roleId)}
              content={<ProductionPlannerV2 />}
            />
          </PrivateRoute>
        }
      />
          <Route
        path='/job-cards'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <AdminLayout
              title='Job Cards'
              items={getSidebarRoutes(user?.roleId)}
              content={<JobCardListing />}
            />
          </PrivateRoute>
        }
      />
          <Route
        path='/inventory-requests'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Inventory Requests'
              items={getSidebarRoutes(user?.roleId)}
              content={<InventoryRequests />}
            />
          </PrivateRoute>
        }
      />

      {/* <Route
        path="/entry-daily-entry"
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout items={getSidebarRoutes(user?.roleId)} title="Daily Entry" content={<DailyEntryAdmin />} />
          </PrivateRoute>
        }
      /> */}

      {/* Purchase System Routes */}
      <Route
        path='/purchase-orders'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <AdminLayout
              title='Purchase Orders'
              items={getSidebarRoutes(user?.roleId)}
              content={<PurchaseDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase-orders/smart-purchasing'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <SmartPurchasing />
          </PrivateRoute>
        }
      />

      {/* Sales Coordination System Routes */}
      <Route
        path='/sales-pending-entries'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <AdminLayout
              title='⏳ Pending Entries - Sales Coordination'
              items={getSidebarRoutes(user?.roleId)}
              content={<PendingEntriesView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-inprod-entries'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <AdminLayout
              title='🔄 In-Production Entries - Sales Coordination'
              items={getSidebarRoutes(user?.roleId)}
              content={<InProductionEntriesView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-dispatch-entries'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <AdminLayout
              title='📦 Dispatch Entries - Sales Coordination'
              items={getSidebarRoutes(user?.roleId)}
              content={<DispatchEntriesView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/data-entry-pricing'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout
              title='💰 Pricing Entries - Data Entry'
              items={getSidebarRoutes(user?.roleId)}
              content={<PricingEntriesView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-create-order'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <AdminLayout
              title='📋 Create Order - Sales Coordination'
              items={getSidebarRoutes(user?.roleId)}
              content={<CreateOrderView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-create-order-alloys'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <AdminLayout
              title='🔩 Create Alloys Order - Sales Coordination'
              items={getSidebarRoutes(user?.roleId)}
              content={<CreateOrderAlloys />}
            />
          </PrivateRoute>
        }
      />

      {/* User Production Steps Management */}
      <Route
        path='/user-production-steps'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='👥 User Production Step Assignments'
              items={getSidebarRoutes(user?.roleId)}
              content={<UserProductionSteps />}
            />
          </PrivateRoute>
        }
      />

      {/* Equipment Management */}
      <Route
        path='/equipment-management'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='🔧 Equipment Management'
              items={getSidebarRoutes(user?.roleId)}
              content={<EquipmentManagement />}
            />
          </PrivateRoute>
        }
      />

      {/* Step-Position Mapping */}
      <Route
        path='/step-position-mapping'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='📍 Step-Position Mapping'
              items={getSidebarRoutes(user?.roleId)}
              content={<StepPositionMapping />}
            />
          </PrivateRoute>
        }
      />

      {/* Price List Management Route */}
      <Route
        path='/price-lists'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout
              title='💰 Price Lists Management'
              items={getSidebarRoutes(user?.roleId)}
              content={<PriceListPage />}
            />
          </PrivateRoute>
        }
      />

      {/* Edit Price List Route */}
      <Route
        path='/price-lists/edit/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <AdminLayout
              title='⚙️ Edit Price List'
              items={getSidebarRoutes(user?.roleId)}
              content={<EditPriceListPage />}
            />
          </PrivateRoute>
        }
      />

      {/* Cost Management Routes */}
      <Route
        path='/cost-categories'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='Cost Categories'
              items={getSidebarRoutes(user?.roleId)}
              content={<CostCategoriesPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/monthly-overheads'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='Monthly Overheads'
              items={getSidebarRoutes(user?.roleId)}
              content={<MonthlyOverheadsPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/profit-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='Profit Dashboard'
              items={getSidebarRoutes(user?.roleId)}
              content={<ProfitDashboardPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/pnl-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='P&L Dashboard'
              items={getSidebarRoutes(user?.roleId)}
              content={<PLDashboardPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/ceo-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='CEO Dashboard'
              items={getSidebarRoutes(user?.roleId)}
              content={<CEODashboard />}
            />
          </PrivateRoute>
        }
      />

      {/* Mold Management Routes */}
      <Route
        path='/mold-management'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='Mold Management'
              items={getSidebarRoutes(user?.roleId)}
              content={<MoldManagementDashboard />}
            />
          </PrivateRoute>
        }
      />

      {/* Temp Costing View - Restricted to userId 4 only */}
      <Route
        path='/temp-costing'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <AdminLayout
              title='Product Costing Management'
              items={getSidebarRoutes(user?.roleId)}
              content={<TempCostingView />}
            />
          </PrivateRoute>
        }
      />

      {/* ...other routes wrapped with PrivateRoute */}
    </Routes>
  )
}

export default StackNavigation
