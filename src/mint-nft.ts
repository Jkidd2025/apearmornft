import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { config } from './config/config';

async function mintNFT() {
    try {
        // Initialize connection to Solana network
        const connection = new Connection(config.endpoint);
        
        // Initialize Metaplex
        const metaplex = new Metaplex(connection);
        
        // Load wallet (you'll need to implement proper wallet loading)
        const wallet = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(config.walletPrivateKey))
        );
        
        metaplex.use({ identity: wallet });
        
        // Example NFT metadata
        const nftData = {
            name: "My First NFT",
            symbol: "MFN",
            description: "This is my first NFT on Solana",
            sellerFeeBasisPoints: 500, // 5% royalty
            image: "https://your-image-url.com/image.png",
        };
        
        // Mint NFT
        const { nft } = await metaplex
            .nfts()
            .create({
                uri: "https://your-metadata-url.com/metadata.json",
                name: nftData.name,
                symbol: nftData.symbol,
                sellerFeeBasisPoints: nftData.sellerFeeBasisPoints,
            });
            
        console.log("NFT created successfully!");
        console.log("Mint address:", nft.address.toString());
        
    } catch (error) {
        console.error("Error minting NFT:", error);
    }
}

// Execute the minting function
mintNFT(); 