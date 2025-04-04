import { clusterApiUrl } from '@solana/web3.js';

export const config = {
    // Use 'devnet' for development, 'mainnet-beta' for production
    network: 'devnet',
    endpoint: clusterApiUrl('devnet'),
    // Add your wallet private key here (NEVER commit this to version control)
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || '',
    // Add your RPC endpoint here (optional, will use public endpoint if not provided)
    rpcEndpoint: process.env.RPC_ENDPOINT || '',
}; 