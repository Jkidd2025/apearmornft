import { clusterApiUrl } from '@solana/web3.js';

export const config = {
    // Network configuration
    network: process.env.NETWORK || 'mainnet-beta',
    endpoint: process.env.RPC_ENDPOINT || clusterApiUrl('mainnet-beta'),
    
    // Wallet configuration
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || '',
    
    // NFT configuration
    nftConfig: {
        name: process.env.NFT_NAME || 'ApeArmor original logo',
        symbol: process.env.NFT_SYMBOL || 'APE-Silver',
        description: process.env.NFT_DESCRIPTION || 'ApeArmor original logo with beige background with green sheild brown and white ape wearing body armor and facing to the right',
        sellerFeeBasisPoints: parseInt(process.env.SELLER_FEE_BASIS_POINTS || '500'),
        imageUrl: process.env.NFT_IMAGE_URL || 'https://arweave.net/A-V3AL6KUuW3BuA9YbSaEWWur64sli4vACR5aKLhXpE',
        metadataUrl: process.env.NFT_METADATA_URL || 'https://arweave.net/87fHNO3FiMFRc9YYS-sJ91vg5EndBlZsyhlGaV5G6XE',
        attributes: [
            {
                trait_type: 'Background',
                value: 'Beige'
            },
            {
                trait_type: 'Armor',
                value: 'Green Shield'
            },
            {
                trait_type: 'Ape',
                value: 'Brown and White'
            },
            {
                trait_type: 'Rarity',
                value: 'Rare'
            }
        ],
        properties: {
            files: [
                {
                    uri: process.env.NFT_IMAGE_URL || 'https://arweave.net/A-V3AL6KUuW3BuA9YbSaEWWur64sli4vACR5aKLhXpE',
                    type: 'image/png'
                }
            ],
            category: 'image',
            creators: [
                {
                    address: process.env.WALLET_ADDRESS || '',
                    share: 100
                }
            ]
        }
    },
    
    // Optional custom RPC endpoint
    customRpcEndpoint: process.env.CUSTOM_RPC_ENDPOINT || 'https://mainnet.helius-rpc.com/?api-key=ddfb0573-3e2f-4f26-9331-ee493de86063',
}; 