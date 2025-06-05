# Plati India ERP System - Technical Documentation

## System Architecture Overview

### Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL (Railway hosted)
- **ORM**: Knex.js
- **Authentication**: Clerk + JWT
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **Security**: Helmet, XSS-Clean, CORS
- **Logging**: Winston, Morgan

### Project Structure

```
plati-backend/
├── app.js                 # Main application setup
├── server.js             # Server entry point
├── config/               # Configuration files
│   ├── knex.js          # Database configuration
│   ├── config.js        # Environment configuration
│   └── morgan.js        # Logging configuration
├── routes/              # API route definitions
│   ├── v1/             # Version 1 routes (legacy)
│   └── v2/             # Version 2 routes (current)
├── controllers/         # Business logic controllers
│   ├── v1/             # Version 1 controllers
│   └── v2/             # Version 2 controllers
├── middlewares/         # Custom middleware
├── utils/              # Utility functions
└── temp/               # Temporary file storage
```

---

## Database Schema

### Core Tables Overview

#### 1. User Management Tables

```sql
-- Users table for internal users
users (
  id INT PRIMARY KEY,
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role_id INT,
  created_at DATETIME,
  updated_at DATETIME
)

-- Dealers table for external dealers
dealers_master (
  id INT PRIMARY KEY,
  dealer_name VARCHAR(255),
  email VARCHAR(255),
  password_hash VARCHAR(255),
  role_id INT,
  current_bal DECIMAL(15,2),
  opening_bal DECIMAL(15,2),
  unchecked_count INT DEFAULT 0,
  dealer_type INT,
  created_at DATETIME,
  updated_at DATETIME
)
```

#### 2. Product Management Tables

```sql
-- Main alloy products table
alloy_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  model_id INT NOT NULL,
  cb_id INT NOT NULL,
  diameter_id INT,
  finish_id INT NOT NULL,
  holes_id INT NOT NULL,
  inches_id INT NOT NULL,
  offset_id INT NOT NULL,
  pcd_id INT NOT NULL,
  width_id INT NOT NULL,
  in_house_stock BIGINT DEFAULT 0,
  showroom_stock BIGINT DEFAULT 0,
  product_name VARCHAR(255) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  unique_id VARCHAR(200),
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

-- Product specification tables
model_master (id, model_name, brand_id, ...)
finish_master (id, finish, finish_sorting_no, ...)
holes_master (id, holes, ...)
inches_master (id, inches, ...)
pcd_master (id, pcd, ...)
width_master (id, width, ...)
```

#### 3. Production Management Tables

```sql
-- Production planning
prod_plan_master (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  alloy_id INT NOT NULL,
  convert_to_alloy_id INT NOT NULL,
  quantity BIGINT NOT NULL,
  in_production_quantity BIGINT NOT NULL,
  urgent TINYINT DEFAULT 0,
  note VARCHAR(255),
  is_completed TINYINT DEFAULT 0,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)

-- Job card management
prod_job_card_master (
  id INT PRIMARY KEY,
  prod_plan_id BIGINT NOT NULL,
  quantity BIGINT NOT NULL,
  prod_step INT NOT NULL,
  created_by INT NOT NULL,
  qa_id INT,
  accepted_quantity BIGINT,
  rejected_quantity BIGINT,
  rejection_reason TEXT,
  later_acceptance_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)

-- Production steps definition
prod_steps_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  step_name VARCHAR(150) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)

-- Rejection tracking
prod_rejection_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prod_plan_id BIGINT NOT NULL,
  prod_job_card_id INT NOT NULL,
  is_resolved TINYINT DEFAULT 0,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)

-- Material requests
inventory_job_card_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prod_plan_id BIGINT NOT NULL,
  requested_quantity BIGINT NOT NULL,
  sent_quantity BIGINT,
  is_fulfilled TINYINT DEFAULT 0,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

#### 4. Sales & Financial Tables

```sql
-- Sales entries
entry_master (
  entry_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  product_name VARCHAR(255),
  product_type VARCHAR(100),
  dealer_id INT NOT NULL,
  dealer_name VARCHAR(255),
  quantity INT,
  price DECIMAL(15,2),
  total_price DECIMAL(15,2),
  is_claim TINYINT DEFAULT 0,
  transportation_charges DECIMAL(10,2) DEFAULT 0,
  is_transport TINYINT DEFAULT 0,
  is_bus TINYINT DEFAULT 0,
  is_repair TINYINT DEFAULT 0,
  payment_status INT DEFAULT 1, -- 1=Unpaid, 2=Partial, 3=Paid, 4=Overdue
  payment_date DATETIME,
  pending_payment DECIMAL(15,2) DEFAULT 0,
  current_bal DECIMAL(15,2),
  is_checked TINYINT DEFAULT 0,
  date DATE,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)

-- Purchase entries (inwards)
inwards_purchase_master (
  inwards_entry_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  product_name VARCHAR(255),
  dealer_id INT NOT NULL,
  dealer_name VARCHAR(255),
  quantity INT,
  price DECIMAL(15,2),
  transportation_charges DECIMAL(10,2) DEFAULT 0,
  current_bal DECIMAL(15,2),
  is_checked TINYINT DEFAULT 0,
  date DATE,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)

-- Payment entries
pm_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealer_id INT NOT NULL,
  dealer_name VARCHAR(255),
  description TEXT,
  amount DECIMAL(15,2),
  is_paid TINYINT DEFAULT 0,
  payment_method VARCHAR(100),
  payment_date DATE,
  current_bal DECIMAL(15,2),
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)

-- Additional charges
charges_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealer_id INT NOT NULL,
  entry_id INT,
  amount DECIMAL(15,2),
  description VARCHAR(255),
  payment_date DATE,
  current_bal DECIMAL(15,2),
  is_checked TINYINT DEFAULT 0,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)

-- Order management
order_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealer_id INT NOT NULL,
  dealer_name VARCHAR(255),
  order_date DATE,
  payment_status INT,
  payment_date DATE,
  total_amount DECIMAL(15,2),
  paid_amount DECIMAL(15,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)
```

---

## API Endpoints Documentation

### Base URL: `/api/v2`

### 1. Authentication Endpoints

#### POST `/auth/login`

**Purpose**: User login for internal users

```javascript
// Request Body
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "token": "jwt_token_here",
  "userId": 1,
  "roleId": 5,
  "message": "Successfully logged in"
}
```

#### POST `/auth/dealer-login`

**Purpose**: Dealer login for external dealers

```javascript
// Request Body
{
  "email": "dealer@example.com",
  "password": "password123"
}

// Response
{
  "email": "dealer@example.com",
  "firstName": "Dealer",
  "token": "jwt_token_here",
  "userId": 1,
  "roleId": 2,
  "message": "Successfully logged in"
}
```

#### POST `/auth/seed-user`

**Purpose**: Create new internal user

```javascript
// Request Body
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "userRole": "admin" // or "user"
}
```

### 2. Production Management Endpoints

#### GET `/production/get-steps`

**Purpose**: Get all production steps
**Authentication**: Required (Clerk)

```javascript
// Response
;[
  { id: 1, stepName: 'REQUESTED FROM INVENTORY' },
  { id: 2, stepName: 'PAINTING' },
  { id: 3, stepName: 'MACHINING' }
  // ... 11 total steps
]
```

#### POST `/production/add-production-plan`

**Purpose**: Create new production plan

```javascript
// Request Body
{
  "alloyId": 1,
  "convertId": 2,
  "quantity": 100,
  "urgent": 0, // 0=normal, 1=urgent
  "note": "Optional note",
  "userId": 1
}

// Database Operation
INSERT INTO prod_plan_master (
  alloy_id, convert_to_alloy_id, quantity,
  in_production_quantity, urgent, note, created_by
) VALUES (1, 2, 100, 0, 0, 'Optional note', 1);
```

#### POST `/production/add-production-job-card`

**Purpose**: Create job card for production plan

```javascript
// Request Body
{
  "prodPlanId": 1,
  "quantity": 50,
  "userId": 1
}

// Database Operation
INSERT INTO prod_job_card_master (
  prod_plan_id, quantity, prod_step, created_by
) VALUES (1, 50, 1, 1);
```

#### POST `/production/update-production-job-card`

**Purpose**: Update job card production step

```javascript
// Request Body
{
  "jobCardId": 1,
  "prodStep": 2 // Move to next step
}

// Database Operation
UPDATE prod_job_card_master
SET prod_step = 2, updated_at = NOW()
WHERE id = 1;
```

#### POST `/production/add-qa-production-card-report`

**Purpose**: Add QA results to job card

```javascript
// Request Body
{
  "jobCardId": 1,
  "qaId": 2,
  "acceptedQuantity": 45,
  "rejectedQuantity": 5,
  "rejectionReason": "Surface defects"
}

// Database Operations
UPDATE prod_job_card_master
SET qa_id = 2, accepted_quantity = 45, rejected_quantity = 5,
    rejection_reason = 'Surface defects', updated_at = NOW()
WHERE id = 1;

-- If rejected items exist
INSERT INTO prod_rejection_master (
  prod_plan_id, prod_job_card_id, created_by
) VALUES (1, 1, 2);
```

### 3. Sales & Entry Management Endpoints

#### POST `/entries/add-entry`

**Purpose**: Create sales entry

```javascript
// Request Body
{
  "dealerId": 1,
  "dealerName": "ABC Dealers",
  "productId": 1,
  "productName": "Alloy Wheel 15x6",
  "productType": "Alloy",
  "quantity": 4,
  "price": 5000,
  "isClaim": 0,
  "transportationType": 1, // 1=transport, 2=bus
  "transportationCharges": 500,
  "date": "2024-01-15",
  "isRepair": 0
}

// Database Transaction
BEGIN TRANSACTION;

-- Insert entry
INSERT INTO entry_master (
  product_id, product_name, product_type, dealer_id, dealer_name,
  quantity, price, is_claim, transportation_charges,
  is_transport, is_bus, is_repair, total_price,
  created_by, date, current_bal
) VALUES (...);

-- Update dealer balance
UPDATE dealers_master
SET unchecked_count = unchecked_count + 1,
    current_bal = current_bal - (price + transportation_charges)
WHERE id = dealerId;

COMMIT;
```

#### GET `/entries/get-entries`

**Purpose**: Get all entries with pagination and filtering

```javascript
// Query Parameters
?dealerId=1&page=1&limit=10&startDate=2024-01-01&endDate=2024-01-31&sortOrder=desc

// Response
{
  "totalCount": 150,
  "currentPage": 1,
  "totalPages": 15,
  "data": [
    {
      "entryId": 1,
      "date": "2024-01-15",
      "price": 5000,
      "dealerId": 1,
      "productName": "Alloy Wheel 15x6",
      "quantity": 4,
      "paymentStatus": 1,
      "currentBal": 45000,
      "source": "Sale",
      "sourceType": 1
    }
    // ... more entries
  ]
}
```

#### PUT `/entries/edit-entry`

**Purpose**: Edit existing entry

```javascript
// Request Body
{
  "id": 1,
  "sourceType": 1, // 1=entry_master, 2=pm_master, 3=inwards_purchase_master, 4=charges_master
  "price": 5500, // Updated price
  "quantity": 5   // Updated quantity
}

// Database Transaction
BEGIN TRANSACTION;

-- Update entry
UPDATE entry_master
SET price = 5500, quantity = 5, total_price = 5500, updated_at = NOW()
WHERE entry_id = 1;

-- Recalculate dealer balance
-- (Complex balance recalculation logic)

COMMIT;
```

#### POST `/entries/create-pm-entry`

**Purpose**: Create payment entry

```javascript
// Request Body
{
  "dealerId": 1,
  "dealerName": "ABC Dealers",
  "description": "Payment received",
  "amount": 10000,
  "isPaid": 1,
  "paymentMethod": "Cash",
  "payment_date": "2024-01-15"
}

// Database Transaction
BEGIN TRANSACTION;

-- Insert payment
INSERT INTO pm_master (
  dealer_id, dealer_name, description, amount,
  is_paid, payment_method, payment_date, current_bal, created_by
) VALUES (...);

-- Update entry payment statuses
-- (Complex payment allocation logic)

COMMIT;
```

### 4. Inventory Management Endpoints

#### GET `/inventory/`

**Purpose**: Get all inventory items

```javascript
// Response
;[
  {
    id: 1,
    productName: 'Alloy Wheel 15x6',
    inHouseStock: 100,
    showroomStock: 25,
    modelName: 'Model A'
  }
  // ... more items
]
```

#### POST `/inventory/add-inventory`

**Purpose**: Add inventory item

```javascript
// Request Body
{
  "alloyId": 1,
  "quantity": 50,
  "location": "warehouse"
}
```

### 5. Alloy Management Endpoints

#### GET `/alloys/`

**Purpose**: Get all alloy models with specifications

```javascript
// Response
;[
  {
    id: 1,
    productName: 'Model A 15x6/5x114.3 x 4 Chrome',
    modelName: 'Model A',
    inHouseStock: 100,
    showroomStock: 25,
    specifications: {
      inches: '15',
      width: '6',
      pcd: '5x114.3',
      holes: '4',
      finish: 'Chrome'
    }
  }
]
```

#### GET `/alloys/sizes`, `/alloys/pcds`, `/alloys/finishes`, etc.

**Purpose**: Get specification options for alloy configuration

#### POST `/alloys/create-alloy`

**Purpose**: Create new alloy product

```javascript
// Request Body
{
  "modelId": 1,
  "cbId": 1,
  "finishId": 1,
  "holesId": 1,
  "inchesId": 1,
  "offsetId": 1,
  "pcdId": 1,
  "widthId": 1,
  "stock": 100,
  "showroomStock": 25
}

// Database Operation
INSERT INTO alloy_master (
  model_id, cb_id, finish_id, holes_id, inches_id,
  offset_id, pcd_id, width_id, in_house_stock, showroom_stock,
  product_name, model_name
) VALUES (...);
```

### 6. Dashboard & Reporting Endpoints

#### GET `/dashboard/get-dealer-quantity`

**Purpose**: Get dealer quantity analytics

```javascript
// Query Parameters
?dealerId=1&startDate=2024-01-01&endDate=2024-01-31

// Response
[
  {
    "productName": "Model A 15x6",
    "totalQuantity": 50,
    "modelName": "Model A"
  }
]
```

#### GET `/dashboard/get-dealer-quantity-by-sizes`

**Purpose**: Get dealer quantity by product sizes

### 7. Export & Reporting Endpoints

#### POST `/export/combined-pdf`

**Purpose**: Generate combined PDF report

```javascript
// Request Body
{
  "dealerId": 1,
  "dealerName": "ABC Dealers",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "sortOrder": "desc"
}

// Response: PDF file download
```

---

## Business Logic Flows

### 1. Production Flow

```javascript
// 1. Create Production Plan
POST /production/add-production-plan
→ Insert into prod_plan_master
→ Auto-create material request in inventory_job_card_master

// 2. Create Job Card
POST /production/add-production-job-card
→ Insert into prod_job_card_master with prod_step = 1

// 3. Progress Through Steps (11 times)
POST /production/update-production-job-card
→ Update prod_step in prod_job_card_master

// 4. Quality Assurance
POST /production/add-qa-production-card-report
→ Update QA results in prod_job_card_master
→ If rejected, insert into prod_rejection_master

// 5. Complete Production
→ Update inventory levels
→ Mark production plan as completed
```

### 2. Sales Flow

```javascript
// 1. Create Sales Entry
POST /entries/add-entry
→ Insert into entry_master
→ Update dealer balance in dealers_master
→ Update unchecked_count

// 2. Process Payment
POST /entries/create-pm-entry
→ Insert into pm_master
→ Update payment_status in entry_master
→ Recalculate dealer balances

// 3. Generate Reports
POST /export/combined-pdf
→ Fetch all related entries
→ Generate PDF with transaction history
```

### 3. Balance Calculation Logic

```javascript
// Complex balance calculation considering:
// 1. Opening balance
// 2. Sales entries (debit)
// 3. Purchase entries (credit)
// 4. Payment entries (credit)
// 5. Charges (debit)
// 6. Transportation charges (debit)

const calculateBalance = async dealerId => {
  const dealer = await knex('dealers_master').where('id', dealerId).first()
  let currentBalance = dealer.opening_bal

  // Get all entries sorted by date
  const allEntries = await getAllEntriesSortedByTime(dealerId)

  for (const entry of allEntries) {
    switch (entry.sourceType) {
      case 1: // Sales entry (debit)
        currentBalance -= entry.price
        break
      case 2: // Payment entry (credit)
        currentBalance += entry.amount
        break
      case 3: // Purchase entry (credit)
        currentBalance += entry.price
        break
      case 4: // Charges (debit)
        currentBalance -= entry.amount
        break
    }

    // Update entry with calculated balance
    await updateEntryBalance(entry, currentBalance)
  }

  // Update dealer's current balance
  await knex('dealers_master')
    .where('id', dealerId)
    .update({ current_bal: currentBalance })
}
```

---

## Database Relationships

### Entity Relationship Diagram

```
users ──┐
        ├── prod_plan_master ──┬── prod_job_card_master ──┬── prod_rejection_master
        │                     └── inventory_job_card_master
        │
        └── entry_master
        └── pm_master
        └── inwards_purchase_master
        └── charges_master

dealers_master ──┬── entry_master
                 ├── pm_master
                 ├── inwards_purchase_master
                 └── charges_master

alloy_master ──┬── entry_master (product_id)
               ├── prod_plan_master (alloy_id, convert_to_alloy_id)
               └── inventory_job_card_master

prod_steps_master ── prod_job_card_master (prod_step)

model_master ──┬── alloy_master
finish_master ──┤
holes_master ───┤
inches_master ──┤
pcd_master ─────┤
width_master ───┘
```

### Key Foreign Key Relationships

```sql
-- Production relationships
prod_job_card_master.prod_plan_id → prod_plan_master.id
prod_job_card_master.prod_step → prod_steps_master.id
prod_rejection_master.prod_plan_id → prod_plan_master.id
prod_rejection_master.prod_job_card_id → prod_job_card_master.id
inventory_job_card_master.prod_plan_id → prod_plan_master.id

-- Sales relationships
entry_master.dealer_id → dealers_master.id
entry_master.product_id → alloy_master.id
pm_master.dealer_id → dealers_master.id
inwards_purchase_master.dealer_id → dealers_master.id
charges_master.dealer_id → dealers_master.id

-- Product relationships
alloy_master.model_id → model_master.id
alloy_master.finish_id → finish_master.id
alloy_master.holes_id → holes_master.id
alloy_master.inches_id → inches_master.id
alloy_master.pcd_id → pcd_master.id
alloy_master.width_id → width_master.id

-- User relationships
prod_plan_master.created_by → users.id
prod_job_card_master.created_by → users.id
prod_job_card_master.qa_id → users.id
entry_master.created_by → users.id
```

---

## Security & Authentication

### Authentication Flow

1. **Clerk Integration**: Primary authentication using Clerk middleware
2. **JWT Tokens**: Secondary JWT tokens for API access
3. **Role-Based Access**: Different access levels based on user roles

### Security Middleware Stack

```javascript
// app.js security setup
app.use(cors()) // CORS protection
app.use(clerkMiddleware()) // Clerk authentication
app.use(helmet()) // Security headers
app.use(xss()) // XSS protection
app.use(compression()) // Response compression
```

### Role-Based Access Control

```javascript
// User Roles
const USER_ROLES = {
  ADMIN: 5,
  USER: 2,
  DEALER_ADMIN: 1,
  DEALER_USER: 2
}

// Protected route example
router.get('/get-steps', requireAuth(), getProductionStepsController)
```

---

## Error Handling & Logging

### Error Handling Pattern

```javascript
// Using express-async-handler for async error handling
const controller = expressAsyncHandler(async (req, res) => {
  try {
    // Business logic here
    const result = await someAsyncOperation()
    return res.status(200).json(result)
  } catch (error) {
    console.error('Error in controller:', error)
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    })
  }
})
```

### Logging Configuration

```javascript
// Morgan logging for HTTP requests
if (config.env !== 'test') {
  app.use(successHandler) // Log successful requests
  app.use(errorHandler) // Log error requests
}

// Morgan body logging for request/response bodies
morganBody(app)
```

### Database Transaction Pattern

```javascript
// Transaction handling pattern
const result = await knexInstance.transaction(async (trx) => {
  // Multiple database operations
  const entry = await trx('entry_master').insert({...});
  await trx('dealers_master').where('id', dealerId).update({...});

  // If any operation fails, entire transaction rolls back
  return entry;
});
```

---

## Performance Considerations

### Database Optimization

1. **Indexing**: Proper indexes on frequently queried columns
2. **Connection Pooling**: Configured connection pool (min: 0, max: 7)
3. **Query Optimization**: Efficient queries with proper joins
4. **Pagination**: Implemented pagination for large datasets

### Caching Strategy

- **Response Caching**: For frequently accessed static data
- **Database Query Caching**: For expensive queries
- **File Caching**: For generated reports and PDFs

### Monitoring & Performance

```javascript
// Database configuration with performance monitoring
const knexInstance = knex({
  client: 'mysql2',
  connection: {
    host: process.env.MYSQL_URL,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT,
    dateStrings: true,
    supportBigNumbers: true
  },
  pool: { min: 0, max: 7 },
  acquireConnectionTimeout: 10000,
  debug: true, // Enable query debugging
  asyncStackTraces: true // Better error traces
})
```

---

## Deployment & Environment Configuration

### Environment Variables

```bash
# Database Configuration
MYSQL_URL=your_mysql_host
MYSQL_USERNAME=your_username
MYSQL_PASSWORD=your_password
MYSQL_DB=your_database_name
MYSQL_PORT=3306

# Authentication
JWT_SECRET=your_jwt_secret
CLERK_SECRET_KEY=your_clerk_secret

# Server Configuration
NODE_ENV=production
PORT=4000
```

### Docker Configuration (if applicable)

```dockerfile
FROM node:16.15.1
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

### Railway Deployment

- **Database**: MySQL hosted on Railway
- **Application**: Node.js application deployed on Railway
- **Environment**: Production environment with proper security configurations

---

## Testing Strategy

### Unit Testing

- Test individual controller functions
- Mock database operations
- Test business logic in isolation

### Integration Testing

- Test complete API endpoints
- Test database transactions
- Test authentication flows

### API Testing

```javascript
// Example API test
describe('Production API', () => {
  it('should create production plan', async () => {
    const response = await request(app)
      .post('/api/v2/production/add-production-plan')
      .set('Authorization', `Bearer ${token}`)
      .send({
        alloyId: 1,
        convertId: 2,
        quantity: 100,
        urgent: 0,
        userId: 1
      })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('id')
  })
})
```

---

## Development Guidelines

### Code Style

- **ES6+ Features**: Use modern JavaScript features
- **Async/Await**: Prefer async/await over promises
- **Error Handling**: Always handle errors properly
- **Validation**: Validate input data before processing

### Database Guidelines

- **Transactions**: Use transactions for multi-table operations
- **Naming**: Use snake_case for database columns
- **Relationships**: Maintain proper foreign key relationships
- **Migrations**: Use proper database migrations for schema changes

### API Guidelines

- **RESTful Design**: Follow REST principles
- **Versioning**: Use API versioning (v1, v2)
- **Status Codes**: Use appropriate HTTP status codes
- **Documentation**: Document all endpoints properly

---

## Troubleshooting Guide

### Common Issues

#### 1. Database Connection Issues

```javascript
// Check database configuration
console.log('Database config:', {
  host: process.env.MYSQL_URL,
  database: process.env.MYSQL_DB,
  port: process.env.MYSQL_PORT
})

// Test connection
knexInstance
  .raw('SELECT 1')
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database connection failed:', err))
```

#### 2. Authentication Issues

```javascript
// Verify JWT token
const jwt = require('jsonwebtoken')
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  console.log('Token valid:', decoded)
} catch (error) {
  console.error('Token invalid:', error.message)
}
```

#### 3. Balance Calculation Issues

- Check entry order by timestamp
- Verify all entry types are included
- Ensure proper transaction handling
- Validate opening balance

### Debugging Tools

- **Database Queries**: Enable Knex debug mode
- **Request Logging**: Use Morgan for HTTP request logging
- **Error Tracking**: Implement proper error logging
- **Performance Monitoring**: Monitor query performance

---

## Future Enhancements

### Planned Features

1. **Real-time Notifications**: WebSocket integration for real-time updates
2. **Advanced Analytics**: More detailed reporting and analytics
3. **Mobile API**: Dedicated mobile API endpoints
4. **Audit Logging**: Comprehensive audit trail for all operations
5. **Backup & Recovery**: Automated backup and recovery procedures

### Scalability Considerations

1. **Microservices**: Break down into smaller services
2. **Caching Layer**: Implement Redis for caching
3. **Load Balancing**: Horizontal scaling with load balancers
4. **Database Sharding**: Partition data for better performance

---

This technical documentation provides a comprehensive overview of the Plati India ERP System's backend architecture, database design, API endpoints, and implementation details for developers and technical stakeholders.
