import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Metaplex, keypairIdentity, CreateNftInput } from '@metaplex-foundation/js';
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
}

interface NFTMetadata {
    name: string;
    symbol: string;
    description: string;
    seller_fee_basis_points: number;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
    properties: {
        files: Array<{ uri: string; type: string }>;
        category: string;
        creators: Creator[];
    };
}

async function mintNFT() {
    try {
        // Use the Helius RPC endpoint
        const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT || process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
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
        
        // We need at least 0.05 SOL for minting
        if (balance < 0.05 * 1e9) {
            throw new Error(`Insufficient balance. Please fund your wallet with at least 0.05 SOL for minting. Current balance: ${balance / 1e9} SOL`);
        }
        
        // Read metadata from the local file
        const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as NFTMetadata;
        
        console.log('Minting NFT...');
        console.log('This may take a few minutes. Please be patient.');
        
        // Create NFT using the metadata
        const { nft } = await metaplex.nfts().create({
            name: metadata.name,
            symbol: metadata.symbol,
            sellerFeeBasisPoints: metadata.seller_fee_basis_points,
            uri: process.env.NFT_METADATA_URL!,
            creators: metadata.properties.creators.map(creator => ({
                address: new PublicKey(creator.address),
                share: creator.share,
                verified: false
            })),
            isMutable: true,
            maxSupply: 1
        });
            
        console.log('\nNFT created successfully! 🎉');
        console.log('Mint address:', nft.address.toString());
        console.log('\nYou can view your NFT on:');
        console.log(`https://solscan.io/token/${nft.address.toString()}`);
        console.log(`https://xray.helius.xyz/token/${nft.address.toString()}`);
        
        // Wait a few seconds before verifying the NFT
        console.log('\nWaiting for NFT to be confirmed...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify the NFT was created correctly
        const mintNFT = await metaplex.nfts().findByMint({ mintAddress: nft.address });
        console.log('\nNFT Verification:');
        console.log('Name:', mintNFT.name);
        console.log('Symbol:', mintNFT.symbol);
        console.log('URI:', mintNFT.uri);
        console.log('Seller Fee Basis Points:', mintNFT.sellerFeeBasisPoints);
        console.log('Is Mutable:', mintNFT.isMutable);
        
    } catch (error) {
        console.error('Error minting NFT:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            
            if (error.message.includes('Insufficient balance')) {
                console.log('\nTo proceed:');
                console.log('1. Send at least 0.05 SOL to your wallet address shown above');
                console.log('2. Wait for the transaction to confirm');
                console.log('3. Run this script again');
            }
        }
        process.exit(1);
    }
}

// Execute the minting function
mintNFT(); 