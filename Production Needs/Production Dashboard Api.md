# Production Dashboard API Documentation

## Overview

This document outlines the API endpoints required for the Production Dashboard functionality. These APIs are currently missing from the backend and need to be implemented to provide real-time production data instead of mock data.

## Base URL

```
/api/v2/production/
```

## Authentication

All endpoints require valid JWT authentication token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## 1. Dashboard Metrics API

### Endpoint

```http
GET /v2/production/dashboard/metrics
```

### Description

Provides overall production metrics and KPIs for the dashboard overview.

### Parameters

| Parameter   | Type    | Required | Description                              |
| ----------- | ------- | -------- | ---------------------------------------- |
| `startDate` | string  | No       | Start date for metrics (ISO 8601 format) |
| `endDate`   | string  | No       | End date for metrics (ISO 8601 format)   |
| `urgent`    | boolean | No       | Filter for urgent plans only             |

### Query Example

```http
GET /v2/production/dashboard/metrics?startDate=2024-01-01&endDate=2024-01-31&urgent=false
```

### Response Structure

```json
{
  "success": true,
  "result": {
    "totalPlans": 45,
    "activePlans": 12,
    "completedPlans": 28,
    "totalJobCards": 67,
    "activeJobCards": 23,
    "completedJobCards": 38,
    "totalProduced": 15420,
    "totalAccepted": 14890,
    "totalRejected": 530,
    "rejectionRate": 3.4,
    "completionRate": 87.2,
    "avgProductionTime": 4.2,
    "materialUtilization": 94.8,
    "capacityUtilization": 78.5,
    "onTimeDelivery": 92.3
  }
}
```

### Database Queries Required

```sql
-- Total and active plans
SELECT
  COUNT(*) as totalPlans,
  COUNT(CASE WHEN is_completed = 0 THEN 1 END) as activePlans,
  COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completedPlans
FROM prod_plan_master
WHERE created_at BETWEEN ? AND ?;

-- Job card metrics
SELECT
  COUNT(*) as totalJobCards,
  COUNT(CASE WHEN prod_step < 11 THEN 1 END) as activeJobCards,
  COUNT(CASE WHEN prod_step = 11 THEN 1 END) as completedJobCards
FROM prod_job_card_master pjc
JOIN prod_plan_master ppm ON pjc.prod_plan_id = ppm.id
WHERE ppm.created_at BETWEEN ? AND ?;

-- Production quantities and QA metrics
SELECT
  SUM(pjc.quantity) as totalProduced,
  SUM(COALESCE(pjc.accepted_quantity, 0)) as totalAccepted,
  SUM(COALESCE(pjc.rejected_quantity, 0)) as totalRejected
FROM prod_job_card_master pjc
JOIN prod_plan_master ppm ON pjc.prod_plan_id = ppm.id
WHERE ppm.created_at BETWEEN ? AND ?;
```

---

## 2. Recent Job Cards API

### Endpoint

```http
GET /v2/production/job-cards/recent
```

### Description

Retrieves the most recent job cards with their current status and details.

### Parameters

| Parameter | Type    | Required | Description                                                 |
| --------- | ------- | -------- | ----------------------------------------------------------- |
| `limit`   | integer | No       | Number of records to return (default: 10)                   |
| `status`  | string  | No       | Filter by status: 'in-progress', 'completed', 'qa-required' |
| `urgent`  | boolean | No       | Filter for urgent job cards only                            |

### Query Example

```http
GET /v2/production/job-cards/recent?limit=5&status=in-progress&urgent=true
```

### Response Structure

```json
{
  "success": true,
  "result": [
    {
      "id": 1001,
      "prodPlanId": 5,
      "alloyName": "Premium Steel Alloy - 18x8 ET45 5x120",
      "quantity": 100,
      "prodStep": 3,
      "stepName": "MACHINING",
      "status": "in-progress",
      "urgent": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "estimatedCompletion": "2024-01-18T16:00:00Z",
      "qaId": null,
      "acceptedQuantity": 0,
      "rejectedQuantity": 0
    }
  ]
}
```

### Database Query

```sql
SELECT
  pjc.id,
  pjc.prod_plan_id as prodPlanId,
  am.product_name as alloyName,
  pjc.quantity,
  pjc.prod_step as prodStep,
  psm.step_name as stepName,
  CASE
    WHEN pjc.prod_step = 11 THEN 'completed'
    WHEN pjc.prod_step = 10 AND pjc.qa_id IS NOT NULL THEN 'qa-required'
    WHEN pjc.prod_step < 11 THEN 'in-progress'
    ELSE 'pending'
  END as status,
  ppm.urgent,
  pjc.created_at as createdAt,
  DATE_ADD(pjc.created_at, INTERVAL 72 HOUR) as estimatedCompletion,
  pjc.qa_id as qaId,
  pjc.accepted_quantity as acceptedQuantity,
  pjc.rejected_quantity as rejectedQuantity
FROM prod_job_card_master pjc
JOIN prod_plan_master ppm ON pjc.prod_plan_id = ppm.id
JOIN alloy_master am ON ppm.alloy_id = am.id
JOIN prod_steps_master psm ON pjc.prod_step = psm.id
WHERE (? IS NULL OR ppm.urgent = ?)
  AND (? IS NULL OR pjc.prod_step = ?)
ORDER BY pjc.created_at DESC
LIMIT ?;
```

---

## 3. Urgent Production Plans API

### Endpoint

```http
GET /v2/production/production-plans/urgent
```

### Description

Retrieves all production plans marked as urgent that require immediate attention.

### Parameters

| Parameter | Type    | Required | Description                                        |
| --------- | ------- | -------- | -------------------------------------------------- |
| `limit`   | integer | No       | Number of records to return (default: 20)          |
| `status`  | string  | No       | Filter by completion status: 'active', 'completed' |

### Query Example

```http
GET /v2/production/production-plans/urgent?limit=10&status=active
```

### Response Structure

```json
{
  "success": true,
  "result": [
    {
      "id": 5,
      "alloyName": "Premium Steel Alloy - 18x8 ET45 5x120",
      "convertName": "Gloss Black Premium Steel - 18x8 ET45 5x120",
      "quantity": 100,
      "inProductionQuantity": 100,
      "urgent": true,
      "createdAt": "2024-01-15T08:00:00Z",
      "estimatedCompletion": "2024-01-18T16:00:00Z"
    }
  ]
}
```

### Database Query

```sql
SELECT
  ppm.id,
  am1.product_name as alloyName,
  am2.product_name as convertName,
  ppm.quantity,
  ppm.in_production_quantity as inProductionQuantity,
  ppm.urgent,
  ppm.created_at as createdAt,
  DATE_ADD(ppm.created_at, INTERVAL 72 HOUR) as estimatedCompletion
FROM prod_plan_master ppm
JOIN alloy_master am1 ON ppm.alloy_id = am1.id
JOIN alloy_master am2 ON ppm.convert_to_alloy_id = am2.id
WHERE ppm.urgent = 1
  AND (? IS NULL OR ppm.is_completed = ?)
ORDER BY ppm.created_at DESC
LIMIT ?;
```

---

## 4. Recent Rejections API

### Endpoint

```http
GET /v2/production/rejections/recent
```

### Description

Retrieves recent production rejections with details about the rejection reasons and resolution status.

### Parameters

| Parameter  | Type    | Required | Description                               |
| ---------- | ------- | -------- | ----------------------------------------- |
| `limit`    | integer | No       | Number of records to return (default: 10) |
| `resolved` | boolean | No       | Filter by resolution status               |
| `stepId`   | integer | No       | Filter by production step                 |

### Query Example

```http
GET /v2/production/rejections/recent?limit=5&resolved=false&stepId=10
```

### Response Structure

```json
{
  "success": true,
  "result": [
    {
      "id": 1,
      "prodJobCardId": 1001,
      "prodPlanId": 5,
      "rejectedQuantity": 5,
      "rejectionReason": "Surface defects in PVD coating",
      "stepId": 5,
      "stepName": "PVD",
      "isResolved": false,
      "createdAt": "2024-01-15T14:30:00Z",
      "resolvedAt": null,
      "qaPersonnel": "John Smith"
    }
  ]
}
```

### Database Query

```sql
SELECT
  prm.id,
  prm.prod_job_card_id as prodJobCardId,
  prm.prod_plan_id as prodPlanId,
  pjc.rejected_quantity as rejectedQuantity,
  pjc.rejection_reason as rejectionReason,
  pjc.prod_step as stepId,
  psm.step_name as stepName,
  prm.is_resolved as isResolved,
  prm.created_at as createdAt,
  prm.updated_at as resolvedAt,
  u.name as qaPersonnel
FROM prod_rejection_master prm
JOIN prod_job_card_master pjc ON prm.prod_job_card_id = pjc.id
JOIN prod_steps_master psm ON pjc.prod_step = psm.id
LEFT JOIN users u ON pjc.qa_id = u.id
WHERE (? IS NULL OR prm.is_resolved = ?)
  AND (? IS NULL OR pjc.prod_step = ?)
ORDER BY prm.created_at DESC
LIMIT ?;
```

---

## 5. QA Metrics API

### Endpoint

```http
GET /v2/production/qa/metrics
```

### Description

Provides comprehensive Quality Assurance metrics including acceptance rates, rejection reasons, and bottlenecks.

### Parameters

| Parameter       | Type    | Required | Description                              |
| --------------- | ------- | -------- | ---------------------------------------- |
| `startDate`     | string  | No       | Start date for metrics (ISO 8601 format) |
| `endDate`       | string  | No       | End date for metrics (ISO 8601 format)   |
| `qaPersonnelId` | integer | No       | Filter by specific QA personnel          |

### Query Example

```http
GET /v2/production/qa/metrics?startDate=2024-01-01&endDate=2024-01-31
```

### Response Structure

```json
{
  "success": true,
  "result": {
    "totalInspected": 1250,
    "totalAccepted": 1195,
    "totalRejected": 55,
    "acceptanceRate": 95.6,
    "avgInspectionTime": 2.1,
    "qaPersonnelActive": 8,
    "qaPersonnelTotal": 12,
    "topRejectionReasons": [
      {
        "reason": "Surface defects",
        "count": 25,
        "stepId": 5
      }
    ],
    "qaBottlenecks": [
      {
        "stepId": 10,
        "stepName": "QUALITY CHECK",
        "waitingJobs": 11,
        "avgWaitTime": 4.2
      }
    ]
  }
}
```

### Database Queries

```sql
-- QA Summary Metrics
SELECT
  COUNT(*) as totalInspected,
  SUM(COALESCE(accepted_quantity, 0)) as totalAccepted,
  SUM(COALESCE(rejected_quantity, 0)) as totalRejected,
  AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avgInspectionTime
FROM prod_job_card_master
WHERE qa_id IS NOT NULL
  AND created_at BETWEEN ? AND ?;

-- QA Personnel Count
SELECT
  COUNT(DISTINCT qa_id) as qaPersonnelActive,
  (SELECT COUNT(*) FROM users WHERE role_id IN (SELECT id FROM roles WHERE name = 'QA')) as qaPersonnelTotal
FROM prod_job_card_master
WHERE qa_id IS NOT NULL
  AND created_at BETWEEN ? AND ?;

-- Top Rejection Reasons
SELECT
  rejection_reason as reason,
  COUNT(*) as count,
  prod_step as stepId
FROM prod_job_card_master
WHERE rejection_reason IS NOT NULL
  AND created_at BETWEEN ? AND ?
GROUP BY rejection_reason, prod_step
ORDER BY count DESC
LIMIT 10;

-- QA Bottlenecks
SELECT
  pjc.prod_step as stepId,
  psm.step_name as stepName,
  COUNT(*) as waitingJobs,
  AVG(TIMESTAMPDIFF(HOUR, pjc.created_at, NOW())) as avgWaitTime
FROM prod_job_card_master pjc
JOIN prod_steps_master psm ON pjc.prod_step = psm.id
WHERE pjc.prod_step = 10
  AND pjc.qa_id IS NULL
GROUP BY pjc.prod_step, psm.step_name
HAVING waitingJobs > 5;
```

---

## 6. Material Requests Status API

### Endpoint

```http
GET /v2/production/material-requests/status
```

### Description

Provides status of material requests from inventory for production plans.

### Parameters

| Parameter    | Type    | Required | Description                                                    |
| ------------ | ------- | -------- | -------------------------------------------------------------- |
| `status`     | string  | No       | Filter by status: 'pending', 'partial', 'fulfilled', 'delayed' |
| `prodPlanId` | integer | No       | Filter by specific production plan                             |
| `limit`      | integer | No       | Number of records to return (default: 20)                      |

### Query Example

```http
GET /v2/production/material-requests/status?status=pending&limit=10
```

### Response Structure

```json
{
  "success": true,
  "result": [
    {
      "id": 1,
      "prodPlanId": 1001,
      "alloyName": "Premium Steel Alloy - 18x8 ET45 5x120",
      "requestedQuantity": 1000,
      "sentQuantity": 950,
      "isFulfilled": false,
      "status": "partial",
      "createdAt": "2024-01-15T10:30:00Z",
      "estimatedFulfillment": "2024-01-16T14:00:00Z",
      "fulfilledAt": null
    }
  ]
}
```

### Database Query

```sql
SELECT
  ijc.id,
  ijc.prod_plan_id as prodPlanId,
  am.product_name as alloyName,
  ijc.requested_quantity as requestedQuantity,
  COALESCE(ijc.sent_quantity, 0) as sentQuantity,
  ijc.is_fulfilled as isFulfilled,
  CASE
    WHEN ijc.is_fulfilled = 1 THEN 'fulfilled'
    WHEN ijc.sent_quantity > 0 AND ijc.sent_quantity < ijc.requested_quantity THEN 'partial'
    WHEN TIMESTAMPDIFF(HOUR, ijc.created_at, NOW()) > 24 THEN 'delayed'
    ELSE 'pending'
  END as status,
  ijc.created_at as createdAt,
  DATE_ADD(ijc.created_at, INTERVAL 24 HOUR) as estimatedFulfillment,
  ijc.updated_at as fulfilledAt
FROM inventory_job_card_master ijc
JOIN prod_plan_master ppm ON ijc.prod_plan_id = ppm.id
JOIN alloy_master am ON ppm.alloy_id = am.id
WHERE (? IS NULL OR ijc.prod_plan_id = ?)
ORDER BY ijc.created_at DESC
LIMIT ?;
```

---

## 7. Step Performance Analytics API

### Endpoint

```http
GET /v2/production/analytics/step-performance
```

### Description

Provides detailed analytics about each production step including bottlenecks, throughput, and completion metrics.

### Parameters

| Parameter   | Type    | Required | Description                                |
| ----------- | ------- | -------- | ------------------------------------------ |
| `startDate` | string  | No       | Start date for analytics (ISO 8601 format) |
| `endDate`   | string  | No       | End date for analytics (ISO 8601 format)   |
| `stepId`    | integer | No       | Filter by specific step                    |

### Query Example

```http
GET /v2/production/analytics/step-performance?startDate=2024-01-01&endDate=2024-01-31
```

### Response Structure

```json
{
  "success": true,
  "result": {
    "bottlenecks": [
      {
        "stepId": 10,
        "stepName": "QUALITY CHECK",
        "avgWaitTime": 4.2,
        "efficiency": 88
      }
    ],
    "throughput": {
      "daily": 145,
      "weekly": 987,
      "monthly": 4234
    },
    "stepCompletion": [
      {
        "stepId": 1,
        "completed": 234,
        "inProgress": 5,
        "avgTime": 0.5
      }
    ]
  }
}
```

### Database Queries

```sql
-- Step Bottlenecks
SELECT
  pjc.prod_step as stepId,
  psm.step_name as stepName,
  AVG(TIMESTAMPDIFF(HOUR, pjc.created_at, pjc.updated_at)) as avgWaitTime,
  (COUNT(CASE WHEN pjc.prod_step = 11 THEN 1 END) * 100.0 / COUNT(*)) as efficiency
FROM prod_job_card_master pjc
JOIN prod_steps_master psm ON pjc.prod_step = psm.id
WHERE pjc.created_at BETWEEN ? AND ?
GROUP BY pjc.prod_step, psm.step_name
HAVING avgWaitTime > 2.0
ORDER BY avgWaitTime DESC;

-- Throughput Metrics
SELECT
  COUNT(CASE WHEN DATE(updated_at) = CURDATE() THEN 1 END) as daily,
  COUNT(CASE WHEN WEEK(updated_at) = WEEK(NOW()) THEN 1 END) as weekly,
  COUNT(CASE WHEN MONTH(updated_at) = MONTH(NOW()) THEN 1 END) as monthly
FROM prod_job_card_master
WHERE prod_step = 11;

-- Step Completion Status
SELECT
  psm.id as stepId,
  COUNT(CASE WHEN pjc.prod_step = psm.id AND pjc.prod_step = 11 THEN 1 END) as completed,
  COUNT(CASE WHEN pjc.prod_step = psm.id AND pjc.prod_step < 11 THEN 1 END) as inProgress,
  AVG(TIMESTAMPDIFF(HOUR, pjc.created_at, pjc.updated_at)) as avgTime
FROM prod_steps_master psm
LEFT JOIN prod_job_card_master pjc ON psm.id = pjc.prod_step
WHERE pjc.created_at BETWEEN ? AND ?
GROUP BY psm.id
ORDER BY psm.id;
```

---

## 8. Real-Time Status API

### Endpoint

```http
GET /v2/production/real-time/status
```

### Description

Provides real-time production status including active stations, current shift, and alerts.

### Parameters

None required - this endpoint provides current real-time data.

### Query Example

```http
GET /v2/production/real-time/status
```

### Response Structure

```json
{
  "success": true,
  "result": {
    "activeStations": 28,
    "totalStations": 32,
    "currentShift": "Day Shift",
    "shiftProgress": 65,
    "alertsCount": 3,
    "criticalIssues": 1,
    "lastUpdated": "2024-01-15T14:30:00Z"
  }
}
```

### Database Queries

```sql
-- Active Stations (based on active job cards)
SELECT
  COUNT(DISTINCT pjc.prod_step) as activeStations,
  11 as totalStations
FROM prod_job_card_master pjc
WHERE pjc.prod_step < 11;

-- Current Shift Progress
SELECT
  CASE
    WHEN HOUR(NOW()) BETWEEN 6 AND 14 THEN 'Day Shift'
    WHEN HOUR(NOW()) BETWEEN 14 AND 22 THEN 'Evening Shift'
    ELSE 'Night Shift'
  END as currentShift,
  CASE
    WHEN HOUR(NOW()) BETWEEN 6 AND 14 THEN ((HOUR(NOW()) - 6) * 100 / 8)
    WHEN HOUR(NOW()) BETWEEN 14 AND 22 THEN ((HOUR(NOW()) - 14) * 100 / 8)
    ELSE ((HOUR(NOW()) + 24 - 22) * 100 / 8)
  END as shiftProgress;

-- Alerts and Issues
SELECT
  COUNT(CASE WHEN pjc.rejected_quantity > 0 AND prm.is_resolved = 0 THEN 1 END) as alertsCount,
  COUNT(CASE WHEN ppm.urgent = 1 AND ppm.is_completed = 0 THEN 1 END) as criticalIssues
FROM prod_job_card_master pjc
LEFT JOIN prod_rejection_master prm ON pjc.id = prm.prod_job_card_id
LEFT JOIN prod_plan_master ppm ON pjc.prod_plan_id = ppm.id;
```

---

## 9. Capacity Metrics API

### Endpoint

```http
GET /v2/production/capacity/metrics
```

### Description

Provides capacity utilization metrics, trends, and recommendations for production optimization.

### Parameters

| Parameter | Type    | Required | Description                                                   |
| --------- | ------- | -------- | ------------------------------------------------------------- |
| `period`  | string  | No       | Time period: 'daily', 'weekly', 'monthly' (default: 'weekly') |
| `stepId`  | integer | No       | Filter by specific production step                            |

### Query Example

```http
GET /v2/production/capacity/metrics?period=weekly
```

### Response Structure

```json
{
  "success": true,
  "result": {
    "currentCapacity": 78.5,
    "plannedCapacity": 85.0,
    "maxCapacity": 100.0,
    "utilizationTrend": [72, 75, 78, 82, 79, 78, 81],
    "bottleneckSteps": [3, 4, 10],
    "recommendedActions": [
      "Add additional QA personnel for Step 10",
      "Optimize PVD coating schedule",
      "Consider parallel machining setup"
    ]
  }
}
```

### Database Queries

```sql
-- Current Capacity Utilization
SELECT
  (COUNT(CASE WHEN pjc.prod_step < 11 THEN 1 END) * 100.0 /
   (SELECT COUNT(*) FROM prod_steps_master) * 10) as currentCapacity,
  85.0 as plannedCapacity,
  100.0 as maxCapacity
FROM prod_job_card_master pjc;

-- Utilization Trend (last 7 days)
SELECT
  DATE(pjc.created_at) as date,
  COUNT(*) as jobsCreated
FROM prod_job_card_master pjc
WHERE pjc.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(pjc.created_at)
ORDER BY date;

-- Bottleneck Steps
SELECT
  pjc.prod_step as stepId
FROM prod_job_card_master pjc
WHERE pjc.prod_step < 11
GROUP BY pjc.prod_step
HAVING COUNT(*) > 5
ORDER BY COUNT(*) DESC;
```

---

## Implementation Notes

### Error Handling

All APIs should return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details if available"
  }
}
```

### Performance Considerations

1. **Indexing**: Ensure proper database indexes on frequently queried columns:

   - `prod_plan_master.created_at`
   - `prod_job_card_master.prod_step`
   - `prod_job_card_master.prod_plan_id`
   - `inventory_job_card_master.prod_plan_id`

2. **Caching**: Consider implementing Redis caching for frequently accessed metrics

3. **Pagination**: Implement pagination for endpoints that return large datasets

### Security

1. **Role-based Access**: Ensure proper role-based access control
2. **Rate Limiting**: Implement rate limiting to prevent API abuse
3. **Input Validation**: Validate all input parameters

### Testing

Each API endpoint should have comprehensive unit tests covering:

- Valid parameter combinations
- Invalid parameter handling
- Database error scenarios
- Performance under load

---

## Database Schema Dependencies

These APIs depend on the following database tables:

- `prod_plan_master`
- `prod_job_card_master`
- `prod_steps_master`
- `prod_rejection_master`
- `inventory_job_card_master`
- `alloy_master`
- `users`
- `roles`

Ensure all foreign key relationships and constraints are properly defined before implementing these APIs.
