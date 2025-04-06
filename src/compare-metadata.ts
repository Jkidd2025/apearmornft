import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  seller_fee_basis_points: number;
  image: string;
  external_url: string;
  attributes: Array<{ trait_type: string; value: string }>;
  properties: {
    files: Array<{ uri: string; type: string; cdn?: boolean }>;
    category: string;
    creators: Array<{ address: string; share: number }>;
  };
  collection?: {
    name: string;
    family: string;
    image?: string;
  };
  uri?: string;
}

async function compareMetadata() {
  try {
    // Read local metadata
    const nftsPath = path.join(__dirname, 'assets', 'collection', 'nfts.json');
    const localMetadata = JSON.parse(fs.readFileSync(nftsPath, 'utf8')) as NFTMetadata[];
    
    console.log('Comparing local metadata with Arweave metadata...\n');
    
    for (const nft of localMetadata) {
      console.log(`Checking ${nft.name}...`);
      console.log(`Local symbol: ${nft.symbol}`);
      console.log(`Arweave URI: ${nft.uri}`);
      
      if (!nft.uri) {
        console.log('❌ No Arweave URI found in local metadata');
        continue;
      }
      
      try {
        const response = await fetch(nft.uri);
        if (!response.ok) {
          console.log(`❌ Failed to fetch Arweave metadata: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const arweaveMetadata = await response.json() as NFTMetadata;
        console.log(`Arweave symbol: ${arweaveMetadata.symbol}`);
        
        // Compare key fields
        const nameMatch = nft.name === arweaveMetadata.name;
        const symbolMatch = nft.symbol === arweaveMetadata.symbol;
        const imageMatch = nft.image === arweaveMetadata.image;
        
        console.log(`Name match: ${nameMatch ? '✅' : '❌'}`);
        console.log(`Symbol match: ${symbolMatch ? '✅' : '❌'}`);
        console.log(`Image match: ${imageMatch ? '✅' : '❌'}`);
        
        if (!nameMatch || !symbolMatch || !imageMatch) {
          console.log('❌ Metadata mismatch detected!');
          console.log('Local metadata:', JSON.stringify(nft, null, 2));
          console.log('Arweave metadata:', JSON.stringify(arweaveMetadata, null, 2));
        } else {
          console.log('✅ Metadata matches perfectly!');
        }
      } catch (error) {
        console.log(`❌ Error fetching Arweave metadata: ${error}`);
      }
      
      console.log('---\n');
    }
    
    console.log('Metadata comparison complete!');
  } catch (error) {
    console.error('Error comparing metadata:', error);
  }
}

compareMetadata(); 