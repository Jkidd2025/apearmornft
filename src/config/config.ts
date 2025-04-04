import { clusterApiUrl } from '@solana/web3.js';

export const config = {
    // Network configuration
    network: process.env.NETWORK || 'mainnet-beta',
    endpoint: process.env.RPC_ENDPOINT || clusterApiUrl('mainnet-beta'),
    
    // Wallet configuration
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || '',
    
    // NFT configuration
    nftConfig: {
        name: process.env.NFT_NAME || 'My First NFT',
        symbol: process.env.NFT_SYMBOL || 'MFN',
        description: process.env.NFT_DESCRIPTION || 'This is my first NFT on Solana',
        sellerFeeBasisPoints: parseInt(process.env.SELLER_FEE_BASIS_POINTS || '500'),
        imageUrl: process.env.NFT_IMAGE_URL || '',
        metadataUrl: process.env.NFT_METADATA_URL || '',
    },
    
    // Optional custom RPC endpoint
    customRpcEndpoint: process.env.CUSTOM_RPC_ENDPOINT || '',
}; 