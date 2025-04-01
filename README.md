# Cloudonix CLI (cx-cli)

A CLI tool for querying Cloudonix accounts and resources.

## Installation
### Prerequisites
- Node.js v22 or higher
- npm v10 or higher

#### Installing `node` and `npm` (optional)
If you currently don't have `node` and `npm` installed on your local machine, here is a quick installation
guide to get you started using the `nvm` tool.

1. Installing `nvm`
```bash
curl -sL https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.0/install.sh -o install_nvm.sh
chmod +x install_nvm.sh
./install_nvm.sh
```
After the installation completes, open a new terminal window to continue the installation.

2. Verify `nvm`
```bash
command -v nvm
```
The output should simplט say `nvm`.

3. Install `node` and `npm`
```bash
nvm install --lts
```
This will install the latest version of both `node` and `npm`.

Now, you can continue with the next installation steps normally.

```bash
# Install globally
npm install -g cx-cli
```

## Usage

### Configure a Domain

To configure a domain with its API key:

```bash
cx-cli configure --domain <domain> --apikey <apiKey>

# With debug mode enabled
cx-cli --debug configure --domain <domain> --apikey <apiKey>
```

This will validate the domain and store the configuration for future use.

### Delete a Domain

To remove a domain from the configuration:

```bash
cx-cli delete --domain <domain>

# With debug mode enabled
cx-cli --debug delete --domain <domain>
```

This will remove the specified domain from the configuration file while preserving other domains.

### Display Configuration

To view all configured domains:

```bash
cx-cli display

# With debug mode enabled
cx-cli --debug display
```

This will display all configured domains and their API keys (partially masked for security) in a human-readable format.

### Get Domain Information

To view detailed information about a specific domain, subscribers, applications, trunks, or DNIDs:

```bash
# Get domain information
cx-cli get --domain <domain>

# Get all subscribers in a domain
cx-cli get --domain <domain> --subscriber

# Get a specific subscriber
cx-cli get --domain <domain> --subscriber <subscriber-id>

# Get all applications in a domain
cx-cli get --domain <domain> --application

# Get a specific application
cx-cli get --domain <domain> --application <application-id>

# Get all trunks in a domain
cx-cli get --domain <domain> --trunk

# Get a specific trunk
cx-cli get --domain <domain> --trunk <trunk-id>

# Get all DNIDs in a domain
cx-cli get --domain <domain> --dnid

# Get a specific DNID
cx-cli get --domain <domain> --dnid <dnid-id>

# With debug mode enabled
cx-cli --debug get --domain <domain>
```

This will retrieve detailed information from the Cloudonix API and display it in a color-highlighted YAML format. The command can fetch domain information, subscriber information, application information, trunk information, or DNID information depending on the options provided.

Note: You cannot specify multiple resource options (--subscriber, --application, --trunk, --dnid) simultaneously.

### Get Call Session Information

To view detailed information about a specific call session:

```bash
# Get all session information
cx-cli call --domain <domain> --session <session-id>

# Get only the log object from the session
cx-cli call --domain <domain> --session <session-id> --log

# With debug mode enabled
cx-cli --debug call --domain <domain> --session <session-id>
```

This will retrieve detailed information about the specified call session and display it in YAML format with color highlighting, making it easy to read and process. 

Use the `--log` option to filter the output and show only the log information, which is useful when troubleshooting call issues.

## Configuration

The CLI stores your domain configurations in `~/.cx-cli/config.yaml`. Each domain is stored with its associated API key.

## Development

```bash
# Install dependencies
npm install

# Run locally
npm start
```