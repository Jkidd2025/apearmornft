import { Connection, clusterApiUrl } from '@solana/web3.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkConnection() {
    try {
        // Get the Helius RPC endpoint from environment variables
        const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT || process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        console.log(`Checking connection to: ${rpcEndpoint}`);
        
        // Initialize connection with better timeout
        const connection = new Connection(rpcEndpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        });
        
        // Get the current slot to test the connection
        console.log('Fetching current slot...');
        const slot = await connection.getSlot();
        console.log(`Current slot: ${slot}`);
        
        // Get the current block time
        console.log('Fetching current block time...');
        const blockTime = await connection.getBlockTime(slot);
        console.log(`Current block time: ${new Date(blockTime! * 1000).toISOString()}`);
        
        // Get the current epoch info
        console.log('Fetching epoch info...');
        const epochInfo = await connection.getEpochInfo();
        console.log(`Current epoch: ${epochInfo.epoch}`);
        console.log(`Slot index: ${epochInfo.slotIndex}`);
        console.log(`Slots in epoch: ${epochInfo.slotsInEpoch}`);
        
        // Get the current version
        console.log('Fetching version info...');
        const version = await connection.getVersion();
        console.log(`Solana version: ${version['solana-core']}`);
        
        console.log('\nConnection test successful! The RPC endpoint is working properly.');
        
    } catch (error) {
        console.error('Error checking connection:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            
            if (error.message.includes('failed to fetch')) {
                console.log('\nPossible issues:');
                console.log('1. The RPC endpoint might be down or unreachable');
                console.log('2. Your internet connection might be having issues');
                console.log('3. The endpoint might be rate-limiting your requests');
                console.log('4. The API key might be invalid or expired');
                
                console.log('\nSuggestions:');
                console.log('1. Check if your Helius API key is valid');
                console.log('2. Try using a different RPC endpoint');
                console.log('3. Check your internet connection');
            }
        }
        process.exit(1);
    }
}

// Execute the check
checkConnection(); 