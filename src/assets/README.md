# NFT Assets

This directory contains the assets needed for your NFT.

## Required Files

1. `nft-image.png` - Your NFT image
   - Format: PNG
   - Recommended size: 1000x1000 pixels
   - Maximum file size: 10MB

## Image Requirements

- Format: PNG
- Recommended size: 1000x1000 pixels
- Maximum file size: 10MB
- Should be high quality and visually appealing
- Should represent your NFT's theme (ApeArmor original logo)

## Metadata

The `metadata.json` file contains the NFT's metadata following the Metaplex NFT Standard. It includes:

- Name: ApeArmor original logo
- Symbol: APE-Silver
- Description: ApeArmor original logo with beige background with green sheild brown and white ape wearing body armor and facing to the right
- Seller fee: 500 basis points (5%)
- Attributes: Background, Armor, Ape, and Rarity traits
- Properties: File information and creator details

## Next Steps

1. Add your NFT image as `nft-image.png` in this directory
2. Run `npm run upload-assets` to upload the image and metadata to Arweave
3. The script will automatically update the `.env` file with the new URIs
4. After successful upload, you can mint your NFT using `npm run dev`
