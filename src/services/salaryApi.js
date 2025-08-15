import axios from 'axios';

const BASE_URL = '/api/v2';

// Employee APIs
export const employeeApi = {
  getAll: (params = {}) => axios.get(`${BASE_URL}/employees`, { params }),
  getById: (id) => axios.get(`${BASE_URL}/employees/${id}`),
  create: (data) => axios.post(`${BASE_URL}/employees`, data),
  update: (id, data) => axios.put(`${BASE_URL}/employees/${id}`, data),
  delete: (id) => axios.delete(`${BASE_URL}/employees/${id}`),
  getStats: () => axios.get(`${BASE_URL}/employees/stats`),
  bulkImport: (formData) => axios.post(`${BASE_URL}/employees/bulk-import`, formData)
};

// Attendance APIs
export const attendanceApi = {
  getAll: (params = {}) => axios.get(`${BASE_URL}/attendance`, { params }),
  mark: (data) => axios.post(`${BASE_URL}/attendance`, data),
  update: (id, data) => axios.put(`${BASE_URL}/attendance/${id}`, data),
  bulkUpload: (formData) => axios.post(`${BASE_URL}/attendance/bulk-upload`, formData),
  bulkMark: (data) => axios.post(`${BASE_URL}/attendance/bulk-mark`, data),
  getMonthlyReport: (params) => axios.get(`${BASE_URL}/attendance/monthly-report`, { params }),
  getSummary: () => axios.get(`${BASE_URL}/attendance/summary`)
};

// Salary APIs
export const salaryApi = {
  getAll: (params = {}) => axios.get(`${BASE_URL}/salary`, { params }),
  processEmployee: (data) => axios.post(`${BASE_URL}/salary/process-employee`, data),
  processAll: (data) => axios.post(`${BASE_URL}/salary/process-all`, data),
  autoCalculate: (data) => axios.post(`${BASE_URL}/salary/auto-calculate`, data),
  updatePaymentStatus: (id, data) => axios.put(`${BASE_URL}/salary/payment-status/${id}`, data),
  bulkUpdatePaymentStatus: (data) => axios.put(`${BASE_URL}/salary/bulk-payment-status`, data),
  getSalarySlip: (id) => axios.get(`${BASE_URL}/salary/slip/${id}`),
  getSummary: (params) => axios.get(`${BASE_URL}/salary/summary`, { params })
};

// Leave APIs
export const leaveApi = {
  apply: (data) => axios.post(`${BASE_URL}/leave/apply`, data),
  getApplications: (params = {}) => axios.get(`${BASE_URL}/leave/applications`, { params }),
  updateStatus: (id, data) => axios.put(`${BASE_URL}/leave/status/${id}`, data),
  getBalance: (params = {}) => axios.get(`${BASE_URL}/leave/balance`, { params }),
  initializeBalance: (data) => axios.post(`${BASE_URL}/leave/initialize-balance`, data),
  getCalendar: (params) => axios.get(`${BASE_URL}/leave/calendar`, { params }),
  getSummary: (params) => axios.get(`${BASE_URL}/leave/summary`, { params })
};

// Holidays APIs
export const holidaysApi = {
  getAll: (params = {}) => axios.get(`${BASE_URL}/holidays`, { params }),
  getById: (id) => axios.get(`${BASE_URL}/holidays/${id}`),
  create: (data) => axios.post(`${BASE_URL}/holidays`, data),
  update: (id, data) => axios.put(`${BASE_URL}/holidays/${id}`, data),
  delete: (id) => axios.delete(`${BASE_URL}/holidays/${id}`),
  bulkImport: (data) => axios.post(`${BASE_URL}/holidays/bulk-import`, data),
  getUpcoming: (params = {}) => axios.get(`${BASE_URL}/holidays/upcoming`, { params }),
  getByMonth: (params) => axios.get(`${BASE_URL}/holidays/month`, { params }),
  getStats: (params) => axios.get(`${BASE_URL}/holidays/stats`, { params }),
  createStandard: (data) => axios.post(`${BASE_URL}/holidays/create-standard`, data)
};