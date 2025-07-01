 import { json } from '@sveltejs/kit';
import { getMessageToSign } from '$lib/sessionSigner';

export async function POST({ request }) {
  const {  accessControlConditions, dataToEncryptHash, ethersWallet } = await request.json();

  if (!accessControlConditions || !dataToEncryptHash || !ethersWallet) {
    return json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const messageToSign = await getMessageToSign({
      accessControlConditions,
      dataToEncryptHash,
      ethersWallet,
    });

    return json(messageToSign);
  } catch (error) {
    console.error('Error generating session signatures:', error);
    return json({ error: 'Failed to generate session signatures' }, { status: 500 });
  }
}
 