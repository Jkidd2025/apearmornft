import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

async function checkUrl(url: string, description: string) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            console.log(`✅ ${description}: ${url}`);
            return true;
        } else {
            console.log(`❌ ${description} not accessible: ${url}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error checking ${description}: ${url}`);
        return false;
    }
}

async function verifyArweaveUrls() {
    const nftsPath = path.join(__dirname, 'assets', 'collection', 'nfts.json');
    const nftsData = JSON.parse(fs.readFileSync(nftsPath, 'utf8'));

    console.log('Verifying Arweave URLs...\n');

    let allValid = true;

    // Check collection image
    const collectionUrl = nftsData[0].collection.image;
    const collectionValid = await checkUrl(collectionUrl, 'Collection Image');
    allValid = allValid && collectionValid;

    console.log(''); // Empty line for spacing

    // Check individual NFT images
    for (const nft of nftsData) {
        const imageValid = await checkUrl(nft.image, `${nft.name} Image`);
        allValid = allValid && imageValid;
    }

    console.log('\nVerification complete!');
    if (allValid) {
        console.log('✅ All URLs are accessible and ready for minting!');
    } else {
        console.log('❌ Some URLs are not yet accessible. You may need to wait longer for propagation.');
    }
}

verifyArweaveUrls(); 