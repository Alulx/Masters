 import { json } from '@sveltejs/kit';
import {  getSessionSigs } from '$lib/sessionSigner';

export async function POST({ request }) {
  const {  accessControlConditions, dataToEncryptHash, ethersWallet, signedMessage, toSign } = await request.json();

  if (!accessControlConditions || !dataToEncryptHash || !ethersWallet || !signedMessage || !toSign) {
    return json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const sessionSigs = await getSessionSigs({
      accessControlConditions,
      dataToEncryptHash,
      ethersWallet,
      signedMessage,
      toSign
    });

    return json(sessionSigs);
  } catch (error) {
    console.error('Error generating session signatures:', error);
    return json({ error: 'Failed to generate session signatures' }, { status: 500 });
  }
}
 