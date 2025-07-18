#!/bin/bash

# Install necessary dependencies if not already installed
echo "Installing dependencies..."
npm install @mentra/sdk @supabase/supabase-js express dotenv
npm install -D typescript @types/node @types/express ts-node

# Run the Mentra integration server
echo "Starting Mentra integration server..."
npx ts-node mentra-integration-simplified.ts
