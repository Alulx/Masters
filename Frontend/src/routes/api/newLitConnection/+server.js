import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { json } from '@sveltejs/kit';
import { getMessageToSign } from '$lib/sessionSigner';

export async function POST({ request }) {
    class Lit {
        litNodeClient;
        chain;
    
        constructor(chain){
        this.chain = chain;
        }
    
        async connect() {
        this.litNodeClient = new LitJsSdk.LitNodeClient({
            litNetwork: LIT_NETWORK.DatilDev,
        });
        await this.litNodeClient.connect();
        }
    
        async encrypt(message) {
        // Encrypt the message
        console.log(this.litNodeClient)
        const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
        {
            accessControlConditions,
            dataToEncrypt: message,
        },
        this.litNodeClient,
        );
    
        // Return the ciphertext and dataToEncryptHash
        return {
        ciphertext,
        dataToEncryptHash,
        };
    }
    
    }
}