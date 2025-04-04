import { Connection, Keypair } from '@solana/web3.js';
import { bundlrStorage, keypairIdentity, Metaplex, toMetaplexFile } from '@metaplex-foundation/js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';

// Load environment variables
dotenv.config();

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
        
        // Initialize Metaplex with the wallet and Bundlr storage
        const metaplex = Metaplex.make(connection)
            .use(keypairIdentity(wallet))
            .use(bundlrStorage({
                address: 'https://node1.bundlr.network',
                providerUrl: rpcEndpoint,
                timeout: 60000,
            }));
        
        console.log('Wallet address:', wallet.publicKey.toString());
        
        // Check wallet balance
        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`Current balance: ${balance / 1e9} SOL`);
        
        // We need at least 0.1 SOL for Arweave storage fees
        if (balance < 0.1 * 1e9) {
            throw new Error(`Insufficient balance. Please fund your wallet with at least 0.1 SOL for storage fees. Current balance: ${balance / 1e9} SOL`);
        }
        
        console.log('Uploading NFT assets to Arweave...');
        
        // Read the image file
        const imagePath = path.join(__dirname, 'assets', 'nft-image.png');
        
        // Check if image exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found at ${imagePath}. Please add your NFT image as 'nft-image.png' in the src/assets directory.`);
        }
        
        const imageBuffer = fs.readFileSync(imagePath);
        console.log(`Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Convert buffer to MetaplexFile
        const file = toMetaplexFile(imageBuffer, 'nft-image.png');
        
        // First, upload the image to Arweave
        console.log('Uploading image to Arweave (this may take several minutes)...');
        console.log('Please be patient as Arweave uploads can take 5-10 minutes depending on file size and network conditions.');
        
        // Upload the image
        const imageUri = await metaplex.storage().upload(file);
        console.log('Image uploaded successfully!');
        console.log('Image URI:', imageUri);
        
        // Read and update the metadata JSON
        const metadataPath = path.join(__dirname, 'assets', 'metadata.json');
        let metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // Update the metadata with the new image URI
        metadata.image = imageUri;
        metadata.properties.files[0].uri = imageUri;
        metadata.properties.creators[0].address = wallet.publicKey.toString();
        
        // Write the updated metadata back to the file
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        // Convert the metadata to a MetaplexFile
        const metadataFile = toMetaplexFile(
            Buffer.from(JSON.stringify(metadata)),
            'metadata.json'
        );
        
        // Upload the metadata to Arweave
        console.log('Uploading metadata to Arweave...');
        const metadataUri = await metaplex.storage().upload(metadataFile);
        
        console.log('Metadata uploaded successfully!');
        console.log('Metadata URI:', metadataUri);
        
        // Update the .env file with the image and metadata URIs
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Replace the NFT_IMAGE_URL line
        envContent = envContent.replace(
            /NFT_IMAGE_URL=.*/,
            `NFT_IMAGE_URL="${imageUri}"`
        );
        
        // Replace the NFT_METADATA_URL line
        envContent = envContent.replace(
            /NFT_METADATA_URL=.*/,
            `NFT_METADATA_URL="${metadataUri}"`
        );
        
        fs.writeFileSync(envPath, envContent);
        
        console.log('.env file updated with the new URIs');
        console.log('\nYou can now mint your NFT using: npm run dev');
        
    } catch (error) {
        console.error('Error uploading assets:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            
            if (error.message.includes('Insufficient balance')) {
                console.log('\nTo proceed:');
                console.log('1. Send at least 0.1 SOL to your wallet address shown above');
                console.log('2. Wait for the transaction to confirm');
                console.log('3. Run this script again');
            }
        }
        process.exit(1);
    }
}

// Execute the upload function
uploadAssets(); 