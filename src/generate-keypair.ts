import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Generate a new keypair
const keypair = Keypair.generate();

// Get the public key
const publicKey = keypair.publicKey.toString();

// Get the private key as a base58 string
const privateKey = Buffer.from(keypair.secretKey).toString('base64');

// Create a directory for keys if it doesn't exist
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Save the keypair to a file
const keypairPath = path.join(keysDir, 'keypair.json');
fs.writeFileSync(keypairPath, JSON.stringify({
  publicKey,
  privateKey
}));

// Update the .env file with the private key
const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace the WALLET_PRIVATE_KEY line if it exists, otherwise add it
if (envContent.includes('WALLET_PRIVATE_KEY=')) {
  envContent = envContent.replace(
    /WALLET_PRIVATE_KEY=.*/,
    `WALLET_PRIVATE_KEY="${privateKey}"`
  );
} else {
  envContent += `\nWALLET_PRIVATE_KEY="${privateKey}"`;
}

fs.writeFileSync(envPath, envContent);

console.log('Keypair generated successfully!');
console.log('Public Key:', publicKey);
console.log('Private Key saved to .env file');
console.log('Keypair saved to:', keypairPath);
console.log('\nIMPORTANT: Keep your private key secure and never share it with anyone!'); 