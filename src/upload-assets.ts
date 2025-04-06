import { Connection, Keypair } from '@solana/web3.js';
import { 
    Metaplex, 
    keypairIdentity, 
    MetaplexFile,
    StorageDriver,
    toMetaplexFile
} from '@metaplex-foundation/js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';

// Load environment variables
dotenv.config();

async function uploadImage(metaplex: Metaplex, imagePath: string, imageName: string): Promise<string> {
    console.log(`Uploading ${imageName}...`);
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`${imageName} size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    const file = toMetaplexFile(imageBuffer, imageName);
    const imageUri = await metaplex.storage().upload(file);
    console.log(`${imageName} uploaded successfully!`);
    console.log('Image URI:', imageUri);
    return imageUri;
}

async function uploadAssets() {
    try {
        // Use the Helius RPC endpoint
        const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT || process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        console.log(`Using RPC endpoint: ${rpcEndpoint}`);
        
        // Initialize connection to Solana mainnet with better timeout
        const connection = new Connection(rpcEndpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 300000, // 5 minutes
        });
        
        // Load wallet from Base58 private key
        const privateKeyBytes = bs58.decode(process.env.WALLET_PRIVATE_KEY || '');
        const wallet = Keypair.fromSecretKey(privateKeyBytes);
        
        // Initialize Metaplex with the wallet
        const metaplex = Metaplex.make(connection)
            .use(keypairIdentity(wallet));
        
        // Configure storage
        const storage = metaplex.storage().driver() as StorageDriver;
        
        console.log('Wallet address:', wallet.publicKey.toString());
        
        // Check wallet balance
        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`Current balance: ${balance / 1e9} SOL`);
        
        // We need at least 0.5 SOL for Arweave storage fees (multiple images)
        if (balance < 0.5 * 1e9) {
            throw new Error(`Insufficient balance. Please fund your wallet with at least 0.5 SOL for storage fees. Current balance: ${balance / 1e9} SOL`);
        }
        
        console.log('Uploading NFT assets to Arweave...');
        
        const collectionDir = path.join(__dirname, 'assets', 'collection');
        const nftsData = JSON.parse(fs.readFileSync(path.join(collectionDir, 'nfts.json'), 'utf8'));
        
        // Upload collection image first
        const collectionImageUri = await uploadImage(
            metaplex,
            path.join(collectionDir, 'collection.png'),
            'collection.png'
        );
        
        // Upload individual NFT images and update metadata
        for (const nft of nftsData) {
            const imageUri = await uploadImage(
                metaplex,
                path.join(collectionDir, nft.imageName),
                nft.imageName
            );
            
            // Update the NFT's metadata with Arweave URLs
            nft.image = imageUri;
            nft.properties.files[0].uri = imageUri;
            nft.collection.image = collectionImageUri;
        }
        
        // Save the updated metadata
        fs.writeFileSync(
            path.join(collectionDir, 'nfts.json'),
            JSON.stringify(nftsData, null, 2)
        );
        
        console.log('\nAll assets uploaded successfully!');
        console.log('Collection image:', collectionImageUri);
        console.log('\nMetadata has been updated with Arweave URLs');
        console.log('You can now proceed with minting your NFTs');
        
    } catch (error) {
        console.error('Error uploading assets:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            
            if (error.message.includes('Insufficient balance')) {
                console.log('\nTo proceed:');
                console.log('1. Send at least 0.5 SOL to your wallet address shown above');
                console.log('2. Wait for the transaction to confirm');
                console.log('3. Run this script again');
            }
        }
        process.exit(1);
    }
}

// Execute the upload function
uploadAssets(); 