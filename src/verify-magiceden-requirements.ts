import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import * as dotenv from 'dotenv';

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

async function verifyNFTRequirements() {
    try {
        // Initialize connection
        const rpcEndpoint = process.env.RPC_ENDPOINT || process.env.CUSTOM_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(rpcEndpoint, 'confirmed');
        const metaplex = new Metaplex(connection);
        
        console.log('Verifying NFTs meet Magic Eden requirements...\n');
        
        for (const [name, config] of Object.entries(NFT_CONFIG)) {
            console.log(`Checking ${name}...`);
            console.log(`Address: ${config.address}`);
            
            try {
                // Get NFT data
                const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(config.address) });
                
                // Check requirements
                const checks = {
                    hasMetadata: Boolean(nft.json),
                    hasName: Boolean(nft.json?.name),
                    hasSymbol: Boolean(nft.json?.symbol),
                    hasDescription: Boolean(nft.json?.description),
                    hasImage: Boolean(nft.json?.image),
                    hasAttributes: Array.isArray(nft.json?.attributes) && nft.json.attributes.length > 0,
                    isVerifiedCollection: Boolean(nft.collection?.verified),
                    hasSellerFeeBasisPoints: nft.sellerFeeBasisPoints !== undefined,
                    isMutable: nft.isMutable
                };
                
                // Log results
                console.log('\nRequirement checks:');
                Object.entries(checks).forEach(([check, passed]) => {
                    console.log(`${passed ? '✅' : '❌'} ${check}`);
                });
                
                // Additional details
                if (nft.json) {
                    console.log('\nMetadata details:');
                    console.log(`Name: ${nft.json.name}`);
                    console.log(`Symbol: ${nft.json.symbol}`);
                    console.log(`Description: ${nft.json.description}`);
                    console.log(`Image: ${nft.json.image}`);
                    if (Array.isArray(nft.json.attributes)) {
                        console.log('\nAttributes:');
                        nft.json.attributes.forEach(attr => {
                            if ('trait_type' in attr && 'value' in attr) {
                                console.log(`- ${attr.trait_type}: ${attr.value}`);
                            }
                        });
                    }
                }
                
                console.log(`\nSeller fee basis points: ${nft.sellerFeeBasisPoints}`);
                if (nft.collection) {
                    console.log(`Collection: ${nft.collection.address.toString()}`);
                    console.log(`Collection verified: ${nft.collection.verified}`);
                }
                console.log(`URI: ${nft.uri}`);
                
                // Check if all requirements are met
                const allRequirementsMet = Object.values(checks).every(check => check);
                console.log(`\nOverall status: ${allRequirementsMet ? '✅ Ready for Magic Eden' : '❌ Does not meet all requirements'}`);
                
            } catch (error) {
                console.error(`Error checking ${name}:`, error);
            }
            
            console.log('\n---\n');
        }
        
        console.log('Verification complete!');
        
    } catch (error) {
        console.error('Error in verification process:', error);
    }
}

verifyNFTRequirements(); 