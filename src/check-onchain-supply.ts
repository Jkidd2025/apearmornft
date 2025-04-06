import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex, Nft } from '@metaplex-foundation/js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Define NFT addresses from the minting process
const NFT_ADDRESSES = {
  'ApeArmor Chimp': 'YPTHLRGpN7CDc4cP2oYmhsKyvZniun2fgVR9edrekHr',
  'Guardian Gorilla': 'HdQ4oBVfmdq14aknv6WeNkirkd9VereH3Rvex3HHb68v',
  'Sentinel Silverback': 'AC2JQW9qYTao3wAHxPfrs2cKMpiLq3T7L997Tnqq3cTZ',
  'Collection NFT': 'GfwfZHGh1JLxvE3ernzj2nvwKhniCNJShxwyf6CzsfSZ'
};

// Define expected supply from metadata
const EXPECTED_SUPPLY = {
  'ApeArmor Chimp': 1000000,
  'Guardian Gorilla': 10000,
  'Sentinel Silverback': 1001
};

async function checkOnChainSupply() {
  try {
    // Use the Helius RPC endpoint
    const rpcEndpoint = process.env.RPC_ENDPOINT || process.env.CUSTOM_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    console.log(`Using RPC endpoint: ${rpcEndpoint}`);
    
    // Initialize connection to Solana network
    const connection = new Connection(rpcEndpoint, {
      commitment: 'confirmed'
    });
    
    // Initialize Metaplex
    const metaplex = new Metaplex(connection);
    
    console.log('Checking on-chain supply for all NFTs...\n');
    
    for (const [name, address] of Object.entries(NFT_ADDRESSES)) {
      console.log(`Checking ${name}...`);
      console.log(`Address: ${address}`);
      
      try {
        // Get NFT data
        const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(address) });
        
        // Check if it's a collection NFT
        if (name === 'Collection NFT') {
          console.log('This is a collection NFT, not a regular NFT with supply');
          console.log('Collection NFTs are used to group NFTs together, not for tracking supply');
          console.log('---\n');
          continue;
        }
        
        // Get expected supply
        const expectedSupply = EXPECTED_SUPPLY[name as keyof typeof EXPECTED_SUPPLY];
        console.log(`Expected supply: ${expectedSupply}`);
        
        // Check if the NFT is part of a collection
        if (nft.collection) {
          console.log(`Collection address: ${nft.collection.address.toString()}`);
          console.log(`Collection verified: ${nft.collection.verified ? '✅' : '❌'}`);
        } else {
          console.log('❌ NFT is not part of a collection');
        }
        
        // Check if the NFT has a supply attribute in its metadata
        if (nft.json && nft.json.attributes) {
          const supplyAttribute = nft.json.attributes.find((attr: any) => attr.trait_type === 'Supply');
          if (supplyAttribute && supplyAttribute.value) {
            console.log(`Metadata supply attribute: ${supplyAttribute.value}`);
            const supplyMatch = parseInt(supplyAttribute.value) === expectedSupply;
            console.log(`Supply match: ${supplyMatch ? '✅' : '❌'}`);
          } else {
            console.log('❌ No supply attribute found in NFT metadata');
          }
        } else {
          console.log('❌ No metadata found for NFT');
        }
        
        // Check if the NFT is mutable
        console.log(`NFT is mutable: ${nft.isMutable ? '✅' : '❌'}`);
        
        // Check if the NFT has been verified
        // Note: The 'verified' property is not directly available on the NFT object
        // We'll check if it's part of a verified collection instead
        console.log(`NFT is part of a verified collection: ${nft.collection?.verified ? '✅' : '❌'}`);
        
        // Check if the NFT has been listed
        // Note: The 'listed' property is not directly available on the NFT object
        // We'll check the metadata URI instead
        console.log(`NFT metadata URI: ${nft.uri}`);
        
        console.log('---\n');
      } catch (error) {
        console.error(`Error checking NFT ${name}:`, error);
        console.log('---\n');
      }
    }
    
    console.log('On-chain supply check complete!');
  } catch (error) {
    console.error('Error checking on-chain supply:', error);
  }
}

checkOnChainSupply(); 