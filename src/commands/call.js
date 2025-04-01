const { loadConfig } = require('../utils/config');
const { getSessionInfo } = require('../utils/api');
const { debug } = require('../utils/debug');
const yaml = require('yaml');
const chalk = require('chalk');

/**
 * Format session information as YAML with highlighting
 * @param {Object} sessionInfo - The session information
 * @returns {string} Highlighted YAML formatted session information
 */
const formatSessionYaml = (sessionInfo) => {
  if (!sessionInfo) {
    return 'No session information available';
  }
  
  // Determine the appropriate title based on content
  let titleText = '\n=== Call Session Information ===\n\n';
  
  // If it's just the log object, use a more specific title
  if (Object.keys(sessionInfo).length === 1 && sessionInfo.log) {
    titleText = '\n=== Call Session Log ===\n\n';
  }
  
  // Add a title
  let output = chalk.bold.blue(titleText);
  
  // Clone the session info to avoid modifying the original
  const sessionForYaml = JSON.parse(JSON.stringify(sessionInfo, (key, value) => {
    // Handle timestamp fields specifically
    if (typeof value === 'string' && (key === 'timestamp' || key === 'time')) {
      // Try to parse as a date and ensure full ISO format
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
          return date.toISOString();
        }
      } catch (e) {
        // If parsing fails, return the original
      }
    }
    return value;
  }));
  
  // Create a new reorganized object with simple properties first, complex properties last
  const reorganized = {};
  const complexKeys = [];
  
  // First pass - identify simple and complex keys
  Object.keys(sessionForYaml).forEach(key => {
    const value = sessionForYaml[key];
    
    // If value is an array or object with properties, mark as complex
    if (Array.isArray(value) || 
        (value !== null && typeof value === 'object' && Object.keys(value).length > 0)) {
      complexKeys.push(key);
    } else {
      // Simple values go directly into reorganized object
      reorganized[key] = value;
    }
  });
  
  // Second pass - add complex properties in order
  complexKeys.forEach(key => {
    reorganized[key] = sessionForYaml[key];
    
    // Sort events by timestamp if this is the events array
    if (key === 'events' && Array.isArray(reorganized[key])) {
      reorganized[key].sort((a, b) => {
        return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
      });
    }
    
    // Sort log entries by timestamp or time if this is the log array
    if (key === 'log' && Array.isArray(reorganized[key])) {
      reorganized[key].sort((a, b) => {
        const aTime = a.timestamp || a.time || 0;
        const bTime = b.timestamp || b.time || 0;
        return new Date(aTime) - new Date(bTime);
      });
    }
  });
  
  // Convert to YAML
  const yamlString = yaml.stringify(reorganized);
  
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
 * Process and color a YAML value
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
 * Gets and displays information about a call session
 * @param {Object} options - Command options
 * @param {string} options.domain - The domain name
 * @param {string} options.session - The session ID
 * @param {boolean} options.log - Whether to show only the log object
 */
const getCallInfo = async (options) => {
  const { domain, session, log: showLogOnly } = options;
  
  if (!domain) {
    console.error('The --domain option is required');
    process.exit(1);
  }
  
  if (!session) {
    console.error('The --session option is required');
    process.exit(1);
  }
  
  debug(`Log only mode: ${showLogOnly ? 'enabled' : 'disabled'}`);
  
  try {
    debug(`Getting information for session '${session}' in domain '${domain}'`);
    
    // Load the configuration
    const config = await loadConfig();
    
    // Check if the domain exists in configuration
    if (!config.domains || !config.domains[domain]) {
      console.error(`Domain '${domain}' not found in configuration. Use 'cx-cli configure' to add it.`);
      process.exit(1);
    }
    
    const apiKey = config.domains[domain].apiKey;
    
    // Get session information from API
    const sessionInfo = await getSessionInfo(domain, session, apiKey);
    
    // If log only mode is enabled, filter to show only the log object
    let dataToDisplay = sessionInfo;
    
    if (showLogOnly) {
      if (sessionInfo.log) {
        // Display only the log object
        dataToDisplay = { log: sessionInfo.log };
        debug('Filtering output to show only the log object');
      } else {
        console.log(chalk.yellow('Warning: No log object found in the session data'));
        // Still show available data even if log wasn't found
      }
    }
    
    // Format and display session information as YAML
    const yamlOutput = formatSessionYaml(dataToDisplay);
    console.log(yamlOutput);
    
  } catch (error) {
    console.error(`Error getting session information: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  getCallInfo
};