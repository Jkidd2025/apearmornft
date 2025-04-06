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

async function checkSupply() {
  try {
    // Read local metadata
    const nftsPath = path.join(__dirname, 'assets', 'collection', 'nfts.json');
    const localMetadata = JSON.parse(fs.readFileSync(nftsPath, 'utf8')) as NFTMetadata[];
    
    console.log('Checking supply information for all NFTs...\n');
    
    for (const nft of localMetadata) {
      console.log(`Checking ${nft.name}...`);
      
      // Find supply attribute in local metadata
      const supplyAttribute = nft.attributes.find(attr => attr.trait_type === 'Supply');
      if (supplyAttribute) {
        console.log(`Local supply: ${supplyAttribute.value}`);
      } else {
        console.log('❌ No supply attribute found in local metadata');
      }
      
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
        
        // Find supply attribute in Arweave metadata
        const arweaveSupplyAttribute = arweaveMetadata.attributes.find(attr => attr.trait_type === 'Supply');
        if (arweaveSupplyAttribute) {
          console.log(`Arweave supply: ${arweaveSupplyAttribute.value}`);
        } else {
          console.log('❌ No supply attribute found in Arweave metadata');
        }
        
        // Compare supply values
        if (supplyAttribute && arweaveSupplyAttribute) {
          const supplyMatch = supplyAttribute.value === arweaveSupplyAttribute.value;
          console.log(`Supply match: ${supplyMatch ? '✅' : '❌'}`);
        }
      } catch (error) {
        console.log(`❌ Error fetching Arweave metadata: ${error}`);
      }
      
      console.log('---\n');
    }
    
    console.log('Supply check complete!');
  } catch (error) {
    console.error('Error checking supply:', error);
  }
}

checkSupply(); 