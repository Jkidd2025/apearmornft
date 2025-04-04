import { Connection, Keypair } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';

// Load environment variables
dotenv.config();

async function uploadAssets() {
    try {
        // Initialize connection to Solana network
        const connection = new Connection(
            process.env.CUSTOM_RPC_ENDPOINT || process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com'
        );
        
        // Initialize Metaplex
        const metaplex = new Metaplex(connection);
        
        // Load wallet from Base58 private key
        const privateKeyBytes = bs58.decode(process.env.WALLET_PRIVATE_KEY || '');
        const wallet = Keypair.fromSecretKey(privateKeyBytes);
        
        // Set the identity for the Metaplex instance
        // @ts-ignore - Ignoring type error for Metaplex identity
        metaplex.use({ identity: wallet });
        
        console.log('Uploading NFT assets to Arweave...');
        
        // Read the image file
        const imagePath = path.join(__dirname, 'assets', 'nft-image.png');
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Upload the image to Arweave
        console.log('Uploading image...');
        const { uri: imageUri } = await metaplex
            .nfts()
            .uploadMetadata({
                name: process.env.NFT_NAME || 'My First NFT',
                symbol: process.env.NFT_SYMBOL || 'MFN',
                description: process.env.NFT_DESCRIPTION || 'This is my first NFT on Solana',
                sellerFeeBasisPoints: parseInt(process.env.SELLER_FEE_BASIS_POINTS || '500'),
                image: imageBuffer,
                attributes: [
                    {
                        trait_type: 'Background',
                        value: 'Blue'
                    },
                    {
                        trait_type: 'Rarity',
                        value: 'Rare'
                    }
                ],
                properties: {
                    files: [
                        {
                            uri: 'YOUR_IMAGE_URI', // This will be replaced with the actual URI
                            type: 'image/png'
                        }
                    ],
                    category: 'image',
                    creators: [
                        {
                            address: wallet.publicKey.toString(),
                            share: 100
                        }
                    ]
                }
            });
        
        console.log('Image uploaded successfully!');
        console.log('Image URI:', imageUri);
        
        // Update the .env file with the image URI
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
            `NFT_METADATA_URL="${imageUri}"`
        );
        
        fs.writeFileSync(envPath, envContent);
        
        console.log('.env file updated with the new URIs');
        console.log('\nYou can now mint your NFT using: npm run dev');
        
    } catch (error) {
        console.error('Error uploading assets:', error);
    }
}

// Execute the upload function
uploadAssets(); 