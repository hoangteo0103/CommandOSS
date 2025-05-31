#!/bin/bash

echo "🚀 Deploying Fixed Ticket System Smart Contract to Sui Testnet"
echo "=============================================================="

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI is not installed. Please install it first:"
    echo "   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "Move.toml" ]; then
    echo "❌ Move.toml not found. Please run this script from the contract/ticket_system directory."
    exit 1
fi

echo "📋 Current Sui configuration:"
sui client active-env
sui client active-address

echo ""
echo "💰 Checking wallet balance..."
BALANCE=$(sui client balance --with-coins)
echo "$BALANCE"

# Check if we have enough SUI
if echo "$BALANCE" | grep -q "0 SUI"; then
    echo "⚠️  Warning: Low SUI balance detected!"
    echo "💡 Get testnet SUI from: https://docs.sui.io/guides/developer/getting-started/get-coins"
    echo "💡 Or run: sui client faucet"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔨 Building and deploying contract..."

# Build and deploy the contract
DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 . 2>&1)
DEPLOY_EXIT_CODE=$?

echo "📄 Deployment output:"
echo "$DEPLOY_OUTPUT"

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Contract deployed successfully!"
    
    # Extract package ID from output
    PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | grep -o "Package ID: 0x[a-f0-9]*" | cut -d' ' -f3)
    
    if [ ! -z "$PACKAGE_ID" ]; then
        echo "📦 Package ID: $PACKAGE_ID"
        echo ""
        echo "🔧 To use this contract in your backend, update the .env file:"
        echo "   SUI_PACKAGE_ID=$PACKAGE_ID"
        echo ""
        echo "📋 Contract functions available:"
        echo "   • mint_ticket(event_id: u64, ticket_type: u8)"
        echo "   • use_ticket(ticket: &mut Ticket)"
        echo "   • transfer_ticket(ticket: Ticket, new_owner: address)"
        echo "   • Various getter functions for ticket properties"
        echo ""
        echo "🎉 Deployment complete! Your ticket system is ready to use."
    else
        echo "⚠️  Package ID not found in output. Please check the deployment logs above."
    fi
else
    echo ""
    echo "❌ Deployment failed! Please check the errors above."
    echo ""
    echo "🔍 Common issues and solutions:"
    echo "   • Insufficient gas: Increase gas budget"
    echo "   • Syntax errors: Check Move code for compilation errors"
    echo "   • Network issues: Try again or switch to a different RPC endpoint"
    echo "   • Low balance: Get more testnet SUI from the faucet"
    exit 1
fi 