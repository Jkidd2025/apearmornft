import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
    Metaplex,
    keypairIdentity,
    CreateNftInput,
    NftWithToken,
} from '@metaplex-foundation/js';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Define NFT price tiers (in SOL)
type NFTName = 'ApeArmor Chimp' | 'Guardian Gorilla' | 'Sentinel Silverback';
const NFT_SELLING_PRICES: Record<NFTName, number> = {
    'ApeArmor Chimp': 1.5,      // 1.5 SOL for Basic tier
    'Guardian Gorilla': 20.0,    // 20.0 SOL for Advanced tier
    'Sentinel Silverback': 50.0  // 50.0 SOL for Legendary tier
};

// Minting costs (in lamports)
const MINTING_COST_PER_NFT = 0.001; // 0.001 SOL per NFT for minting
const COLLECTION_MINTING_COST = 0.002; // 0.002 SOL for collection NFT
const TRANSACTION_FEE = 0.000005; // 0.000005 SOL per transaction

// Define types for metadata
interface Creator {
    address: string;
    share: number;
    verified: boolean;
}

interface NFTMetadata {
    name: NFTName;  // Update to use our NFTName type
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

async function verifyMetadata(uri: string): Promise<boolean> {
    try {
        const response = await fetch(uri);
        if (!response.ok) {
            console.log('Metadata not yet available, waiting...');
            return false;
        }
        const metadata = await response.json() as NFTMetadata;
        return metadata.name && metadata.image ? true : false;
    } catch (error) {
        console.log('Error verifying metadata:', error);
        return false;
    }
}

async function mintCollectionNFT(metaplex: Metaplex, wallet: Keypair, metadata: NFTMetadata): Promise<PublicKey> {
    console.log('\nMinting Collection NFT...');
    
    // Create collection metadata
    const collectionMetadata = {
        name: metadata.collection!.name,
        symbol: metadata.symbol,
        description: `Collection NFT for ${metadata.collection!.name}`,
        image: metadata.collection!.image,
        external_url: metadata.external_url,
        seller_fee_basis_points: metadata.seller_fee_basis_points,
        properties: {
            files: [{
                uri: metadata.collection!.image!,
                type: "image/png"
            }],
            category: "image",
            creators: [{
                address: wallet.publicKey.toString(),
                share: 100
            }]
        }
    };
    
    // Upload collection metadata
    console.log('Uploading collection metadata...');
    const { uri } = await metaplex.nfts().uploadMetadata(collectionMetadata);
    console.log('Collection metadata uploaded:', uri);
    
    // Add retry logic for collection NFT creation
    let retries = 3;
    let lastError: Error | null = null;
    
    while (retries > 0) {
        try {
            console.log(`Attempting to create collection NFT (${retries} retries left)...`);
            
            const { nft } = await metaplex.nfts().create({
                name: metadata.collection!.name,
                symbol: metadata.symbol,
                sellerFeeBasisPoints: metadata.seller_fee_basis_points,
                uri: uri,
                isCollection: true,
                creators: [{
                    address: wallet.publicKey,
                    share: 100
                }],
                isMutable: true,
                tokenStandard: 0, // NonFungible
                updateAuthority: wallet
            });
            
            console.log('Collection NFT created:', nft.address.toString());
            return nft.address;
        } catch (error) {
            lastError = error as Error;
            console.log(`Error creating collection NFT: ${lastError.message}`);
            retries--;
            
            if (retries > 0) {
                console.log(`Waiting 5 seconds before retrying...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    
    throw new Error(`Failed to create collection NFT after multiple attempts: ${lastError?.message}`);
}

async function mintNFT(metaplex: Metaplex, wallet: Keypair, metadata: NFTMetadata, collectionMint: PublicKey) {
    const sellingPrice = NFT_SELLING_PRICES[metadata.name];
    console.log(`\nMinting ${metadata.name} (Will be listed for: ${sellingPrice} SOL)...`);
    
    if (!metadata.uri) {
        throw new Error(`No metadata URI found for ${metadata.name}`);
    }
    
    // Add retry logic for NFT creation
    let retries = 3;
    let lastError: Error | null = null;
    
    while (retries > 0) {
        try {
            console.log(`Attempting to create NFT (${retries} retries left)...`);
            
            // Create the NFT using the existing metadata URI
            const { nft } = await metaplex.nfts().create({
                name: metadata.name,
                symbol: metadata.symbol,
                sellerFeeBasisPoints: metadata.seller_fee_basis_points,
                uri: metadata.uri, // Use the existing Arweave URI
                creators: metadata.properties.creators.map(creator => ({
                    address: new PublicKey(creator.address),
                    share: creator.share,
                    verified: true
                })),
                isMutable: true,
                collection: collectionMint,
                collectionAuthority: wallet,
                tokenStandard: 0, // NonFungible
                updateAuthority: wallet
            });

            console.log('NFT created:', nft.address.toString());
            console.log(`NFT will be listed for ${sellingPrice} SOL`);
            
            return nft;
        } catch (error) {
            lastError = error as Error;
            console.log(`Error creating NFT: ${lastError.message}`);
            retries--;
            
            if (retries > 0) {
                console.log(`Waiting 5 seconds before retrying...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    
    throw new Error(`Failed to create NFT for ${metadata.name} after multiple attempts: ${lastError?.message}`);
}

async function mintCollection() {
    try {
        // Use the Helius RPC endpoint as primary
        const rpcEndpoint = process.env.RPC_ENDPOINT || process.env.CUSTOM_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        console.log(`Using RPC endpoint: ${rpcEndpoint}`);
        
        // Initialize connection to Solana network with better timeout
        const connection = new Connection(rpcEndpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 120000 // 2 minutes
        });
        
        // Load wallet from Base58 private key
        const privateKeyBytes = bs58.decode(process.env.WALLET_PRIVATE_KEY || '');
        const wallet = Keypair.fromSecretKey(privateKeyBytes);
        
        // Initialize Metaplex with the wallet
        const metaplex = new Metaplex(connection).use(keypairIdentity(wallet));
        
        console.log('Wallet address:', wallet.publicKey.toString());
        
        // Check wallet balance
        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`Current balance: ${balance / 1e9} SOL`);
        
        // Calculate total required SOL for minting
        const totalNFTs = 3; // Number of NFTs to mint
        const totalMintingCost = (MINTING_COST_PER_NFT * totalNFTs) + COLLECTION_MINTING_COST + (TRANSACTION_FEE * (totalNFTs + 1));
        const requiredBalance = totalMintingCost + 0.01; // Add 0.01 SOL buffer
        
        if (balance < requiredBalance * LAMPORTS_PER_SOL) {
            throw new Error(`Insufficient balance. Please fund your wallet with at least ${requiredBalance} SOL for minting costs. Current balance: ${balance / 1e9} SOL`);
        }
        
        // Read metadata from the local file
        const nftsPath = path.join(__dirname, 'assets', 'collection', 'nfts.json');
        const nftsData = JSON.parse(fs.readFileSync(nftsPath, 'utf8')) as NFTMetadata[];
        
        // First, create the collection NFT
        console.log('Starting collection NFT minting process...');
        const collectionMint = await mintCollectionNFT(metaplex, wallet, nftsData[0]);
        console.log('Collection NFT minted successfully:', collectionMint.toString());
        
        // Then mint each NFT in the collection
        for (const metadata of nftsData) {
            const nft = await mintNFT(metaplex, wallet, metadata, collectionMint);
            
            // Verify the creators
            console.log('Verifying creators...');
            await metaplex.nfts().verifyCreator({ 
                mintAddress: nft.address,
                creator: wallet
            });
            
            // Verify the collection
            console.log('Verifying collection...');
            await metaplex.nfts().verifyCollection({
                mintAddress: nft.address,
                collectionMintAddress: collectionMint,
                collectionAuthority: wallet,
            });
            
            console.log(`\nYou can view ${metadata.name} on:`);
            console.log(`https://solscan.io/token/${nft.address.toString()}`);
            console.log(`https://xray.helius.xyz/token/${nft.address.toString()}`);
        }
        
        console.log('\nAll NFTs minted successfully! 🎉');
        console.log('Collection address:', collectionMint.toString());
        
    } catch (error) {
        console.error('Error minting NFTs:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            
            if (error.message.includes('Insufficient balance')) {
                console.log('\nTo proceed:');
                console.log('1. Send the required SOL amount to your wallet address shown above');
                console.log('2. Wait for the transaction to confirm');
                console.log('3. Run this script again');
            }
        }
        process.exit(1);
    }
}

// Execute the minting function
mintCollection(); 