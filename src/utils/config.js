const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const yaml = require('yaml');

const CONFIG_DIR = path.join(os.homedir(), '.cx-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yaml');

/**
 * Ensures the config directory exists
 */
const ensureConfigDir = async () => {
  await fs.ensureDir(CONFIG_DIR);
};

/**
 * Loads the configuration file
 * @returns {Object} The configuration object
 */
const loadConfig = async () => {
  await ensureConfigDir();
  
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const fileContent = await fs.readFile(CONFIG_FILE, 'utf8');
      return yaml.parse(fileContent) || { domains: {} };
    }
  } catch (error) {
    console.error('Error loading configuration:', error.message);
  }
  
  return { domains: {} };
};

/**
 * Saves the configuration to file
 * @param {Object} config - The configuration object to save
 */
const saveConfig = async (config) => {
  await ensureConfigDir();
  
  try {
    const yamlString = yaml.stringify(config);
    await fs.writeFile(CONFIG_FILE, yamlString, 'utf8');
  } catch (error) {
    console.error('Error saving configuration:', error.message);
    throw error;
  }
};

/**
 * Adds or updates a domain in the configuration
 * @param {string} domain - The domain name
 * @param {string} apiKey - The API key for the domain
 */
const addDomain = async (domain, apiKey) => {
  const config = await loadConfig();
  
  if (!config.domains) {
    config.domains = {};
  }
  
  config.domains[domain] = { apiKey };
  
  await saveConfig(config);
};

module.exports = {
  loadConfig,
  saveConfig,
  addDomain
};