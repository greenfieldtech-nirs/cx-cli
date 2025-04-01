const axios = require('axios');
const { debug } = require('./debug');

const API_BASE_URL = 'https://api.cloudonix.io';

/**
 * Creates an API client with the given API key
 * @param {string} apiKey - The API key to use for authentication
 * @returns {Object} The API client
 */
const createApiClient = (apiKey) => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Add request interceptor for debugging
  client.interceptors.request.use(request => {
    debug(`REQUEST: ${request.method.toUpperCase()} ${request.baseURL}${request.url}`, {
      headers: request.headers,
      data: request.data
    });
    return request;
  });
  
  // Add response interceptor for debugging
  client.interceptors.response.use(
    response => {
      debug(`RESPONSE: ${response.status} ${response.statusText}`, {
        data: response.data,
        headers: response.headers
      });
      
      // Ensure timestamps in log entries are preserved in full ISO format
      if (response.data && response.data.log && Array.isArray(response.data.log)) {
        // Ensure each log entry has a properly formatted timestamp
        response.data.log.forEach(entry => {
          // Fix both timestamp and time fields
          ['timestamp', 'time'].forEach(field => {
            if (entry[field]) {
              // Check if it's a truncated timestamp
              const value = entry[field];
              
              // Make sure it's a valid Date object for proper serialization
              try {
                // Handle truncated timestamps by adding missing parts if needed
                let dateString = value;
                
                // If it's truncated like "2025-04-01T02", append missing parts
                if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(dateString)) {
                  dateString += ':00:00.000Z'; // Add missing minutes, seconds
                } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
                  dateString += ':00.000Z'; // Add missing seconds
                } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateString)) {
                  dateString += '.000Z'; // Add missing milliseconds
                }
                
                const date = new Date(dateString);
                if (!isNaN(date.getTime())) {
                  entry[field] = date.toISOString();
                }
              } catch (e) {
                // Ignore conversion errors and keep original
              }
            }
          });
        });
      }
      
      return response;
    },
    error => {
      if (error.response) {
        debug(`ERROR RESPONSE: ${error.response.status} ${error.response.statusText}`, {
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        debug('ERROR: No response received', { request: error.request });
      } else {
        debug('ERROR: Request setup failed', { message: error.message });
      }
      return Promise.reject(error);
    }
  );
  
  return client;
};

/**
 * Validates a domain by attempting to fetch it
 * @param {string} domain - The domain name to validate
 * @param {string} apiKey - The API key for authentication
 * @returns {Promise<boolean>} Whether the domain is valid
 */
const validateDomain = async (domain, apiKey) => {
  try {
    debug(`Validating domain '${domain}'`);
    const client = createApiClient(apiKey);
    const response = await client.get(`/customers/self/domains/${domain}`);
    return response.status === 200;
  } catch (error) {
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      console.error(`Network Error: Unable to reach Cloudonix API`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    return false;
  }
};

/**
 * Gets detailed information about a domain
 * @param {string} domain - The domain name to fetch
 * @param {string} apiKey - The API key for authentication
 * @returns {Promise<Object>} The domain information
 */
const getDomainInfo = async (domain, apiKey) => {
  try {
    debug(`Fetching information for domain '${domain}'`);
    const client = createApiClient(apiKey);
    const response = await client.get(`/customers/self/domains/${domain}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network Error: Unable to reach Cloudonix API`);
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

/**
 * Gets detailed information about a call session
 * @param {string} domain - The domain name
 * @param {string} sessionId - The session ID to fetch
 * @param {string} apiKey - The API key for authentication
 * @returns {Promise<Object>} The session information
 */
const getSessionInfo = async (domain, sessionId, apiKey) => {
  try {
    debug(`Fetching information for session '${sessionId}' in domain '${domain}'`);
    const client = createApiClient(apiKey);
    const response = await client.get(`/customers/self/domains/${domain}/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network Error: Unable to reach Cloudonix API`);
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

/**
 * Gets detailed information about a domain's subscribers
 * @param {string} domain - The domain name
 * @param {string} apiKey - The API key for authentication
 * @param {string} [subscriberId] - Optional subscriber ID to fetch a specific subscriber
 * @returns {Promise<Object>} The subscriber information
 */
const getSubscriberInfo = async (domain, apiKey, subscriberId = null) => {
  try {
    debug(`Fetching subscriber information for domain '${domain}'${subscriberId ? ` and subscriber '${subscriberId}'` : ' (all subscribers)'}`);
    const client = createApiClient(apiKey);
    
    // Build the URL based on whether we're fetching a specific subscriber or all subscribers
    const url = subscriberId 
      ? `/customers/self/domains/${domain}/subscribers/${subscriberId}`
      : `/customers/self/domains/${domain}/subscribers`;
      
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network Error: Unable to reach Cloudonix API`);
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

/**
 * Gets detailed information about a domain's applications
 * @param {string} domain - The domain name
 * @param {string} apiKey - The API key for authentication
 * @param {string} [applicationId] - Optional application ID to fetch a specific application
 * @returns {Promise<Object>} The application information
 */
const getApplicationInfo = async (domain, apiKey, applicationId = null) => {
  try {
    debug(`Fetching application information for domain '${domain}'${applicationId ? ` and application '${applicationId}'` : ' (all applications)'}`);
    const client = createApiClient(apiKey);
    
    // Build the URL based on whether we're fetching a specific application or all applications
    const url = applicationId 
      ? `/customers/self/domains/${domain}/applications/${applicationId}`
      : `/customers/self/domains/${domain}/applications`;
      
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network Error: Unable to reach Cloudonix API`);
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

/**
 * Gets detailed information about a domain's trunks
 * @param {string} domain - The domain name
 * @param {string} apiKey - The API key for authentication
 * @param {string} [trunkId] - Optional trunk ID to fetch a specific trunk
 * @returns {Promise<Object>} The trunk information
 */
const getTrunkInfo = async (domain, apiKey, trunkId = null) => {
  try {
    debug(`Fetching trunk information for domain '${domain}'${trunkId ? ` and trunk '${trunkId}'` : ' (all trunks)'}`);
    const client = createApiClient(apiKey);
    
    // Build the URL based on whether we're fetching a specific trunk or all trunks
    const url = trunkId 
      ? `/customers/self/domains/${domain}/trunks/${trunkId}`
      : `/customers/self/domains/${domain}/trunks`;
      
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network Error: Unable to reach Cloudonix API`);
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

/**
 * Gets detailed information about a domain's DNIDs
 * @param {string} domain - The domain name
 * @param {string} apiKey - The API key for authentication
 * @param {string} [dnidId] - Optional DNID ID to fetch a specific DNID
 * @returns {Promise<Object>} The DNID information
 */
const getDnidInfo = async (domain, apiKey, dnidId = null) => {
  try {
    debug(`Fetching DNID information for domain '${domain}'${dnidId ? ` and DNID '${dnidId}'` : ' (all DNIDs)'}`);
    const client = createApiClient(apiKey);
    
    // Build the URL based on whether we're fetching a specific DNID or all DNIDs
    const url = dnidId 
      ? `/customers/self/domains/${domain}/dnids/${dnidId}`
      : `/customers/self/domains/${domain}/dnids`;
      
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network Error: Unable to reach Cloudonix API`);
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
};

module.exports = {
  createApiClient,
  validateDomain,
  getDomainInfo,
  getSessionInfo,
  getSubscriberInfo,
  getApplicationInfo,
  getTrunkInfo,
  getDnidInfo
};