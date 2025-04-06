import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Define types for metadata
interface Creator {
    address: string;
    share: number;
    verified: boolean;
}

interface NFTMetadata {
    name: string;
    symbol: string;
    description: string;
    seller_fee_basis_points: number;
    image: string;
    animation_url?: string;
    external_url: string;
    attributes: Array<{ trait_type: string; value: string }>;
    properties: {
        files: Array<{ uri: string; type: string; cdn?: boolean }>;
        category: string;
        creators: Creator[];
    };
    collection?: {
        name: string;
        family: string;
        image?: string;
    };
    uri?: string;
}

async function uploadMetadata() {
    try {
        // Use the Helius RPC endpoint
        const rpcEndpoint = process.env.RPC_ENDPOINT || process.env.CUSTOM_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        console.log(`Using RPC endpoint: ${rpcEndpoint}`);
        
        // Initialize connection
        const connection = new Connection(rpcEndpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 120000
        });
        
        // Load wallet
        const privateKeyBytes = bs58.decode(process.env.WALLET_PRIVATE_KEY || '');
        const wallet = Keypair.fromSecretKey(privateKeyBytes);
        
        // Initialize Metaplex
        const metaplex = new Metaplex(connection).use(keypairIdentity(wallet));
        
        console.log('Wallet address:', wallet.publicKey.toString());
        
        // Read metadata from file
        const nftsPath = path.join(__dirname, 'assets', 'collection', 'nfts.json');
        const nftsData = JSON.parse(fs.readFileSync(nftsPath, 'utf8')) as NFTMetadata[];
        
        // Create a new array to store the updated metadata
        const updatedMetadata: NFTMetadata[] = [];
        
        // Upload metadata for each NFT
        for (const metadata of nftsData) {
            console.log(`\nUploading metadata for ${metadata.name}...`);
            
            // Format metadata according to Metaplex standards
            const metadataUri = {
                name: metadata.name,
                symbol: metadata.symbol,
                description: metadata.description,
                seller_fee_basis_points: metadata.seller_fee_basis_points,
                image: metadata.image,
                external_url: metadata.external_url,
                attributes: metadata.attributes,
                properties: {
                    files: [{
                        uri: metadata.image,
                        type: "image/png"
                    }],
                    category: "image",
                    creators: [{
                        address: wallet.publicKey.toString(),
                        share: 100
                    }]
                },
                collection: {
                    name: metadata.collection?.name || "ApeArmor NFT DAO Collection",
                    family: metadata.collection?.family || "ApeArmor DAO",
                    image: metadata.collection?.image || metadata.image
                }
            };
            
            // Upload to Arweave
            const { uri } = await metaplex.nfts().uploadMetadata(metadataUri);
            console.log(`Metadata uploaded for ${metadata.name}:`, uri);
            
            // Create a new metadata object with the URI
            updatedMetadata.push({
                ...metadata,
                uri: uri
            });
        }
        
        // Save the updated metadata with URIs
        fs.writeFileSync(nftsPath, JSON.stringify(updatedMetadata, null, 2));
        console.log('\nAll metadata uploaded successfully! 🎉');
        
    } catch (error) {
        console.error('Error uploading metadata:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        process.exit(1);
    }
}

// Execute the upload function
uploadMetadata(); 