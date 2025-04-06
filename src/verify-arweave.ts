import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

interface NFTMetadata {
    name: string;
    uri?: string;
    image: string;
}

interface ArweaveMetadata {
    name: string;
    image: string;
    [key: string]: any;
}

async function verifyArweaveMetadata() {
    try {
        // Read metadata from file
        const nftsPath = path.join(__dirname, 'assets', 'collection', 'nfts.json');
        const nftsData = JSON.parse(fs.readFileSync(nftsPath, 'utf8')) as NFTMetadata[];
        
        console.log('Verifying Arweave metadata propagation...\n');
        
        for (const metadata of nftsData) {
            if (!metadata.uri) {
                console.log(`❌ No URI found for ${metadata.name}`);
                continue;
            }
            
            console.log(`Checking ${metadata.name}...`);
            console.log(`Metadata URI: ${metadata.uri}`);
            
            try {
                // Try to fetch the metadata
                const response = await fetch(metadata.uri);
                if (!response.ok) {
                    console.log(`❌ Metadata not yet accessible for ${metadata.name}`);
                    continue;
                }
                
                const metadataContent = await response.json() as ArweaveMetadata;
                
                // Verify essential fields
                const hasName = metadataContent.name === metadata.name;
                const hasImage = metadataContent.image === metadata.image;
                
                if (hasName && hasImage) {
                    console.log(`✅ Metadata successfully propagated for ${metadata.name}`);
                } else {
                    console.log(`⚠️ Metadata accessible but may be incomplete for ${metadata.name}`);
                }
                
            } catch (error) {
                console.log(`❌ Error accessing metadata for ${metadata.name}:`, error);
            }
            
            console.log('---\n');
        }
        
        console.log('Verification complete!');
        console.log('If any metadata is not yet accessible, please wait a few minutes and run this script again.');
        
    } catch (error) {
        console.error('Error verifying metadata:', error);
        process.exit(1);
    }
}

// Execute the verification
verifyArweaveMetadata(); 