const { loadConfig } = require('../utils/config');
const { getDomainInfo, getSubscriberInfo, getApplicationInfo, getTrunkInfo, getDnidInfo } = require('../utils/api');
const { debug } = require('../utils/debug');
const yaml = require('yaml');
const chalk = require('chalk');

/**
 * Helper to format nested objects for display
 * @param {Object} obj - The object to format
 * @param {number} indent - Current indentation level
 * @returns {string} Formatted string representation
 */
const formatObject = (obj, indent = 0) => {
  const indentStr = '  '.repeat(indent);
  let output = '';
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      output += `${indentStr}${key}: null\n`;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        output += `${indentStr}${key}: []\n`;
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        output += `${indentStr}${key}:\n`;
        value.forEach((item, index) => {
          output += `${indentStr}  [${index}]:\n${formatObject(item, indent + 2)}`;
        });
      } else {
        output += `${indentStr}${key}: ${JSON.stringify(value)}\n`;
      }
    } else if (typeof value === 'object') {
      output += `${indentStr}${key}:\n${formatObject(value, indent + 1)}`;
    } else {
      output += `${indentStr}${key}: ${value}\n`;
    }
  }
  
  return output;
};

/**
 * Formats domain information in a human-readable way
 * @param {Object} domainInfo - The domain information
 * @returns {string} Formatted domain information
 */
const formatDomainInfo = (domainInfo) => {
  // Ensure we have something to display
  if (!domainInfo) {
    return 'No domain information available';
  }
  
  let output = '\n=== Domain Information ===\n\n';
  return output + formatObject(domainInfo);
};

/**
 * Format data as YAML with highlighting (similar to call.js)
 * @param {Object} data - The data to format
 * @param {string} title - Title to display
 * @returns {string} Formatted YAML with colors
 */
const formatYaml = (data, title) => {
  if (!data) {
    return 'No data available';
  }
  
  // Add a title
  let output = chalk.bold.blue(`\n=== ${title} ===\n\n`);
  
  // Convert to YAML
  const yamlString = yaml.stringify(data);
  
  // Add basic color highlighting
  const coloredLines = yamlString.split('\n').map(line => {
    // Handle key: value lines
    if (line.includes(':')) {
      const colonPos = line.indexOf(':');
      const key = line.substring(0, colonPos);
      const value = line.substring(colonPos + 1);
      
      return chalk.cyan(key + ':') + processValue(value);
    }
    
    // Handle list items
    if (line.trim().startsWith('-')) {
      return line.replace('-', chalk.yellow('-'));
    }
    
    return line;
  });
  
  return output + coloredLines.join('\n');
};

/**
 * Process and color a YAML value (copied from call.js for consistency)
 * @param {string} value - The YAML value to process
 * @returns {string} Colored value
 */
function processValue(value) {
  // Empty or null values
  if (!value.trim() || value.trim() === 'null') {
    return value;
  }
  
  // Numbers
  if (value.trim().match(/^-?\d+(\.\d+)?$/)) {
    return value.replace(/(-?\d+(\.\d+)?)/, chalk.yellow('$1'));
  }
  
  // Booleans
  if (value.trim() === 'true' || value.trim() === 'false') {
    return value.replace(/(true|false)/, chalk.yellow('$1'));
  }
  
  // Dates (ISO format)
  if (value.trim().match(/\d{4}-\d{2}-\d{2}T/)) {
    return value.replace(/(\d{4}-\d{2}-\d{2}T[\d:.Z+-]+)/, chalk.green('$1'));
  }
  
  // Strings in quotes
  if (value.trim().match(/^".*"$/) || value.trim().match(/^'.*'$/)) {
    return value.replace(/(["']).*\1/, chalk.green('$&'));
  }
  
  return value;
}

/**
 * Gets and displays information about a domain
 * @param {Object} options - Command options
 * @param {string} options.domain - The domain name
 * @param {string} options.subscriber - Optional subscriber ID
 * @param {string} options.application - Optional application ID
 * @param {string} options.trunk - Optional trunk ID
 * @param {string} options.dnid - Optional DNID ID
 */
const getDomain = async (options) => {
  const { domain, subscriber, application, trunk, dnid } = options;
  
  if (!domain) {
    console.error('The --domain option is required');
    process.exit(1);
  }
  
  try {
    debug(`Getting information for domain '${domain}'`);
    
    // Load the configuration
    const config = await loadConfig();
    
    // Check if the domain exists in configuration
    if (!config.domains || !config.domains[domain]) {
      console.error(`Domain '${domain}' not found in configuration. Use 'cx-cli configure' to add it.`);
      process.exit(1);
    }
    
    const apiKey = config.domains[domain].apiKey;
    
    // Count how many resource options are specified
    const resourceOptionsCount = [subscriber, application, trunk, dnid].filter(option => option !== undefined).length;

    // Determine which type of information to get based on the options
    if (resourceOptionsCount > 1) {
      // If multiple resource options are specified, display an error
      console.error('Error: Cannot specify multiple resource options (--subscriber, --application, --trunk, --dnid) simultaneously');
      process.exit(1);
    } else if (subscriber !== undefined) {
      // If subscriber is true, it means the --subscriber flag was used without a value
      // In this case, we want to get all subscribers (pass null as subscriberId)
      const subscriberId = subscriber === true ? null : subscriber;
      
      // Get subscriber information
      debug(`Retrieving subscriber information${subscriberId ? ` for subscriber '${subscriberId}'` : ' (all subscribers)'}`);
      const subscriberInfo = await getSubscriberInfo(domain, apiKey, subscriberId);
      
      // Format title based on whether we're getting one subscriber or all subscribers
      const title = subscriberId 
        ? `Subscriber Information for ${subscriberId}`
        : `All Subscribers for Domain ${domain}`;
      
      // Format and display subscriber information
      const formattedInfo = formatYaml(subscriberInfo, title);
      console.log(formattedInfo);
    } else if (application !== undefined) {
      // If application is true, it means the --application flag was used without a value
      // In this case, we want to get all applications (pass null as applicationId)
      const applicationId = application === true ? null : application;
      
      // Get application information
      debug(`Retrieving application information${applicationId ? ` for application '${applicationId}'` : ' (all applications)'}`);
      const applicationInfo = await getApplicationInfo(domain, apiKey, applicationId);
      
      // Format title based on whether we're getting one application or all applications
      const title = applicationId 
        ? `Application Information for ${applicationId}`
        : `All Applications for Domain ${domain}`;
      
      // Format and display application information
      const formattedInfo = formatYaml(applicationInfo, title);
      console.log(formattedInfo);
    } else if (trunk !== undefined) {
      // If trunk is true, it means the --trunk flag was used without a value
      // In this case, we want to get all trunks (pass null as trunkId)
      const trunkId = trunk === true ? null : trunk;
      
      // Get trunk information
      debug(`Retrieving trunk information${trunkId ? ` for trunk '${trunkId}'` : ' (all trunks)'}`);
      const trunkInfo = await getTrunkInfo(domain, apiKey, trunkId);
      
      // Format title based on whether we're getting one trunk or all trunks
      const title = trunkId 
        ? `Trunk Information for ${trunkId}`
        : `All Trunks for Domain ${domain}`;
      
      // Format and display trunk information
      const formattedInfo = formatYaml(trunkInfo, title);
      console.log(formattedInfo);
    } else if (dnid !== undefined) {
      // If dnid is true, it means the --dnid flag was used without a value
      // In this case, we want to get all DNIDs (pass null as dnidId)
      const dnidId = dnid === true ? null : dnid;
      
      // Get DNID information
      debug(`Retrieving DNID information${dnidId ? ` for DNID '${dnidId}'` : ' (all DNIDs)'}`);
      const dnidInfo = await getDnidInfo(domain, apiKey, dnidId);
      
      // Format title based on whether we're getting one DNID or all DNIDs
      const title = dnidId 
        ? `DNID Information for ${dnidId}`
        : `All DNIDs for Domain ${domain}`;
      
      // Format and display DNID information
      const formattedInfo = formatYaml(dnidInfo, title);
      console.log(formattedInfo);
    } else {
      // Get domain information from API
      const domainInfo = await getDomainInfo(domain, apiKey);
      
      // Format and display domain information using the new YAML formatter
      const formattedInfo = formatYaml(domainInfo, `Domain Information for ${domain}`);
      console.log(formattedInfo);
    }
  } catch (error) {
    console.error(`Error getting information: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  getDomain
};