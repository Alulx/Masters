import { EAS, NO_EXPIRATION, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { error } from '@sveltejs/kit';
import dotenv from 'dotenv';
dotenv.config();

export async function load() {
  try {
    console.log("was geht")

  
    const eas = new EAS('0xC2679fBD37d54388Ce493F1DB75320D236e1815e');

    // Initialize the provider with Alchemy for the Sepolia test network
    const provider = ethers.getDefaultProvider('sepolia');
    eas.connect(provider);

    // Initialize EAS with the EAS contract address on Sepolia
    const signer = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY_LIT, provider);

    const offchain = await eas.getOffchain();

    // Initialize SchemaEncoder with the schema string
    const schemaEncoder = new SchemaEncoder('uint256 eventId, uint8 voteIndex');
    const encodedData = schemaEncoder.encodeData([
      { name: 'eventId', value: 1, type: 'uint256' },
      { name: 'voteIndex', value: 1, type: 'uint8' }
    ]);

    // Create a signer using the provider

    const offchainAttestation = await offchain.signOffchainAttestation(
      {
        recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
        expirationTime: NO_EXPIRATION, // Unix timestamp of when attestation expires (0 for no expiration)
        time: BigInt(Math.floor(Date.now() / 1000)), // Unix timestamp of current time
        revocable: true, // Be aware that if your schema is not revocable, this MUST be false
        schema: '0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995',
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        data: encodedData
      },
      signer
    );

    console.log(offchainAttestation);
    // write to text file
    const attestationData = JSON.stringify(offchainAttestation, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
  
    return {
      offchainAttestation
    };
  } catch (err) {
    console.error('Error during attestation:', err);
    throw error(500, 'Internal Server Error');
  }
} 