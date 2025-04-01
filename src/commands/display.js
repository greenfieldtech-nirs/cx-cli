const { loadConfig } = require('../utils/config');
const { debug } = require('../utils/debug');

/**
 * Displays all configured domains in a human-readable format
 * @param {Object} options - Command options
 */
const display = async (options) => {
  try {
    debug('Loading configuration for display');
    
    // Load the current configuration
    const config = await loadConfig();
    
    // Check if any domains are configured
    if (!config.domains || Object.keys(config.domains).length === 0) {
      console.log('No domains are currently configured');
      return;
    }
    
    debug('Domains found in configuration', config.domains);
    
    // Display header
    console.log('\nConfigured Domains:\n');
    console.log('--------------------------------------------------------');
    console.log('Domain                          API Key');
    console.log('--------------------------------------------------------');
    
    // Display each domain and its API key
    Object.entries(config.domains).forEach(([domain, details]) => {
      // Mask part of the API key for security
      const apiKey = details.apiKey || '';
      const maskedKey = apiKey.length > 8 
        ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
        : '********';
      
      // Format domain and API key in columns
      const domainCol = domain.padEnd(30);
      
      console.log(`${domainCol} ${maskedKey}`);
    });
    
    console.log('--------------------------------------------------------');
    console.log(`Total domains: ${Object.keys(config.domains).length}`);
    
  } catch (error) {
    console.error(`Error displaying configuration: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  display
};