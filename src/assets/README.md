# NFT Assets

This directory contains the assets for your Solana NFT.

## Required Files

1. `nft-image.png` - Your NFT image (recommended size: 1000x1000 pixels)
2. `metadata.json` - The metadata for your NFT

## Image Requirements

- Format: PNG
- Size: Recommended 1000x1000 pixels
- File size: Keep under 10MB for optimal performance

## Metadata Format

The metadata.json file should follow the Metaplex NFT Standard:

```json
{
  "name": "My First NFT",
  "symbol": "MFN",
  "description": "This is my first NFT on Solana",
  "seller_fee_basis_points": 500,
  "image": "https://arweave.net/YOUR_IMAGE_ID",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Rarity",
      "value": "Rare"
    }
  ],
  "properties": {
    "files": [
      {
        "uri": "https://arweave.net/YOUR_IMAGE_ID",
        "type": "image/png"
      }
    ],
    "category": "image",
    "creators": [
      {
        "address": "YOUR_WALLET_ADDRESS",
        "share": 100
      }
    ]
  }
}
```

Replace `YOUR_IMAGE_ID` with the actual Arweave ID after uploading your image, and `YOUR_WALLET_ADDRESS` with your Solana wallet address.
