 import { decryptToString } from '@lit-protocol/encryption'; // Hypothetical, replace with actual import path
import { getLitClient } from './litClient';


export async function decryptData({
  ciphertext,
  dataToEncryptHash,
  accessControlConditions,
  sessionSigs,
}) {
  const litClient = await getLitClient();
  console.log(accessControlConditions)
  try {
    const decryptionResult = await decryptToString(
      {
        chain: "ethereum",
        ciphertext,
        dataToEncryptHash,
        accessControlConditions,
        sessionSigs,
      },
      litClient
    );

    return decryptionResult;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data.');
  }
}
 