 import { json } from '@sveltejs/kit';
import { decryptData } from '$lib/decryption';

export async function POST({ request }) {
  const {  ciphertext, dataToEncryptHash, accessControlConditions, sessionSigs } = await request.json();

  if (  !ciphertext || !dataToEncryptHash || !accessControlConditions || !sessionSigs) {
    return json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const decryptedString = await decryptData({
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
      sessionSigs,
    });

    return json({ decryptedString });
  } catch (error) {
    console.error('Decryption error:', error);
    return json({ error: 'Decryption failed' }, { status: 500 });
  }
}
 