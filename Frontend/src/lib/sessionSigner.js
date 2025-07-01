import { LIT_ABILITY } from "@lit-protocol/constants";
 
import {
  createSiweMessage,
  generateAuthSig,
  LitAccessControlConditionResource,
} from '@lit-protocol/auth-helpers';
import { getLitClient } from './litClient';
import { ethers } from 'ethers';
import { json } from '@sveltejs/kit';


 async function generateResourceString(accessControlConditions, dataToEncryptHash) {
  return LitAccessControlConditionResource.generateResourceString(
    accessControlConditions,
    dataToEncryptHash
  );
}


export async function getMessageToSign({
  accessControlConditions,
  dataToEncryptHash,
  ethersWallet,
}) {
  const litClient = await getLitClient();

  const resourceString = await generateResourceString(accessControlConditions, dataToEncryptHash);

  const walletAddress = ethers.utils.getAddress( ethersWallet.provider.provider._state.accounts[0]);
  
      const toSign = await createSiweMessage({
        uri: "lit:session:28e7cb5c5f6e5c231418ee7d15e64692b573dcbe5cdaec337819c7140e2284a3",
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes,
        resources: [
          {
            resource: new LitAccessControlConditionResource(resourceString),
            ability: LIT_ABILITY.AccessControlConditionDecryption,
          },
        ],
        walletAddress: walletAddress,
        nonce: await litClient.getLatestBlockhash(),
        litNodeClient: litClient,
      });
      console.log(toSign)
      return toSign;

}
 
export async function getSessionSigs({
  accessControlConditions,
  dataToEncryptHash,
  ethersWallet,
  toSign,
  signedMessage,
}) {
  const walletAddress = ethers.utils.getAddress( ethersWallet.provider.provider._state.accounts[0]);

  //const parsedSignature = ethers.utils.splitSignature(signedMessage);
  //console.log("parsedsig",parsedSignature)
  console.log("signedmessage",signedMessage)
  console.log("tosign",toSign)
 /* const litClient = await getLitClient();
 
  const toSign = await createSiweMessage({
    uri: "lit:session:28e7cb5c5f6e5c231418ee7d15e64692b573dcbe5cdaec337819c7140e2284a3",
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes,
    resources: [
      {
        resource: new LitAccessControlConditionResource(await generateResourceString(accessControlConditions, dataToEncryptHash)),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ],
    walletAddress: walletAddress,
    nonce: await litClient.getLatestBlockhash(),
    litNodeClient: litClient,
  });

    const sessionSigs = await litClient.getSessionSigs({
      chain: 'ethereum',
      resources: [
        {
          resource: new LitAccessControlConditionResource(await generateResourceString(accessControlConditions, dataToEncryptHash)),
          ability: LIT_ABILITY.AccessControlConditionDecryption,
        },
      ],
      authSig: {
        sig: parsedSignature.compact,
        derivedVia: "web3.eth.personal.sign",
        signedMessage: toSign, // The original SiWE message
        address: walletAddress // The user's Ethereum address
      }
    });

    return sessionSigs; */

try {

   const litClient = await getLitClient();

  const resourceString = await generateResourceString(accessControlConditions, dataToEncryptHash);

  const sessionSigs = await litClient.getSessionSigs({
    chain: 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource(resourceString),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ],

    authNeededCallback: async ({
      uri,
      expiration,
      resourceAbilityRequests,
    }) => {

      const authSig = {
        sig: signedMessage,
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: toSign,
        address: walletAddress,
      };

      return authSig;
    },
    
  }); 
  return sessionSigs;
} catch (error) {
  console.error('Detailed error:', error);
  throw error;
}

}