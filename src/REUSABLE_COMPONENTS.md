# Reusable Components Index

## Core/Components/ — Shared UI Components

| Component | Path | Purpose |
|-----------|------|---------|
| **CustomButton** | `Core/Components/CustomButton.jsx` | Reusable styled button |
| **CustomInput** | `Core/Components/CustomInput.js` | Reusable form input |
| **CustomSelect** | `Core/Components/CustomSelect.js` | Reusable dropdown select |
| **CustomModal** | `Core/Components/CustomModal.jsx` | Reusable modal dialog |
| **CustomKpi** | `Core/Components/CustomKpi.js` | KPI display card |
| **CustomNavButton** | `Core/Components/CustomNavButton.js` | Navigation button |
| **Card** | `Core/Components/Card.jsx` | Reusable card layout |
| **GlobalLoader** | `Core/Components/GlobalLoader.jsx` | App-wide loading spinner |

## Common/Svgs/ — Shared Icon Components (21 icons)

| Category | Icons |
|----------|-------|
| **Navigation** | HomeIcon, ChevronIcon, CloseIcon, PlusIcon |
| **User/Auth** | UserIcon, LockIcon, LogoutIcon, VerifyIcon |
| **Domain** | BatteryIcon, BatteryChargeIcon, TrikeIcon, ParkingIcon |
| **UI** | AlertIcon, NotificationIcon, SettingsIcon, ServiceIcon |
| **Other** | AssemblyStationIcon, KpiBg, LocationIcon, SwapStationIcon, switch |

## Core/Navigation/ — Route Guards

| Component | Path | Purpose |
|-----------|------|---------|
| **ProtectedRoute** | `Core/Navigation/ProtectedRoute.js` | Auth-based route guard |
| **PrivateRoute** | `Core/Navigation/PrivateRoute.js` | Private route wrapper |
| **MissingRoute** | `Core/Navigation/MissingRoute.js` | 404 page |
| **UnauthorizedPage** | `Core/Navigation/UnauthorizedPage.js` | 403 page |

## Components/ — Top-level Shared

| Component | Path | Purpose |
|-----------|------|---------|
| **ProductionNotificationSystem** | `Components/ProductionNotificationSystem.jsx` | Notification system |

## hooks/ — Custom Hooks

| Hook | Path | Purpose |
|------|------|---------|
| **useAdminDashboard** | `hooks/useAdminDashboard.js` | Admin dashboard data hook |

## services/ — API Service Layers

| Service | Path | Purpose |
|---------|------|---------|
| **stockAnalysisApi** | `services/stockAnalysisApi.js` | Stock analysis endpoints |
| **inventoryApi** | `services/inventoryApi.js` | Inventory endpoints |

## Utils/ — Shared Utilities

| Utility | Path | Purpose |
|---------|------|---------|
| **constants.js** | `Utils/constants.js` | App-wide constants |
| **axiosClient.js** | `Utils/axiosClient.js` | Configured Axios instance |
| **renderPaymentStatus.js** | `Utils/renderPaymentStatus.js` | Payment status renderer |
