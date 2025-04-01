#!/usr/bin/env node

const { program } = require('commander');
const { configure } = require('./commands/configure');
const { deleteDomain } = require('./commands/delete');
const { display } = require('./commands/display');
const { getDomain } = require('./commands/get');
const { getCallInfo } = require('./commands/call');
const package = require('../package.json');
const { enableDebug } = require('./utils/debug');

program
  .name('cx-cli')
  .description('Cloudonix CLI tool for managing accounts and resources')
  .version(package.version)
  .option('--debug', 'Enable debug mode to show API requests and responses');

// Helper function for applying debug option
const withDebug = (fn) => {
  return (options, command) => {
    // Get access to the global --debug flag
    const globalOptions = command.parent.opts();
    
    // If debug mode is enabled, set it in our debug utility
    if (globalOptions.debug) {
      enableDebug();
    }
    
    // Pass options to the command function
    fn(options);
  };
};

program
  .command('configure')
  .description('Configure a Cloudonix domain with API key')
  .option('--domain <domain>', 'Domain name')
  .option('--apikey <apiKey>', 'API key for the domain')
  .action(withDebug(configure));

program
  .command('delete')
  .description('Delete a domain from the configuration')
  .option('--domain <domain>', 'Domain name to delete')
  .action(withDebug(deleteDomain));

program
  .command('display')
  .description('Display all configured domains')
  .action(withDebug(display));

program
  .command('get')
  .description('Get detailed information about a specific domain, subscribers, applications, trunks, or DNIDs')
  .option('--domain <domain>', 'Domain name')
  .option('--subscriber [subscriber-id]', 'Get subscriber information. If no subscriber ID is provided, get all subscribers')
  .option('--application [application-id]', 'Get application information. If no application ID is provided, get all applications')
  .option('--trunk [trunk-id]', 'Get trunk information. If no trunk ID is provided, get all trunks')
  .option('--dnid [dnid-id]', 'Get DNID information. If no DNID ID is provided, get all DNIDs')
  .action(withDebug(getDomain));
  
program
  .command('call')
  .description('Get detailed information about a call session')
  .option('--domain <domain>', 'Domain name')
  .option('--session <session-id>', 'ID of the call session to retrieve')
  .option('--log', 'Show only the log object from the response')
  .action(withDebug(getCallInfo));

program.parse(process.argv);