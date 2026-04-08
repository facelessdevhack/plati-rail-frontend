import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login from '../../Modules/Authentication/Login'
import InventoryDashboard from '../../Modules/Inventory/InventoryDashboard'
import InventoryInForm from '../../Modules/Inventory/InventoryInForm'
import AdminSalesDashboard from '../../Modules/Admin/AdminSalesDashboard'
import { MissingRoute } from './MissingRoute'
import AdminLayout from '../../Modules/Layout/adminLayout'
import TopNavLayout from '../../Modules/Layout/TopNavLayout'
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
import { storeManagerSiderRoutes } from '../../Modules/Layout/Routes/storeManagerSiderRoutes'
import { purchaseManagerSiderRoutes } from '../../Modules/Layout/Routes/purchaseManagerSiderRoutes'
import { purchaseCoordinatorSiderRoutes } from '../../Modules/Layout/Routes/purchaseCoordinatorSiderRoutes'
import CreateRequisition from '../../Modules/Purchase/CreateRequisition'
import RequisitionList from '../../Modules/Purchase/RequisitionList'
import RequisitionDetails from '../../Modules/Purchase/RequisitionDetails'
import IndentList from '../../Modules/Purchase/IndentList'
import CreateIndent from '../../Modules/Purchase/CreateIndent'
import IndentDetails from '../../Modules/Purchase/IndentDetails'
import ItemsMaster from '../../Modules/Purchase/ItemsMaster'
import ItemCategories from '../../Modules/Purchase/ItemCategories'
import POList from '../../Modules/Purchase/POList'
import CreatePO from '../../Modules/Purchase/CreatePO'
import PODetails from '../../Modules/Purchase/PODetails'
import GRNList from '../../Modules/Purchase/GRNList'
import CreateGRN from '../../Modules/Purchase/CreateGRN'
import GRNDetails from '../../Modules/Purchase/GRNDetails'
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
    if (id === 8) return storeManagerSiderRoutes // Store Manager
    if (id === 9) return purchaseManagerSiderRoutes // Purchase Manager
    if (id === 10) return purchaseCoordinatorSiderRoutes // Purchase Coordinator
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
        } else if (roleId === 8) {
          navigate('/purchase/indents')
        } else if (roleId === 9) {
          navigate('/purchase/requisitions')
        } else if (roleId === 10) {
          navigate('/purchase/indents')
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
            <TopNavLayout content={<AdminDailyEntryDealersPage />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-daily-entry'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<DailyEntryAdmin />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealers/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<AdminDealerDetails />} />
          </PrivateRoute>
        }
      />

      {/* <Route
        path='/admin-stock-list'
        element={
          <PrivateRoute allowedRoles={[4]}>
            <TopNavLayout content={<StockList />} />
          </PrivateRoute>
        }
      /> */}

      {/* Data Entry Routes */}
      <Route
        path='/entry-dashboard'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<EntryDashboard />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-stock'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddStock />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddDailyEntry />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-alloys'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddDailyEntryALLOYS />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-tyres'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddDailyEntryTYRES />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-caps'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddDailyEntryCAP />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-daily-entry-ppf'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddDailyEntryPPF />} />
          </PrivateRoute>
        }
      />

      {/* Add Inwards Entry */}
      <Route
        path='add-payment-entry'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddPMEntry />} />
          </PrivateRoute>
        }
      />
      <Route
        path='add-charges-entry'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddChargesEntry />} />
          </PrivateRoute>
        }
      />
      <Route
        path='add-inwards-entry'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddDailyPurchaseEntry />} />
          </PrivateRoute>
        }
      />
      <Route
        path='add-cap-stock'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddCapStock />} />
          </PrivateRoute>
        }
      />
      <Route
        path='add-finish'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddFinish />} />
          </PrivateRoute>
        }
      />
      <Route
        path='add-model'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<AddModel />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/entry-daily-entry-dealers'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<AdminDailyEntryDealersPage />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<DealerMetrics />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics-for-size'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<DealerMetricsForSize />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealer-metrics'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<DealerMetrics />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics-details/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<DealerMetricsDetails />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dealer-metrics-by-size/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<DealerMetricsDetailsBySize />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-orders-dashboard/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<AdminOrderDashboard />} />
          </PrivateRoute>
        }
      />
      
      <Route
        path='/stock-management'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<StockManagementDashboard />} />
          </PrivateRoute>
        }
      />
      
      <Route
        path='/bulk-stock-analysis'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<BulkStockAnalysis />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dashboard'
        element={
          <PrivateRoute allowedRoles={[5, 999]}>
            <TopNavLayout content={<AdminSalesDashboard />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-coordinator-dashboard'
        element={
          <PrivateRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 999]}>
            <TopNavLayout content={<SalesCoordinatorDashboard />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealer-warranty'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<DealerWarrantyList />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealer-warranty/edit/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<DealerWarrantyDetail />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealers-list'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<DealersList />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/add-dealer'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<AddDealer />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/edit-dealer'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<EditDealer />} />
          </PrivateRoute>
        }
      />


      {/* Entry Inventory Management System */}
      <Route
        path='/entry-inventory-system'
        element={
          <PrivateRoute allowedRoles={[3, 999]}>
            <TopNavLayout content={<InventoryManagement />} />
          </PrivateRoute>
        }
      />

      {/* New Inventory Management System */}
      <Route
        path='/inventory-management-v2'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <TopNavLayout content={<InventoryManagement />} />
          </PrivateRoute>
        }
      />

      {/* Stock Logging System */}
      <Route
        path='/stock-logs'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <TopNavLayout content={<StockLogViewer />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/stock-reconciliation'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <TopNavLayout content={<StockReconciliation />} />
          </PrivateRoute>
        }
      />

      {/* Inventory System Routes */}
      <Route
        path='/inventory-locations'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <TopNavLayout content={<InventoryLocationsPage />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/inventory-locations/:locationId'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <TopNavLayout content={<InventoryLocationDetailsPage />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/inventory-movements'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <TopNavLayout content={<InventoryMovementsPage />} />
          </PrivateRoute>
        }
      />

      {/* Production Routes */}
      <Route
        path='/production-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<ProductionDashboard />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plans'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<ProductionListing />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plans-v2'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<ProductionListingV2 />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plans-modern'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<ProductionListingModern />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plan/:planId'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<ProductionPlanDetailsPage />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-alloys'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<AlloySelection />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-presets'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<PresetManagement />} />
          </PrivateRoute>
        }
      />
       <Route
         path='/rejected-stock'
         element={
           <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
             <TopNavLayout content={<RejectedStockManagement />} />
           </PrivateRoute>
         }
       />
      <Route
        path='/dispatch-to-sales'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<DispatchToSales />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/discarded-stock-management'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<DiscardedStockManagement />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/smart-production'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<SmartProductionDashboard />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-planner-v2'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<ProductionPlannerV2 />} />
          </PrivateRoute>
        }
      />
          <Route
        path='/job-cards'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6, 999]}>
            <TopNavLayout content={<JobCardListing />} />
          </PrivateRoute>
        }
      />
          <Route
        path='/inventory-requests'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<InventoryRequests />} />
          </PrivateRoute>
        }
      />

      {/* <Route
        path="/entry-daily-entry"
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<DailyEntryAdmin />} />
          </PrivateRoute>
        }
      /> */}

      {/* Purchase System Routes */}
      <Route
        path='/purchase-orders'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<PurchaseDashboard />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase-orders/smart-purchasing'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6, 999]}>
            <TopNavLayout content={<SmartPurchasing />} />
          </PrivateRoute>
        }
      />

      {/* Sales Coordination System Routes */}
      <Route
        path='/sales-pending-entries'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <TopNavLayout content={<PendingEntriesView />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-inprod-entries'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <TopNavLayout content={<InProductionEntriesView />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-dispatch-entries'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <TopNavLayout content={<DispatchEntriesView />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/data-entry-pricing'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<PricingEntriesView />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-create-order'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <TopNavLayout content={<CreateOrderView />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-create-order-alloys'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7, 999]}>
            <TopNavLayout content={<CreateOrderAlloys />} />
          </PrivateRoute>
        }
      />

      {/* User Production Steps Management */}
      <Route
        path='/user-production-steps'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<UserProductionSteps />} />
          </PrivateRoute>
        }
      />

      {/* Equipment Management */}
      <Route
        path='/equipment-management'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<EquipmentManagement />} />
          </PrivateRoute>
        }
      />

      {/* Step-Position Mapping */}
      <Route
        path='/step-position-mapping'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<StepPositionMapping />} />
          </PrivateRoute>
        }
      />

      {/* Price List Management Route */}
      <Route
        path='/price-lists'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<PriceListPage />} />
          </PrivateRoute>
        }
      />

      {/* Edit Price List Route */}
      <Route
        path='/price-lists/edit/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 999]}>
            <TopNavLayout content={<EditPriceListPage />} />
          </PrivateRoute>
        }
      />

      {/* Cost Management Routes */}
      <Route
        path='/cost-categories'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<CostCategoriesPage />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/monthly-overheads'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<MonthlyOverheadsPage />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/profit-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<ProfitDashboardPage />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/pnl-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<PLDashboardPage />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/ceo-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<CEODashboard />} />
          </PrivateRoute>
        }
      />

      {/* Mold Management Routes */}
      <Route
        path='/mold-management'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<MoldManagementDashboard />} />
          </PrivateRoute>
        }
      />

      {/* Temp Costing View - Restricted to userId 4 only */}
      <Route
        path='/temp-costing'
        element={
          <PrivateRoute allowedRoles={[4, 5, 999]}>
            <TopNavLayout content={<TempCostingView />} />
          </PrivateRoute>
        }
      />

      {/* ============================================================ */}
      {/* PURCHASE SYSTEM V2 ROUTES                                    */}
      {/* ============================================================ */}

      {/* Submit Purchase Requisition — any logged-in user */}
      <Route
        path='/purchase/requisitions/create'
        element={
          <PrivateRoute allowedRoles={[1, 3, 5, 6, 7, 8, 9, 10, 999]}>
            <TopNavLayout content={<CreateRequisition />} />
          </PrivateRoute>
        }
      />

      {/* Purchase Requisitions */}
      <Route
        path='/purchase/requisitions'
        element={
          <PrivateRoute allowedRoles={[9, 5, 999]}>
            <TopNavLayout content={<RequisitionList />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase/requisitions/:id'
        element={
          <PrivateRoute allowedRoles={[9, 5, 999]}>
            <TopNavLayout content={<RequisitionDetails />} />
          </PrivateRoute>
        }
      />

      {/* Purchase Indents */}
      <Route
        path='/purchase/indents'
        element={
          <PrivateRoute allowedRoles={[8, 9, 10, 5, 999]}>
            <TopNavLayout content={<IndentList />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase/indents/create'
        element={
          <PrivateRoute allowedRoles={[8, 5, 999]}>
            <TopNavLayout content={<CreateIndent />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase/indents/:id'
        element={
          <PrivateRoute allowedRoles={[8, 9, 10, 5, 999]}>
            <TopNavLayout content={<IndentDetails />} />
          </PrivateRoute>
        }
      />

      {/* Items Master */}
      <Route
        path='/purchase/items'
        element={
          <PrivateRoute allowedRoles={[9, 10, 5, 999]}>
            <TopNavLayout content={<ItemsMaster />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase/item-categories'
        element={
          <PrivateRoute allowedRoles={[9, 5, 999]}>
            <TopNavLayout content={<ItemCategories />} />
          </PrivateRoute>
        }
      />

      {/* Purchase Orders */}
      <Route
        path='/purchase/po'
        element={
          <PrivateRoute allowedRoles={[8, 9, 10, 5, 999]}>
            <TopNavLayout content={<POList />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase/po/create'
        element={
          <PrivateRoute allowedRoles={[10, 5, 999]}>
            <TopNavLayout content={<CreatePO />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase/po/:id'
        element={
          <PrivateRoute allowedRoles={[8, 9, 10, 5, 999]}>
            <TopNavLayout content={<PODetails />} />
          </PrivateRoute>
        }
      />

      {/* GRN */}
      <Route
        path='/purchase/grn'
        element={
          <PrivateRoute allowedRoles={[8, 9, 10, 5, 999]}>
            <TopNavLayout content={<GRNList />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase/grn/create'
        element={
          <PrivateRoute allowedRoles={[8, 5, 999]}>
            <TopNavLayout content={<CreateGRN />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase/grn/:id'
        element={
          <PrivateRoute allowedRoles={[8, 9, 10, 5, 999]}>
            <TopNavLayout content={<GRNDetails />} />
          </PrivateRoute>
        }
      />

      {/* ...other routes wrapped with PrivateRoute */}
    </Routes>
  )
}

export default StackNavigation
