import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';

// Load environment variables
dotenv.config();

async function checkBalance() {
    try {
        // Use the Helius RPC endpoint
        const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT || process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        console.log(`Using RPC endpoint: ${rpcEndpoint}`);
        
        // Initialize connection to Solana network
        const connection = new Connection(rpcEndpoint, 'confirmed');
        
        // Load wallet from Base58 private key
        const privateKeyBytes = bs58.decode(process.env.WALLET_PRIVATE_KEY || '');
        const wallet = Keypair.fromSecretKey(privateKeyBytes);
        
        console.log('\nWallet Details:');
        console.log('Address:', wallet.publicKey.toString());
        
        // Get and display balance
        const balance = await connection.getBalance(wallet.publicKey);
        console.log('Current balance:', (balance / LAMPORTS_PER_SOL).toFixed(6), 'SOL');
        
        // Calculate minimum required balance
        const minRequired = 0.1; // SOL
        if (balance < minRequired * LAMPORTS_PER_SOL) {
            console.log('\n⚠️  Warning: Insufficient balance!');
            console.log(`You need at least ${minRequired} SOL for NFT operations.`);
            console.log(`Please send ${(minRequired - balance / LAMPORTS_PER_SOL).toFixed(6)} more SOL to continue.`);
        } else {
            console.log('\n✅ Balance is sufficient for NFT operations');
        }
        
        // Get recent transactions
        console.log('\nFetching recent transactions...');
        const signatures = await connection.getSignaturesForAddress(wallet.publicKey, { limit: 5 });
        
        if (signatures.length > 0) {
            console.log('\nRecent transactions:');
            for (const sig of signatures) {
                const tx = await connection.getTransaction(sig.signature, {
                    maxSupportedTransactionVersion: 0
                });
                console.log(`\nTransaction: ${sig.signature}`);
                console.log(`Status: ${sig.confirmationStatus}`);
                console.log(`Time: ${new Date(sig.blockTime! * 1000).toLocaleString()}`);
                console.log(`Change: ${tx?.meta?.postBalances[0] ? ((tx.meta.postBalances[0] - tx.meta.preBalances[0]) / LAMPORTS_PER_SOL).toFixed(6) : 'Unknown'} SOL`);
            }
        } else {
            console.log('No recent transactions found');
        }
        
    } catch (error) {
        console.error('Error checking balance:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        process.exit(1);
    }
}

// Execute the check
checkBalance(); 