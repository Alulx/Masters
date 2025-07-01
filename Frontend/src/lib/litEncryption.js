 import { encryptString } from '@lit-protocol/encryption'; // Hypothetical, depending on your SDK version
import { getLitClient } from './litClient';

export const accessControlCondition = [
    {
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "",
        parameters: [":userAddress"],
        returnValueTest: {
        comparator: "=",
        value: '0x8d1038F350110D16330134945A13F524453c4288', // <--- The address of the wallet that can decrypt the data
        },
    },
];

export async function encryptData(dataToEncrypt) {
  const litClient = await getLitClient();

  // Authenticate user (wallet signature required for most conditions)
  //const authSig = await litClient.checkAndSignAuthMessage();

  // Encrypt the data
  const { ciphertext, dataToEncryptHash } = await encryptString(
    {
      accessControlConditions: accessControlCondition,
      dataToEncrypt,
     // authSig,
    },
    litClient
  );

  return {
    ciphertext,
    dataToEncryptHash,
  };
}
 