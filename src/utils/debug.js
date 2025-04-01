/**
 * Debug utility for logging API requests and responses
 */

let isDebugEnabled = false;

/**
 * Enable debug mode
 */
const enableDebug = () => {
  isDebugEnabled = true;
};

/**
 * Check if debug mode is enabled
 * @returns {boolean} Whether debug mode is enabled
 */
const isDebug = () => {
  return isDebugEnabled;
};

/**
 * Log debug information if debug mode is enabled
 * @param {string} message - The message to log
 * @param {Object} data - The data to log
 */
const debug = (message, data = null) => {
  if (!isDebugEnabled) return;
  
  console.log('\n=== DEBUG ===');
  console.log(message);
  
  if (data) {
    console.log('Data:');
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('=============\n');
};

module.exports = {
  enableDebug,
  isDebug,
  debug
};