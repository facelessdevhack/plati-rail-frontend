# 🔧 **Warranty Registration Edit API - Complete Documentation**

_Comprehensive API documentation for warranty registration CRUD operations_

---

## 🚀 **API Overview**

### **Base URL**: `http://localhost:4000/v2/warranty`

| Endpoint                     | Method | Purpose                            | Response Time |
| ---------------------------- | ------ | ---------------------------------- | ------------- |
| `/registrations`             | GET    | Get all warranty registrations     | ~200-500ms    |
| `/registrations/:id`         | GET    | Get single warranty registration   | ~100-200ms    |
| `/registrations/:id`         | PUT    | Update warranty registration       | ~200-400ms    |
| `/registrations/:id`         | DELETE | Delete warranty registration       | ~100-300ms    |
| `/registrations/bulk-update` | PUT    | Bulk update multiple registrations | ~1-5s         |

---

## 📋 **1. Get All Warranty Registrations**

### **GET** `/v2/warranty/registrations`

**Purpose**: Retrieve all warranty registrations with optional dealer filtering

#### **Query Parameters**

```typescript
interface GetAllRegistrationsParams {
  dealerId?: number // Optional: Filter by specific dealer
}
```

#### **Request Example**

```javascript
// Get all registrations
const response = await fetch('/v2/warranty/registrations')

// Get registrations for specific dealer
const response = await fetch('/v2/warranty/registrations?dealerId=5')
```

#### **Response Structure**

```typescript
interface GetAllRegistrationsResponse {
  success: boolean
  count: number
  data: WarrantyRegistration[]
  message?: string
}

interface WarrantyRegistration {
  id: number
  product_type: 'Alloy' | 'Tyre'
  register_type: string
  dealer_id: number
  dop: string // Date of purchase
  customer_name: string
  warranty_card_no: string
  mobile_no: string
  otp: string
  otp_date: string
  otp_verified: string
  otp_verified_date: string

  // Product specifications
  inches_id: number
  pcd_id: number
  holes_id: number
  finish_id: number
  alloy_model: number
  no_of_alloys: number
  pattern_id: number
  width_id: number
  profile_id: number
  no_of_tyres: number
  size_id: number

  // Vehicle & Customer Info
  vehicle_no: string
  vehicle_model: string
  email_address: string
  meter_reading: number

  // Images & Documents
  warranty_card_image: string
  invoice_image: string
  vehicle_image: string
  product_specification: string

  // Status & Metadata
  register_status: string
  entered_at: string
  entered_by: number
  entered_date_gmt: string
  amount: number

  // Related Master Data (JOINed)
  dealer_name: string
  inches_name: string
  pcd_name: string
  holes_name: string
  finish_name: string
  alloy_model_name: string
}
```

---

## 🔍 **2. Get Single Warranty Registration**

### **GET** `/v2/warranty/registrations/:id`

**Purpose**: Retrieve detailed information about a specific warranty registration

#### **Path Parameters**

- `id` (required): Registration ID (number)

#### **Request Example**

```javascript
// Get registration with ID 123
const response = await fetch('/v2/warranty/registrations/123')
```

#### **Response Structure**

```typescript
interface GetSingleRegistrationResponse {
  success: boolean
  data: DetailedWarrantyRegistration
}

interface DetailedWarrantyRegistration extends WarrantyRegistration {
  // Additional master table data
  pattern_name: string
  width_name: string
  profile_name: string
  size_name: string // diameter
}
```

#### **Error Responses**

```typescript
// 400 - Invalid ID
{
  success: false,
  message: 'Valid registration ID is required'
}

// 404 - Not Found
{
  success: false,
  message: 'Warranty registration not found'
}
```

---

## ✏️ **3. Update Warranty Registration**

### **PUT** `/v2/warranty/registrations/:id`

**Purpose**: Update an existing warranty registration

#### **Path Parameters**

- `id` (required): Registration ID (number)

#### **Request Body**

```typescript
interface UpdateWarrantyRegistrationRequest {
  // Required Fields
  customer_name: string
  mobile_no: string // Must be 10 digits

  // Optional Common Fields
  email_address?: string // Must be valid email format
  vehicle_no?: string
  vehicle_model?: string
  warranty_card_no?: string
  dop?: string // Date of purchase
  dealer_id?: number
  warranty_card_image?: string
  invoice_image?: string
  vehicle_image?: string
  product_specification?: string
  register_status?: string
  otp_verified?: string
  amount?: number
  meter_reading?: number

  // Alloy-Specific Fields (if product_type = 'Alloy')
  inches_id?: number
  pcd_id?: number
  holes_id?: number
  finish_id?: number
  alloy_model?: number
  no_of_alloys?: number

  // Tyre-Specific Fields (if product_type = 'Tyre')
  pattern_id?: number
  width_id?: number
  profile_id?: number
  size_id?: number
  no_of_tyres?: number
}
```

#### **Request Example**

```javascript
const response = await fetch('/v2/warranty/registrations/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_name: 'Updated Customer Name',
    mobile_no: '9876543210',
    email_address: 'updated@email.com',
    vehicle_no: 'UP16AB1234',
    vehicle_model: 'Honda City 2023',
    warranty_card_no: 'WC123456',
    dealer_id: 5,
    register_status: 'Verified',
    otp_verified: 'Verified',
    amount: 25000,

    // For Alloy products
    inches_id: 4,
    pcd_id: 25,
    holes_id: 6,
    finish_id: 55,
    alloy_model: 1088,
    no_of_alloys: 4,

    // For Tyre products
    pattern_id: 10,
    width_id: 15,
    profile_id: 8,
    size_id: 12,
    no_of_tyres: 4
  })
})
```

#### **Response Structure**

```typescript
interface UpdateWarrantyRegistrationResponse {
  success: boolean
  message: string
  data: DetailedWarrantyRegistration // Updated registration with all related data
}
```

#### **Validation Rules**

- `customer_name`: Required, non-empty string
- `mobile_no`: Required, exactly 10 digits
- `email_address`: Optional, valid email format if provided
- Product-specific fields validated based on existing `product_type`

#### **Error Responses**

```typescript
// 400 - Validation Error
{
  success: false,
  message: 'Customer name is required' | 'Mobile number must be 10 digits' | 'Invalid email format'
}

// 404 - Not Found
{
  success: false,
  message: 'Warranty registration not found'
}
```

---

## 🗑️ **4. Delete Warranty Registration**

### **DELETE** `/v2/warranty/registrations/:id`

**Purpose**: Delete a warranty registration permanently

#### **Path Parameters**

- `id` (required): Registration ID (number)

#### **Request Example**

```javascript
const response = await fetch('/v2/warranty/registrations/123', {
  method: 'DELETE'
})
```

#### **Response Structure**

```typescript
interface DeleteWarrantyRegistrationResponse {
  success: boolean
  message: string
  data: {
    id: number
    customer_name: string
    warranty_card_no: string
    product_type: string
  }
}
```

#### **Success Response Example**

```json
{
  "success": true,
  "message": "Warranty registration deleted successfully",
  "data": {
    "id": 123,
    "customer_name": "John Doe",
    "warranty_card_no": "WC123456",
    "product_type": "Alloy"
  }
}
```

---

## 📦 **5. Bulk Update Warranty Registrations**

### **PUT** `/v2/warranty/registrations/bulk-update`

**Purpose**: Update multiple warranty registrations in a single request

#### **Request Body**

```typescript
interface BulkUpdateRequest {
  registrations: Array<{
    id: number
    // Any fields from UpdateWarrantyRegistrationRequest
    customer_name?: string
    mobile_no?: string
    email_address?: string
    vehicle_no?: string
    // ... other fields
  }>
}
```

#### **Request Example**

```javascript
const response = await fetch('/v2/warranty/registrations/bulk-update', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    registrations: [
      {
        id: 123,
        customer_name: 'Updated Name 1',
        mobile_no: '9876543210',
        register_status: 'Verified'
      },
      {
        id: 124,
        customer_name: 'Updated Name 2',
        email_address: 'new@email.com',
        amount: 30000
      },
      {
        id: 125,
        vehicle_no: 'UP16CD5678',
        otp_verified: 'Verified'
      }
    ]
  })
})
```

#### **Response Structure**

```typescript
interface BulkUpdateResponse {
  success: boolean
  message: string
  data: {
    successful: Array<{
      id: number
      success: boolean
      message: string
    }>
    failed: Array<{
      id: number | 'unknown'
      error: string
    }>
    summary: {
      total: number
      successful: number
      failed: number
    }
  }
}
```

#### **Response Example**

```json
{
  "success": true,
  "message": "Bulk update completed. 2 successful, 1 failed",
  "data": {
    "successful": [
      {
        "id": 123,
        "success": true,
        "message": "Updated successfully"
      },
      {
        "id": 124,
        "success": true,
        "message": "Updated successfully"
      }
    ],
    "failed": [
      {
        "id": 125,
        "error": "Warranty registration not found"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 2,
      "failed": 1
    }
  }
}
```

#### **Limitations**

- Maximum 100 registrations per bulk update request
- Each registration is processed individually
- Partial success is possible (some succeed, some fail)

---

## 🔧 **Frontend Integration Examples**

### **React Hook for Warranty Management**

```typescript
// hooks/useWarrantyManagement.ts
import { useState } from 'react'

interface UseWarrantyManagementProps {
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export const useWarrantyManagement = ({
  onSuccess,
  onError
}: UseWarrantyManagementProps = {}) => {
  const [loading, setLoading] = useState(false)

  const getRegistration = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/v2/warranty/registrations/${id}`)
      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        onError?.(result.message)
        return null
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Network error')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateRegistration = async (id: number, data: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/v2/warranty/registrations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        onSuccess?.(result.message)
        return result.data
      } else {
        onError?.(result.message)
        return null
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Network error')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteRegistration = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/v2/warranty/registrations/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        onSuccess?.(result.message)
        return result.data
      } else {
        onError?.(result.message)
        return null
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Network error')
      return null
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdate = async (registrations: any[]) => {
    setLoading(true)
    try {
      const response = await fetch('/v2/warranty/registrations/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ registrations })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess?.(result.message)
        return result.data
      } else {
        onError?.(result.message)
        return null
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Network error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getRegistration,
    updateRegistration,
    deleteRegistration,
    bulkUpdate
  }
}
```

### **React Component Example**

```typescript
// components/WarrantyEditForm.tsx
import React, { useState, useEffect } from 'react'
import { useWarrantyManagement } from '../hooks/useWarrantyManagement'

interface WarrantyEditFormProps {
  registrationId: number
  onSave?: () => void
  onCancel?: () => void
}

export const WarrantyEditForm: React.FC<WarrantyEditFormProps> = ({
  registrationId,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<any>({})
  const [originalData, setOriginalData] = useState<any>({})

  const { loading, getRegistration, updateRegistration } =
    useWarrantyManagement({
      onSuccess: message => {
        alert(message)
        onSave?.()
      },
      onError: error => {
        alert(`Error: ${error}`)
      }
    })

  useEffect(() => {
    const loadRegistration = async () => {
      const data = await getRegistration(registrationId)
      if (data) {
        setFormData(data)
        setOriginalData(data)
      }
    }

    loadRegistration()
  }, [registrationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Only send changed fields
    const changedFields: any = {}
    Object.keys(formData).forEach(key => {
      if (formData[key] !== originalData[key]) {
        changedFields[key] = formData[key]
      }
    })

    if (Object.keys(changedFields).length === 0) {
      alert('No changes detected')
      return
    }

    await updateRegistration(registrationId, changedFields)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return <div className='animate-pulse'>Loading warranty registration...</div>
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow'
    >
      <h2 className='text-2xl font-bold text-gray-900'>
        Edit Warranty Registration #{registrationId}
      </h2>

      {/* Customer Information */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Customer Name *
          </label>
          <input
            type='text'
            value={formData.customer_name || ''}
            onChange={e => handleChange('customer_name', e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Mobile Number *
          </label>
          <input
            type='tel'
            value={formData.mobile_no || ''}
            onChange={e => handleChange('mobile_no', e.target.value)}
            pattern='[0-9]{10}'
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Email Address
          </label>
          <input
            type='email'
            value={formData.email_address || ''}
            onChange={e => handleChange('email_address', e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Vehicle Number
          </label>
          <input
            type='text'
            value={formData.vehicle_no || ''}
            onChange={e => handleChange('vehicle_no', e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Vehicle Model
          </label>
          <input
            type='text'
            value={formData.vehicle_model || ''}
            onChange={e => handleChange('vehicle_model', e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Warranty Card Number
          </label>
          <input
            type='text'
            value={formData.warranty_card_no || ''}
            onChange={e => handleChange('warranty_card_no', e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          />
        </div>
      </div>

      {/* Status Fields */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Registration Status
          </label>
          <select
            value={formData.register_status || ''}
            onChange={e => handleChange('register_status', e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          >
            <option value=''>Select Status</option>
            <option value='Pending'>Pending</option>
            <option value='Verified'>Verified</option>
            <option value='Rejected'>Rejected</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            OTP Verification
          </label>
          <select
            value={formData.otp_verified || ''}
            onChange={e => handleChange('otp_verified', e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          >
            <option value=''>Select Status</option>
            <option value='Verified'>Verified</option>
            <option value='Pending'>Pending</option>
            <option value='Failed'>Failed</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Amount
          </label>
          <input
            type='number'
            value={formData.amount || ''}
            onChange={e =>
              handleChange('amount', parseFloat(e.target.value) || 0)
            }
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-end space-x-4'>
        <button
          type='button'
          onClick={onCancel}
          className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500'
        >
          Cancel
        </button>
        <button
          type='submit'
          disabled={loading}
          className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
```

---

## 🔒 **Security & Best Practices**

### **Input Validation**

- All user inputs are validated server-side
- Mobile numbers must be exactly 10 digits
- Email addresses are validated with regex
- Required fields are enforced

### **Error Handling**

- Comprehensive error messages for different scenarios
- Proper HTTP status codes (400, 404, 500)
- Graceful handling of database errors

### **Data Integrity**

- Foreign key relationships maintained
- Product-type specific field validation
- Audit trail with update timestamps

### **Performance Considerations**

- Efficient database queries with proper JOINs
- Bulk operations for multiple updates
- Response time optimization

---

## 🧪 **Testing Examples**

### **cURL Commands**

```bash
# Get single registration
curl -X GET "http://localhost:4000/v2/warranty/registrations/123"

# Update registration
curl -X PUT "http://localhost:4000/v2/warranty/registrations/123" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Updated Name",
    "mobile_no": "9876543210",
    "email_address": "updated@email.com"
  }'

# Delete registration
curl -X DELETE "http://localhost:4000/v2/warranty/registrations/123"

# Bulk update
curl -X PUT "http://localhost:4000/v2/warranty/registrations/bulk-update" \
  -H "Content-Type: application/json" \
  -d '{
    "registrations": [
      {
        "id": 123,
        "customer_name": "Bulk Updated Name 1"
      },
      {
        "id": 124,
        "register_status": "Verified"
      }
    ]
  }'
```

---

## 📊 **Database Schema Reference**

### **Main Table**: `product_register`

```sql
-- Key fields for warranty registrations
id (PRIMARY KEY)
product_type ('Alloy' | 'Tyre')
customer_name
mobile_no
email_address
vehicle_no
vehicle_model
warranty_card_no
dop (Date of Purchase)
dealer_id (FOREIGN KEY -> dealers_master.id)
register_status
otp_verified
amount
created_at
updated_at

-- Alloy-specific fields
inches_id (FOREIGN KEY -> inches_master.id)
pcd_id (FOREIGN KEY -> pcd_master.id)
holes_id (FOREIGN KEY -> holes_master.id)
finish_id (FOREIGN KEY -> finish_master.id)
alloy_model (FOREIGN KEY -> model_master.id)
no_of_alloys

-- Tyre-specific fields
pattern_id (FOREIGN KEY -> pattern_master.id)
width_id (FOREIGN KEY -> width_master.id)
profile_id (FOREIGN KEY -> profile_master.id)
size_id (FOREIGN KEY -> diameter_master.id)
no_of_tyres
```

---

This comprehensive API documentation provides everything needed for frontend integration of the warranty registration edit functionality! 🎉
