import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// NFT Configuration
const NFT_CONFIG = {
    'ApeArmor Chimp': {
        address: 'YPTHLRGpN7CDc4cP2oYmhsKyvZniun2fgVR9edrekHr',
        price: 1.5 // SOL
    },
    'Guardian Gorilla': {
        address: 'HdQ4oBVfmdq14aknv6WeNkirkd9VereH3Rvex3HHb68v',
        price: 20.0 // SOL
    },
    'Sentinel Silverback': {
        address: 'AC2JQW9qYTao3wAHxPfrs2cKMpiLq3T7L997Tnqq3cTZ',
        price: 50.0 // SOL
    }
};

const MAGIC_EDEN_API = 'https://api-mainnet.magiceden.dev/v2';

async function listNFTOnMagicEden(
    nftName: string,
    mintAddress: string,
    priceInSOL: number,
    wallet: Keypair
) {
    try {
        console.log(`\nPreparing to list ${nftName} for ${priceInSOL} SOL...`);
        
        // 1. Get NFT metadata
        const rpcEndpoint = process.env.RPC_ENDPOINT || process.env.CUSTOM_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(rpcEndpoint, 'confirmed');
        const metaplex = new Metaplex(connection);
        
        const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(mintAddress) });
        
        if (!nft) {
            throw new Error(`NFT not found: ${mintAddress}`);
        }
        
        // 2. Prepare listing data
        const listingData = {
            mintAddress: mintAddress,
            price: priceInSOL,
            sellerWallet: wallet.publicKey.toString(),
            collection: nft.collection?.address.toString()
        };
        
        // 3. Get listing instructions from Magic Eden
        const response = await fetch(`${MAGIC_EDEN_API}/instructions/list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(listingData)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get listing instructions: ${response.statusText}`);
        }
        
        const instructions = await response.json();
        
        // 4. Create and sign transaction
        const transaction = Transaction.from(instructions.tx);
        transaction.sign(wallet);
        
        // 5. Send transaction
        const signature = await connection.sendRawTransaction(transaction.serialize());
        
        // 6. Confirm transaction
        const confirmation = await connection.confirmTransaction(signature);
        
        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }
        
        console.log(`✅ Successfully listed ${nftName} for ${priceInSOL} SOL`);
        console.log(`Transaction signature: ${signature}`);
        console.log(`View on Magic Eden: https://magiceden.io/item-details/${mintAddress}`);
        
    } catch (error) {
        console.error(`Error listing ${nftName}:`, error);
    }
}

async function listAllNFTs() {
    try {
        // Load wallet
        if (!process.env.WALLET_PRIVATE_KEY) {
            throw new Error('Wallet private key not found in environment variables');
        }
        
        const privateKeyBytes = Buffer.from(process.env.WALLET_PRIVATE_KEY, 'base58');
        const wallet = Keypair.fromSecretKey(privateKeyBytes);
        
        console.log('Starting NFT listing process...');
        console.log('Wallet address:', wallet.publicKey.toString());
        
        // List each NFT
        for (const [name, config] of Object.entries(NFT_CONFIG)) {
            await listNFTOnMagicEden(name, config.address, config.price, wallet);
        }
        
        console.log('\nAll listing attempts completed!');
        console.log('Please check Magic Eden to verify your listings.');
        console.log('View your items: https://magiceden.io/profile');
        
    } catch (error) {
        console.error('Error in listing process:', error);
    }
}

// Execute the listing
listAllNFTs(); 