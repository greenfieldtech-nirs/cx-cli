const { addDomain } = require('../utils/config');
const { validateDomain } = require('../utils/api');

/**
 * Configures a domain with the provided API key
 * @param {Object} options - Command options
 * @param {string} options.domain - The domain name
 * @param {string} options.apikey - The API key for the domain
 */
const configure = async (options) => {
  const { domain, apikey } = options;
  
  if (!domain || !apikey) {
    console.error('Both --domain and --apikey options are required');
    process.exit(1);
  }
  
  try {
    console.log(`Validating domain '${domain}'...`);
    
    const isValid = await validateDomain(domain, apikey);
    
    if (!isValid) {
      console.error(`Failed to validate domain '${domain}'. Please check the domain name and API key.`);
      process.exit(1);
    }
    
    console.log(`Domain '${domain}' validated successfully.`);
    
    await addDomain(domain, apikey);
    
    console.log(`Domain '${domain}' configured successfully.`);
  } catch (error) {
    console.error(`Error configuring domain: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  configure
};