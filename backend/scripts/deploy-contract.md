# Sui Smart Contract Deployment Guide

This guide will help you deploy the ticket_system smart contract to Sui testnet and integrate it with the backend.

## Prerequisites

1. Install Sui CLI:

```bash
# Install Sui CLI (macOS/Linux)
curl -fLsS https://sui-releases.s3.us-east-1.amazonaws.com/install.sh | bash

# Or using Homebrew (macOS)
brew install sui
```

2. Initialize Sui client:

```bash
sui client
# Follow the prompts to set up your client
```

3. Switch to testnet:

```bash
sui client switch --env testnet
```

4. Generate a new address and get testnet SUI:

```bash
# Generate new address
sui client new-address ed25519

# Get your address
sui client active-address

# Fund with testnet SUI
sui client faucet
```

## Deployment Steps

1. Navigate to the contract directory:

```bash
cd contract/ticket_system
```

2. Build the contract:

```bash
sui move build
```

3. Deploy the contract:

```bash
sui client publish --gas-budget 20000000
```

4. Copy the Package ID from the deployment output and add it to your .env file:

```bash
# In backend/.env
SUI_PACKAGE_ID=0x1234...your_package_id_here
```

5. Optionally, export your private key to the .env file:

```bash
# Get your private key
sui keytool list

# Add to backend/.env (replace with your actual key)
SUI_PRIVATE_KEY=your_base64_private_key_here
```

## Testing the Integration

1. Start the backend server:

```bash
cd backend
npm start
```

2. Watch the logs for wallet information and funding instructions.

3. Test ticket minting through the API or the BookingExample component.

## Contract Functions Available

- `mint_ticket(event_id: u64, ticket_type: u8)` - Mint a new ticket
- `use_ticket(ticket: &mut Ticket)` - Mark a ticket as used
- `get_ticket_info(ticket: &Ticket)` - Get ticket information

## Environment Variables

```bash
# Sui Configuration
SUI_PRIVATE_KEY=your_base64_private_key_here
SUI_PACKAGE_ID=0x1234...your_package_id_here
SUI_NETWORK=testnet
```

## Troubleshooting

1. **Insufficient gas**: Increase the gas budget in deployment
2. **No SUI coins**: Request more from the faucet
3. **Package not found**: Check the package ID is correct
4. **Permission denied**: Ensure you own the ticket when trying to use it

## Next Steps

- Set up automated faucet funding for development
- Deploy to mainnet for production
- Implement additional contract features (transfers, metadata, etc.)
- Add frontend wallet integration for direct user interactions
