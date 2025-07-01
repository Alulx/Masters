import { json } from '@sveltejs/kit';
import { getLitClient } from '$lib/litClient';


export async function GET() {
  const litClient = await getLitClient();

  // Example: Log the client to confirm it's connected
  console.log('Lit Client connected:', litClient);

  return json({ message: 'Lit Client ready to use' });
}
