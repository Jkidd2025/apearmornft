import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';

// Load environment variables
dotenv.config();

async function transferNFT(recipientAddress: string, mintAddress: string) {
    try {
        // Use the Helius RPC endpoint
        const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT || process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        console.log(`Using RPC endpoint: ${rpcEndpoint}`);
        
        // Initialize connection to Solana network
        const connection = new Connection(rpcEndpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 120000 // 2 minutes
        });
        
        // Load wallet from Base58 private key
        const privateKeyBytes = bs58.decode(process.env.WALLET_PRIVATE_KEY || '');
        const wallet = Keypair.fromSecretKey(privateKeyBytes);
        
        // Initialize Metaplex
        const metaplex = new Metaplex(connection).use(keypairIdentity(wallet));
        
        console.log('Sender wallet:', wallet.publicKey.toString());
        console.log('Recipient wallet:', recipientAddress);
        console.log('NFT mint address:', mintAddress);
        
        // Get the NFT
        const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(mintAddress) });
        
        console.log('\nTransferring NFT...');
        
        // Transfer the NFT
        const { response } = await metaplex.nfts().transfer({
            nftOrSft: nft,
            fromOwner: wallet.publicKey,
            toOwner: new PublicKey(recipientAddress),
        });
        
        console.log('\nNFT transferred successfully! 🎉');
        console.log('Transaction signature:', response.signature);
        console.log('\nYou can view the transaction on:');
        console.log(`https://solscan.io/tx/${response.signature}`);
        
    } catch (error) {
        console.error('Error transferring NFT:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        process.exit(1);
    }
}

// Check if recipient address is provided
if (process.argv.length < 3) {
    console.error('Please provide your Phantom wallet address as an argument');
    console.error('Usage: npx ts-node src/transfer-nft.ts <PHANTOM_WALLET_ADDRESS>');
    process.exit(1);
}

// Get the recipient address from command line argument
const recipientAddress = process.argv[2];
// NFT mint address from our previous minting
const mintAddress = 'AFEFdFCDqia6yXyxFmdUvD97a6WxNHqK6tUZxijxL2tw';

// Execute the transfer
transferNFT(recipientAddress, mintAddress); 