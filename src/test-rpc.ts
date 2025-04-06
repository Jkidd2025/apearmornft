import { Connection } from '@solana/web3.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRPCConnection(endpoint: string, name: string) {
    console.log(`\nTesting ${name}...`);
    console.log(`Endpoint: ${endpoint}`);
    
    try {
        const connection = new Connection(endpoint, 'confirmed');
        
        // Get current slot
        const slot = await connection.getSlot();
        console.log(`Current slot: ${slot}`);
        
        // Get current block time
        const blockTime = await connection.getBlockTime(slot);
        const date = new Date(blockTime! * 1000);
        console.log(`Current block time: ${date.toISOString()}`);
        
        // Get version
        const version = await connection.getVersion();
        console.log(`Solana version: ${version['solana-core']}`);
        
        console.log(`✅ ${name} is working properly!`);
        return true;
    } catch (error) {
        console.error(`❌ Error testing ${name}:`, error);
        return false;
    }
}

async function main() {
    console.log('Testing RPC Endpoints...\n');
    
    const defaultEndpoint = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const customEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
    
    const defaultWorking = await testRPCConnection(defaultEndpoint, 'Default RPC');
    const customWorking = customEndpoint ? await testRPCConnection(customEndpoint, 'Custom RPC') : false;
    
    console.log('\nSummary:');
    console.log(`Default RPC: ${defaultWorking ? '✅ Working' : '❌ Not working'}`);
    console.log(`Custom RPC: ${customWorking ? '✅ Working' : '❌ Not working'}`);
    
    if (!defaultWorking && !customWorking) {
        console.error('\n⚠️ Warning: Neither RPC endpoint is working!');
        process.exit(1);
    }
}

main(); 