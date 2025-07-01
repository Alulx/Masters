import { json } from '@sveltejs/kit';
import { disconnectLitClient } from '$lib/litClient';

export async function POST() {
  await disconnectLitClient();
  return json({ message: 'Lit Client disconnected' });
}