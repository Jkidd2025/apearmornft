# Solana NFT Minting Project

This project demonstrates how to mint NFTs on the Solana blockchain using the Metaplex framework.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Solana CLI tools
- A Solana wallet (e.g., Phantom)

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   WALLET_PRIVATE_KEY=your_wallet_private_key
   RPC_ENDPOINT=your_rpc_endpoint (optional)
   ```

## Usage

1. Build the project:

   ```bash
   npm run build
   ```

2. Run the minting script:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/` - Source code
  - `config/` - Configuration files
  - `assets/` - NFT assets (images, metadata)
  - `mint-nft.ts` - Main minting script

## Important Notes

- Never commit your private keys or sensitive information
- Always test on devnet before deploying to mainnet
- Make sure you have enough SOL in your wallet for transaction fees

## License

ISC
