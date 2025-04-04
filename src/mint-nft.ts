import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { config } from './config/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function mintNFT() {
    try {
        // Initialize connection to Solana network
        const connection = new Connection(
            config.customRpcEndpoint || config.endpoint
        );
        
        // Initialize Metaplex
        const metaplex = new Metaplex(connection);
        
        // Load wallet
        const wallet = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(config.walletPrivateKey))
        );
        
        // Set the identity for the Metaplex instance
        // @ts-ignore - Ignoring type error for Metaplex identity
        metaplex.use({ identity: wallet });
        
        // Get NFT configuration
        const { nftConfig } = config;
        
        // Mint NFT
        const { nft } = await metaplex
            .nfts()
            .create({
                uri: nftConfig.metadataUrl,
                name: nftConfig.name,
                symbol: nftConfig.symbol,
                sellerFeeBasisPoints: nftConfig.sellerFeeBasisPoints,
            });
            
        console.log("NFT created successfully!");
        console.log("Mint address:", nft.address.toString());
        
    } catch (error) {
        console.error("Error minting NFT:", error);
    }
}

// Execute the minting function
mintNFT(); 