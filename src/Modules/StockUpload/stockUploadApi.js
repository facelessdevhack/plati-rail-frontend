/**
 * Stock Upload API
 *
 * API functions for Excel stock upload operations
 */

import { client, getError } from '../../Utils/axiosClient';

/**
 * Parse Excel file and return match results
 */
export const parseExcelFile = async (file, customMappings = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customMappings', JSON.stringify(customMappings));

    const response = await client.post('/stock-upload/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Parse Excel error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to parse Excel file'
    };
  }
};

/**
 * Preview with custom mappings
 */
export const previewWithMappings = async (file, customMappings = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customMappings', JSON.stringify(customMappings));

    const response = await client.post('/stock-upload/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Preview error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to preview changes'
    };
  }
};

/**
 * Execute stock updates
 * NOTE: Only updates in_house_stock in alloy_master table
 */
export const executeUpdates = async (updates, options = {}) => {
  try {
    const response = await client.post('/stock-upload/execute', {
      updates,
      dryRun: options.dryRun || false
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Execute updates error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to execute updates'
    };
  }
};

/**
 * Get all finishes for mapping
 */
export const getAllFinishes = async () => {
  try {
    const response = await client.get('/stock-upload/finishes');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get finishes error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get finishes'
    };
  }
};

/**
 * Get all spec masters
 */
export const getAllSpecs = async () => {
  try {
    const response = await client.get('/stock-upload/specs');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get specs error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get specs'
    };
  }
};

/**
 * Get default finish mappings
 */
export const getDefaultMappings = async () => {
  try {
    const response = await client.get('/stock-upload/default-mappings');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get default mappings error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get default mappings'
    };
  }
};

/**
 * Search alloys for manual matching
 */
export const searchAlloys = async (search = '', limit = 50) => {
  try {
    const response = await client.get('/stock-upload/search-alloys', {
      params: { search, limit }
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Search alloys error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to search alloys'
    };
  }
};
