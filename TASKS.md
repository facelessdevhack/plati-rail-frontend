# Production Tracking Module - Frontend Implementation Tasks

## Overview

Implement a frontend interface for the production tracking system that allows users to plan production, create job cards, track progress through production steps, perform quality assurance, and manage rejected items.

## Core Features

### 1. Production Planning

- [ ] Create a production plan form with:
  - Alloy selection dropdown
  - Conversion alloy selection
  - Quantity input
  - Urgent toggle/checkbox
  - Submit button
- [ ] Production plans listing/table with filtering and sorting
- [ ] Plan details view

### 2. Job Card Management

- [ ] Create job card form linked to production plans
- [ ] Job cards listing with status indicators
- [ ] Job card details view showing:
  - Associated production plan
  - Current production step
  - Quantity information
  - Creation/modification timestamps

### 3. Production Step Tracking

- [ ] Production workflow visualization showing all steps
- [ ] Interface to update job card progress between steps
- [ ] Step transition history
- [ ] Step completion tracking with timestamps

### 4. Quality Assurance

- [ ] QA reporting form with:
  - Accepted quantity input
  - Rejected quantity input
  - Rejection reason dropdown/text field
- [ ] QA history for each job card
- [ ] Interface for later acceptance of previously rejected items
- [ ] QA statistics and metrics display

### 5. Inventory Integration

- [ ] Material request form linked to production plans
- [ ] Request status tracking
- [ ] Material fulfillment confirmation

## API Endpoints to Integrate

### 1. Create Production Plan

- **Endpoint:** `POST /v2/production/add-production-plan`
- **Request Body:**
  ```json
  {
    "alloyId": 123,
    "convertId": 456,
    "quantity": 500,
    "urgent": false,
    "userId": 789
  }
  ```
- **Response:**
  ```json
  {
    "message": "Plan Added Successfully"
  }
  ```
- **Status Codes:**
  - 200: Success
  - 500: Error

### 2. Create Job Card

- **Endpoint:** `POST /v2/production/add-production-job-card`
- **Request Body:**
  ```json
  {
    "prodPlanId": 123,
    "quantity": 500,
    "userId": 789
  }
  ```
- **Response:**
  ```json
  {
    "message": "Production Job Card Added"
  }
  ```
- **Status Codes:**
  - 200: Success
  - 500: Error

### 3. Update Job Card Status

- **Endpoint:** `POST /v2/production/update-production-job-card`
- **Request Body:**
  ```json
  {
    "jobCardId": 123,
    "prodStep": 2
  }
  ```
- **Response:**
  ```json
  {
    "message": "Updated Successfully"
  }
  ```
- **Status Codes:**
  - 200: Success
  - 500: Error

### 4. Submit QA Report

- **Endpoint:** `POST /v2/production/add-qa-production-card-report`
- **Request Body:**
  ```json
  {
    "acceptedQuantity": 450,
    "rejectedQuantity": 50,
    "rejectionReason": "Quality issues",
    "planId": 123,
    "jobCardId": 456,
    "qaId": 789
  }
  ```
- **Response:**
  ```json
  {
    "message": "QA Report Submitted"
  }
  ```
- **Status Codes:**
  - 200: Success
  - 500: Error

### 5. Update QA Report

- **Endpoint:** `POST /v2/production/update-qa-production-card-report`
- **Request Body:**
  ```json
  {
    "jobCardId": 456,
    "laterAcceptanceReason": "Reworked",
    "acceptedQuantity": 25
  }
  ```
- **Response:**
  ```json
  {
    "message": "QA Report Updated"
  }
  ```
- **Status Codes:**
  - 200: Success
  - 500: Error

### 6. Get Production Steps

- **Endpoint:** `GET /v2/production/get-steps`
- **Request Body:** None
- **Response:**
  ```json
  {
    "result": [
      {
        "id": 1,
        "name": "Melting",
        "description": "Melting raw materials",
        "order": 1
      },
      {
        "id": 2,
        "name": "Casting",
        "description": "Casting into molds",
        "order": 2
      }
    ]
  }
  ```
- **Status Codes:**
  - 200: Success
  - 500: Error

### 7. Request Materials from Inventory

- **Endpoint:** `POST /v2/inventory/request`
- **Request Body:**
  ```json
  {
    "prodPlanId": 123,
    "quantity": 500,
    "userId": 789
  }
  ```
- **Response:**
  ```json
  {
    "message": "Inventory Request Successful"
  }
  ```
- **Status Codes:**
  - 200: Success
  - 500: Error

### 8. Update Inventory Request

- **Endpoint:** `POST /v2/inventory/update`
- **Request Body:**
  ```json
  {
    "jobCardId": 123,
    "sentQuantity": 500,
    "isFulfilled": true
  }
  ```
- **Response:**
  ```json
  {
    "message": "Inventory Updated Successfully"
  }
  ```
- **Status Codes:**
  - 200: Success
  - 500: Error

## Data Models

### Production Plan

```typescript
interface ProductionPlan {
  id: number
  alloyId: number
  alloyName?: string // For display
  convertId: number
  convertName?: string // For display
  quantity: number
  urgent: boolean
  createdBy: number
  createdAt: string
  status?: string // Derived from job card status
}
```

### Job Card

```typescript
interface JobCard {
  id: number
  prodPlanId: number
  quantity: number
  prodStep: number
  stepName?: string // For display
  acceptedQuantity?: number
  rejectedQuantity?: number
  rejectionReason?: string
  laterAcceptanceReason?: string
  createdBy: number
  createdAt: string
  updatedAt: string
}
```

### Production Step

```typescript
interface ProductionStep {
  id: number
  name: string
  description?: string
  order: number
}
```

## Page Structure

### 1. Production Dashboard

- [ ] Overview of production status
- [ ] Key metrics (completion rate, rejection rate, etc.)
- [ ] Quick access to create new plans
- [ ] Recent job cards status

### 2. Production Planning

- [ ] Create new production plan form
- [ ] List of existing plans with filtering and search
- [ ] Plan details/edit view

### 3. Job Cards Management

- [ ] Create new job card form
- [ ] List of job cards with filtering by status, date, etc.
- [ ] Job card details view with production step tracking

### 4. Production Workflow

- [ ] Visual workflow view of all job cards
- [ ] Step transition interface
- [ ] Progress indicators

### 5. Quality Assurance

- [ ] Submit QA reports for job cards
- [ ] View QA history
- [ ] Manage rejected items
- [ ] Interface for later acceptance

## User Interactions

- [ ] Drag-and-drop interface for moving job cards between production steps
- [ ] Color-coded status indicators (urgent, delayed, on track, etc.)
- [ ] Notification system for:
  - Step transitions
  - QA failures
  - Urgent production plans
  - Inventory request status

## Technical Requirements

- [ ] Form validation for all inputs
- [ ] Error handling for API requests
- [ ] Data caching for performance
- [ ] Real-time or periodic refresh of data
- [ ] Responsive design for different screen sizes
- [ ] State management for complex flows

## UI Components Needed

- [ ] Production plan card/list item
- [ ] Job card component
- [ ] Step progression indicator
- [ ] QA report form
- [ ] Status badges (urgent, pending, completed, etc.)
- [ ] Quantity tracker (planned vs. produced vs. accepted)
- [ ] Workflow visualization component
- [ ] Filterable data tables

## Additional Considerations

- [ ] User permissions/roles for different actions
- [ ] Data export functionality (CSV/PDF reports)
- [ ] Integration with inventory alerts for material shortages
- [ ] Offline capability for factory floor usage
- [ ] Audit trail of all changes

## Dependencies

- Backend API endpoints as listed above
- Authentication system for user identification
- Access to alloy and conversion data for dropdowns

## Authentication Requirements

- All API endpoints require authentication via JWT token
- Token must be included in requests as an Authorization header:
  ```
  Authorization: Bearer <token>
  ```
- Tokens expire after 24 hours and will need to be refreshed
