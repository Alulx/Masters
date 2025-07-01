 import { json } from '@sveltejs/kit';
import { accessControlCondition, encryptData } from '$lib/litEncryption';

export async function POST({ request }) {
  const { dataToEncrypt, accessControlCondition } = await request.json();

  if (!dataToEncrypt || !accessControlCondition) {
    return json({ error: 'No data provided' }, { status: 400 });
  }

  try {
    const encrypted = await encryptData(dataToEncrypt);
    return json(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    return json({ error: 'Encryption failed' }, { status: 500 });
  }
} 