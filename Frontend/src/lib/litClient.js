import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';

let litClient; // Singleton instance

export async function getLitClient() {
  if (!litClient) {
    litClient = new LitNodeClient({
      alertWhenUnauthorized: false,
      litNetwork: LIT_NETWORK.DatilDev,
    });
    await litClient.connect(); // Connect to the Lit network
  }
  return litClient;
}
export async function disconnectLitClient() {
    if (litClient) {
      await litClient.disconnect();
      litClient = null; // Reset the singleton
      console.log('Lit client disconnected');
    } else {
      console.log('Lit client is not initialized');
    }
  }

  