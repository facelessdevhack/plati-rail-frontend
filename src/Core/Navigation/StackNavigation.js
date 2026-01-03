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
import { CostCategoriesPage, MonthlyOverheadsPage, ProfitDashboardPage } from '../../Modules/CostManagement';
import { StockUploadPage } from '../../Modules/StockUpload';

const StackNavigation = () => {
  const { loggedIn, user } = useSelector(state => state.userDetails)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loggedIn && user) {
      const roleId = Number(user.roleId)

      // Only navigate if the user is on the login page or root
      if (location.pathname === '/login' || location.pathname === '/') {
        if (roleId === 5) {
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
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminLayout
              title='Dealer Performance Metrics'
              items={adminSiderRoutes}
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
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminOrderDashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path='/stock-management'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Stock Management Dashboard'
              items={adminSiderRoutes}
              content={<StockManagementDashboard />}
            />
          </PrivateRoute>
        }
      />
      
      <Route
        path='/bulk-stock-analysis'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <BulkStockAnalysis />
          </PrivateRoute>
        }
      />
      <Route
        path='/admin-dashboard'
        element={
          <PrivateRoute allowedRoles={[5]}>
            <AdminLayout
              title='Admin Sales Dashboard'
              items={adminSiderRoutes}
              content={<AdminSalesDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-coordinator-dashboard'
        element={
          <PrivateRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7]}>
            <AdminLayout
              title='📊 Sales Coordinator Dashboard'
              items={user?.roleId === 3 ? entrySiderRoutes : (user?.roleId === 1 ? dataUserSiderRoutes : (user?.roleId === 7 ? saleCoSidebarRoutes : adminSiderRoutes))}
              content={<SalesCoordinatorDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealer-warranty'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Dealer Warranty Registrations'
              items={adminSiderRoutes}
              content={<DealerWarrantyList />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealer-warranty/edit/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='Edit Warranty Registration'
              items={adminSiderRoutes}
              content={<DealerWarrantyDetail />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/dealers-list'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
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
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <EntryLayout title='Add Dealer' content={<AddDealer />} />
          </PrivateRoute>
        }
      />
      <Route
        path='/edit-dealer'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <EntryLayout title='Edit Dealer' content={<EditDealer />} />
          </PrivateRoute>
        }
      />


      {/* Entry Inventory Management System */}
      <Route
        path='/entry-inventory-system'
        element={
          <PrivateRoute allowedRoles={[3]}>
            <EntryLayout
              title='Inventory Management'
              items={entrySiderRoutes}
              content={<InventoryManagement />}
            />
          </PrivateRoute>
        }
      />

      {/* New Inventory Management System */}
      <Route
        path='/inventory-management-v2'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6]}>
            <AdminLayout
              title='Inventory Management'
              items={user?.roleId === 6 ? dataUserSiderRoutes : (user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes)}
              content={<InventoryManagement />}
            />
          </PrivateRoute>
        }
      />

      {/* Stock Logging System */}
      <Route
        path='/stock-logs'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6]}>
            <AdminLayout
              title='Stock Logs'
              items={user?.roleId === 6 ? dataUserSiderRoutes : (user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes)}
              content={<StockLogViewer />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/stock-reconciliation'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6]}>
            <AdminLayout
              title='Stock Reconciliation'
              items={user?.roleId === 6 ? dataUserSiderRoutes : (user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes)}
              content={<StockReconciliation />}
            />
          </PrivateRoute>
        }
      />

      {/* Inventory System Routes */}
      <Route
        path='/inventory-locations'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6]}>
            <AdminLayout
              title='Inventory Locations'
              items={user?.roleId === 6 ? dataUserSiderRoutes : (user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes)}
              content={<InventoryLocationsPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/inventory-locations/:locationId'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6]}>
            <AdminLayout
              title='Location Details'
              items={user?.roleId === 6 ? dataUserSiderRoutes : (user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes)}
              content={<InventoryLocationDetailsPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/inventory-movements'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6]}>
            <AdminLayout
              title='Inventory Movements'
              items={user?.roleId === 6 ? dataUserSiderRoutes : (user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes)}
              content={<InventoryMovementsPage />}
            />
          </PrivateRoute>
        }
      />

      {/* Production Routes */}
      <Route
        path='/production-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Production Dashboard'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<ProductionDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plans'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Production Plans'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<ProductionListing />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plans-v2'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Production Plans V2'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<ProductionListingV2 />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plans-modern'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <ProductionListingModern />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-plan/:planId'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <ProductionPlanDetailsPage />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-alloys'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Alloy Selection'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<AlloySelection />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-presets'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Preset Management'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<PresetManagement />}
            />
          </PrivateRoute>
        }
      />
       <Route
         path='/rejected-stock'
         element={
           <PrivateRoute allowedRoles={[4, 5, 6]}>
             <AdminLayout
               title='Rejected Stock Management'
               items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
               content={<RejectedStockManagement />}
             />
           </PrivateRoute>
         }
       />
      <Route
        path='/dispatch-to-sales'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Dispatch to Sales - Ready Units'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<DispatchToSales />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/discarded-stock-management'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminLayout
              title='Discarded Stock Management'
              items={adminSiderRoutes}
              content={<DiscardedStockManagement />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/smart-production'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Smart Production Dashboard'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<SmartProductionDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/production-planner-v2'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Production Planner V2'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<ProductionPlannerV2 />}
            />
          </PrivateRoute>
        }
      />
          <Route
        path='/job-cards'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 6]}>
            <AdminLayout
              title='Job Cards'
              items={user?.roleId === 6 ? dataUserSiderRoutes : (user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes)}
              content={<JobCardListing />}
            />
          </PrivateRoute>
        }
      />
          <Route
        path='/inventory-requests'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Inventory Requests'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<InventoryRequests />}
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

      {/* Purchase System Routes */}
      <Route
        path='/purchase-orders'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <AdminLayout
              title='Purchase Orders'
              items={user?.roleId === 6 ? dataUserSiderRoutes : adminSiderRoutes}
              content={<PurchaseDashboard />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/purchase-orders/smart-purchasing'
        element={
          <PrivateRoute allowedRoles={[4, 5, 6]}>
            <SmartPurchasing />
          </PrivateRoute>
        }
      />

      {/* Sales Coordination System Routes */}
      <Route
        path='/sales-pending-entries'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7]}>
            <AdminLayout
              title='⏳ Pending Entries - Sales Coordination'
              items={user?.roleId === 3 ? entrySiderRoutes : (user?.roleId === 7 ? saleCoSidebarRoutes : adminSiderRoutes)}
              content={<PendingEntriesView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-inprod-entries'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7]}>
            <AdminLayout
              title='🔄 In-Production Entries - Sales Coordination'
              items={user?.roleId === 3 ? entrySiderRoutes : (user?.roleId === 7 ? saleCoSidebarRoutes : adminSiderRoutes)}
              content={<InProductionEntriesView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-dispatch-entries'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7]}>
            <AdminLayout
              title='📦 Dispatch Entries - Sales Coordination'
              items={user?.roleId === 3 ? entrySiderRoutes : (user?.roleId === 7 ? saleCoSidebarRoutes : adminSiderRoutes)}
              content={<DispatchEntriesView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/data-entry-pricing'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='💰 Pricing Entries - Data Entry'
              items={user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes}
              content={<PricingEntriesView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-create-order'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7]}>
            <AdminLayout
              title='📋 Create Order - Sales Coordination'
              items={user?.roleId === 3 ? entrySiderRoutes : (user?.roleId === 7 ? saleCoSidebarRoutes : adminSiderRoutes)}
              content={<CreateOrderView />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/sales-create-order-alloys'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5, 7]}>
            <AdminLayout
              title='🔩 Create Alloys Order - Sales Coordination'
              items={user?.roleId === 3 ? entrySiderRoutes : (user?.roleId === 7 ? saleCoSidebarRoutes : adminSiderRoutes)}
              content={<CreateOrderAlloys />}
            />
          </PrivateRoute>
        }
      />

      {/* User Production Steps Management */}
      <Route
        path='/user-production-steps'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminLayout
              title='👥 User Production Step Assignments'
              items={adminSiderRoutes}
              content={<UserProductionSteps />}
            />
          </PrivateRoute>
        }
      />

      {/* Equipment Management */}
      <Route
        path='/equipment-management'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminLayout
              title='🔧 Equipment Management'
              items={adminSiderRoutes}
              content={<EquipmentManagement />}
            />
          </PrivateRoute>
        }
      />

      {/* Step-Position Mapping */}
      <Route
        path='/step-position-mapping'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminLayout
              title='📍 Step-Position Mapping'
              items={adminSiderRoutes}
              content={<StepPositionMapping />}
            />
          </PrivateRoute>
        }
      />

      {/* Price List Management Route */}
      <Route
        path='/price-lists'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='💰 Price Lists Management'
              items={user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes}
              content={<PriceListPage />}
            />
          </PrivateRoute>
        }
      />

      {/* Edit Price List Route */}
      <Route
        path='/price-lists/edit/:id'
        element={
          <PrivateRoute allowedRoles={[3, 4, 5]}>
            <AdminLayout
              title='⚙️ Edit Price List'
              items={user?.roleId === 3 ? entrySiderRoutes : adminSiderRoutes}
              content={<EditPriceListPage />}
            />
          </PrivateRoute>
        }
      />

      {/* Cost Management Routes */}
      <Route
        path='/cost-categories'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminLayout
              title='Cost Categories'
              items={adminSiderRoutes}
              content={<CostCategoriesPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/monthly-overheads'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminLayout
              title='Monthly Overheads'
              items={adminSiderRoutes}
              content={<MonthlyOverheadsPage />}
            />
          </PrivateRoute>
        }
      />
      <Route
        path='/profit-dashboard'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminLayout
              title='Profit Dashboard'
              items={adminSiderRoutes}
              content={<ProfitDashboardPage />}
            />
          </PrivateRoute>
        }
      />

      {/* Stock Upload Route */}
      <Route
        path='/stock-upload'
        element={
          <PrivateRoute allowedRoles={[4, 5]}>
            <AdminLayout
              title='Stock Excel Upload'
              items={adminSiderRoutes}
              content={<StockUploadPage />}
            />
          </PrivateRoute>
        }
      />

      {/* ...other routes wrapped with PrivateRoute */}
    </Routes>
  )
}

export default StackNavigation
