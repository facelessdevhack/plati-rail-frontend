import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "../../Modules/Authentication/Login";
import InventoryDashboard from "../../Modules/Inventory/InventoryDashboard";
import InventoryInForm from "../../Modules/Inventory/InventoryInForm";
import AdminDashboard from "../../Modules/Admin/dashboard";
import { MissingRoute } from "./MissingRoute";
import AdminLayout from "../../Modules/Layout/adminLayout";
import OrderList from "../../Modules/Orders/OrderList";
import OrderDetails from "../../Modules/Orders/OrdersDetails";
import AlertItemsList from "../../Modules/AlertItems/AlertItemsList";
import AlertItemDetails from "../../Modules/AlertItems/AlertItemsDetails";
import StockList from "../../Modules/Stock/StockList";
import CreateProductionOrder from "../../Modules/Admin/CreateProductionOrder";
import AddStock from "../../Modules/Stock/AddStock";
import EntryDashboard from "../../Modules/DataEntry/EntryDashboard";
import { entrySiderRoutes } from "../../Modules/Layout/Routes/entrySiderRoutes";
import AddModel from "../../Modules/AddModules/AddModel";
import AddPcd from "../../Modules/AddModules/AddPcd";
import AddDailyEntry from "../../Modules/DataEntry/AddDailyEntry";
import DailyEntryAdmin from "../../Modules/DailyEntry";
import AdminDailyEntryDealersPage from "../../Modules/DailyEntry/DailyEntryDealers";
import AdminDealerDetails from "../../Modules/DailyEntry/Dealers/DealersDetails";
import AddPMEntry from "../../Modules/DataEntry/AddPMEntry";

const StackNavigation = () => {
  const { loggedIn, user } = useSelector((state) => state.userDetails);
  useEffect(() => {
    console.log(loggedIn, user, "LOGGED IN AND USER");
  }, []);
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="*" element={<MissingRoute />} />

        {loggedIn ? (
          <>
            {/* Admin Routes */}
            {user.roleId === 5 && (
              <>
                <Route
                  path="admin-dashboard"
                  element={
                    <AdminLayout
                      title={`Welcome, ${user.firstName || ""} ${user.lastName || ""
                        }`}
                      content={<AdminDashboard />}
                    />
                  }
                />
                <Route
                  path="admin-orders"
                  element={
                    <AdminLayout
                      title="Production Order List"
                      content={<OrderList />}
                    />
                  }
                />
                <Route
                  path="admin-order-details/:orderId"
                  loader={({ params }) => {
                    console.log(params.orderId);
                  }}
                  element={<OrderDetails />}
                />
                <Route
                  path="admin-alerts-list"
                  element={
                    <AdminLayout
                      title="Alert Items List"
                      content={<AlertItemsList />}
                    />
                  }
                />
                <Route
                  path="admin-alerts-details"
                  element={<AlertItemDetails />}
                />
                <Route
                  path="admin-stock-list"
                  element={
                    <AdminLayout title="Stock List" content={<StockList />} />
                  }
                />
                <Route
                  path="admin-create-production-order"
                  element={
                    <AdminLayout
                      title="Create Production Order"
                      content={<CreateProductionOrder />}
                    />
                  }
                />
                <Route path="add-stock" element={<AddStock />} />
                <Route path='admin-daily-entry' element={<AdminLayout title="Daily Entry" content={<DailyEntryAdmin />} />} />
                <Route path='admin-daily-entry-dealers' element={<AdminLayout title="Daily Entry Dealers" content={<AdminDailyEntryDealersPage />} />} />
                <Route
                  path="admin-dealers/:id"
                  element={<AdminDealerDetails />}
                />
              </>
            )}

            {/* Data Entry Routes */}
            {user.roleId === 3 && (
              <>
                <Route path="login" element={<Login />} />
                <Route
                  path="entry-dashboard"
                  element={
                    <AdminLayout
                      title={`Welcome, ${user.firstName || ""} ${user.lastName || ""
                        }`}
                      items={entrySiderRoutes}
                      content={<EntryDashboard />}
                    />
                  }
                />
                <Route
                  path="add-stock"
                  element={
                    <AdminLayout
                      title={`Welcome, ${user.firstName || ""} ${user.lastName || ""
                        }`}
                      items={entrySiderRoutes}
                      content={<AddStock />}
                    />
                  }
                />
                {/* Add Model */}
                <Route
                  path="add-model"
                  element={
                    <AdminLayout
                      title={`Welcome, ${user.firstName || ""} ${user.lastName || ""
                        }`}
                      items={entrySiderRoutes}
                      content={<AddModel />}
                    />
                  }
                />
                {/* PCD ROUTE */}
                <Route
                  path="add-pcd"
                  element={
                    <AdminLayout
                      title={`Welcome, ${user.firstName || ""} ${user.lastName || ""
                        }`}
                      items={entrySiderRoutes}
                      content={<AddPcd />}
                    />
                  }
                />
                {/* Add Daily Entry */}
                <Route
                  path="add-daily-entry"
                  element={
                    <AdminLayout
                      title={`Welcome, ${user.firstName || ""} ${user.lastName || ""
                        }`}
                      items={entrySiderRoutes}
                      content={<AddDailyEntry />}
                    />
                  }
                />
                {/* Add Inwards Entry */}
                <Route
                  path="add-inwards-entry"
                  element={
                    <AdminLayout
                      title={`Welcome, ${user.firstName || ""} ${user.lastName || ""
                        }`}
                      items={entrySiderRoutes}
                      content={<AddPMEntry />}
                    />
                  }
                />
              </>
            )}

            {/* Inventory Operator Routes */}
            {user.roleId === 1 && (
              <>
                <Route
                  path="inventory-dashboard"
                  element={<InventoryDashboard />}
                />
                <Route path="add-inventory" element={<InventoryInForm />} />
              </>
            )}
          </>
        ) : (
          <>
            {/* Auth Routes */}
            <Route path="login" element={<Login />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default StackNavigation;
