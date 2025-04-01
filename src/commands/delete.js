const { loadConfig, saveConfig } = require('../utils/config');
const { debug } = require('../utils/debug');

/**
 * Deletes a domain from the configuration
 * @param {Object} options - Command options
 * @param {string} options.domain - The domain name to delete
 */
const deleteDomain = async (options) => {
  const { domain } = options;
  
  if (!domain) {
    console.error('The --domain option is required');
    process.exit(1);
  }
  
  try {
    debug(`Attempting to delete domain '${domain}' from configuration`);
    
    // Load the current configuration
    const config = await loadConfig();
    
    // Check if the domain exists in configuration
    if (!config.domains || !config.domains[domain]) {
      console.error(`Domain '${domain}' not found in configuration`);
      process.exit(1);
    }
    
    debug(`Domain '${domain}' found in configuration`, config.domains[domain]);
    
    // Delete the domain from configuration
    delete config.domains[domain];
    
    // Save the updated configuration
    await saveConfig(config);
    
    console.log(`Domain '${domain}' has been removed from configuration`);
  } catch (error) {
    console.error(`Error deleting domain: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  deleteDomain
};