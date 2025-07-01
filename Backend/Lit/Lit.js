import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { encryptString, decryptToString, encryptToJson, decryptFromJson, encryptFile, decryptToFile  } from '@lit-protocol/encryption';

import { LIT_NETWORK } from "@lit-protocol/constants";
import { LIT_ABILITY } from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";

import {
  LitAccessControlConditionResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";

import { ethers } from "ethers";

import fs from 'fs';
import {Blob} from 'buffer';

import ACcontractAbi from "/home/alex/Masterarbeit/artifacts/contracts/Verifier.sol/Verifier.json"  with { type: "json" };
import evmContractConditions from "/home/alex/Masterarbeit_test/Lit/CurrentEvmContractConditions.json" with { type: "json" };
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();




 const accessControlConditions = [
  {
      contractAddress: "",
      standardContractType: "",
      chain: "ethereum",
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
      comparator: "=",
      value: '0x353D43FbA89263806e7C7Ac509AA54f6563103cf', // <--- The address of the wallet that can decrypt the data
      },
  },
]; 
const provider = ethers.getDefaultProvider('sepolia');

const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);


const contractAddress = /* '0x7CFe6a051e206a4AC34805De144f4e9705960301' */ '0xf85C7A95F5740b774Dd207E6791F37771A1c23c9';
const contract = new ethers.Contract(contractAddress, ACcontractAbi.abi, wallet);


// create a bytes32 compatible array of all uids inside of att
/* console.log(ids)
 */
const role = "revoker";
const user = '0x353D43FbA89263806e7C7Ac509AA54f6563103cf';
const uids = ["0xdd87725da902e1ea269b2cf60412539e73c340aecfc4792c8f89993e43962513"];
const attesterOrganisation = '0x7CFe6a051e206a4AC34805De144f4e9705960301';

console.log(JSON.stringify(doesHave)) 

class Lit {
   litNodeClient;
   chain;

   constructor(chain){
    this.chain = chain;
  }

    
    dAppOwnerWallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY);
    
    async mint() {
      const contractClient = new LitContracts({
        signer: this.dAppOwnerWallet,
        network: LIT_NETWORK.DatilDev,
      });

      const { capacityTokenIdStr } = await contractClient.mintCapacityCreditsNFT({
        requestsPerKilosecond: 80,
        // requestsPerDay: 14400,
        // requestsPerSecond: 10,
        daysUntilUTCMidnightExpiration: 2,
      });
      return capacityTokenIdStr;
    }

    async createCapacity(capacityTokenIdStr) {
      const { capacityDelegationAuthSig } =
      await this.litNodeClient.createCapacityDelegationAuthSig({
        uses: '1',
        signer: this.dAppOwnerWallet,
        capacityTokenId: capacityTokenIdStr,
        //delegateeAddresses: [walletAddress],
      });
      return capacityDelegationAuthSig;
    }
/* 
    evmContractConditions = [
      {
        contractAddress: "0xf85C7A95F5740b774Dd207E6791F37771A1c23c9",
        functionName: "doesUserhaveEASRoleAC",
        functionParams: [ ":userAddress",contractAddress, role ],
        functionAbi: {
          "inputs": [
            {
              "internalType": "address",
              "name": "_user",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_attesterAcontract",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "_role",
              "type": "string"
            }
          ],
          "name": "doesUserhaveEASRoleAC",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
          
        },
        chain: "sepolia",
        returnValueTest: {
          key: "", // Add the key property here
          comparator: '=',
          value: 'true'
        },
      },
    ]; */

   async connect() {
      this.litNodeClient = new LitJsSdk.LitNodeClient({
        litNetwork: LIT_NETWORK.DatilDev,
      });
      await this.litNodeClient.connect();
   }

   async encrypt(message ) {
    // Encrypt the message
    const  Array  = await encryptToJson(
      {
        chain: this.chain,
        evmContractConditions,
        file: message,
        litNodeClient:this.litNodeClient,
      },
    );

    // Return the ciphertext and dataToEncryptHash
    return Array
    
  }
  async getSessionSignatures(){
    // Connect to the wallet
    const ethWallet = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY_LIT);

    // Get the latest blockhash
    const latestBlockhash = await this.litNodeClient.getLatestBlockhash();

      // Encode the dynamic UID
   

    // Define the authNeededCallback function
    const authNeededCallback = async(params) => {
      if (!params.uri) {
        throw new Error("uri is required");
      }
      if (!params.expiration) {
        throw new Error("expiration is required");
      }

      if (!params.resourceAbilityRequests) {
        throw new Error("resourceAbilityRequests is required");
      }

      // Create the SIWE message
      const toSign = await createSiweMessageWithRecaps({
        uri: params.uri,
        expiration: params.expiration,
        resources: params.resourceAbilityRequests,
        walletAddress: ethWallet.address,
        nonce: latestBlockhash,
        litNodeClient: this.litNodeClient,
      });

      // Generate the authSig
      const authSig = await generateAuthSig({
        signer: ethWallet,
        toSign,
      });

      return authSig;
    }

    // Define the Lit resource
    const litResource = new LitAccessControlConditionResource('*');
    //let capacityDelegationAuthSig = await this.createCapacity();
    // Get the session signatures
    const sessionSigs = await this.litNodeClient.getSessionSigs({
        chain: this.chain,
        resourceAbilityRequests: [
            {
                resource: litResource,
                ability: LIT_ABILITY.AccessControlConditionDecryption,
            },
        ],
        authNeededCallback,
        //capacityDelegationAuthSig,
    });
    return sessionSigs;
}


  async decrypt (ciphertext, dataToEncryptHash, sessionSigs, accessControlConditions) {
    const decryptedString = await decryptFromJson(
        {
          litNodeClient: this.litNodeClient,
          sessionSigs: sessionSigs,
          parsedJsonData: {
            evmContractConditions: accessControlConditions,
            chain: this.chain,
            ciphertext: ciphertext,
            dataToEncryptHash: dataToEncryptHash,
            dataType: "file"
          }
        },
      );

      // Return the decrypted string
      return { decryptedString };
  }



}

  const chain = "sepolia";

let myLit = new Lit(chain);
await myLit.connect();

//const { ciphertext, dataToEncryptHash } = await myLit.encrypt("this is a secret message");
// create file or blob from file in this directory

  const filePath = './PXL_20241207_220404948.jpg';
const fileData = fs.readFileSync(filePath);
const fileBlob = new Blob([fileData], { type: 'image/jpeg' });



const  Array = await myLit.encrypt(fileBlob);
let JsonData = JSON.parse(Array)
 //console.log(JsonData)


// save both values into file in directory separte
 fs.writeFileSync('./cipher', JsonData.ciphertext);
fs.writeFileSync('./dataToEncryptHash', JsonData.dataToEncryptHash);
 //fs.writeFileSync('./accessControlConditions', JSON.stringify(JsonData.accessControlConditions)); 
 fs.writeFileSync('./accessControlConditions', JSON.stringify(JsonData.evmContractConditions)); 
fs.writeFileSync('./dataNeededForDecryption', JSON.stringify(JsonData));

//Import the file called data and get the ciphertext datatoenrypthash and acces control conditions from it

let ciphertext = fs.readFileSync('./cipher', 'utf8');
let dataToEncryptHash = fs.readFileSync('./dataToEncryptHash', 'utf8');
let accessControlConditionstext = fs.readFileSync('./accessControlConditions', 'utf8');
 console.log("accessControlConditions",accessControlConditionstext)
const sessionSigs = await myLit.getSessionSignatures();
//console.log("sessionsigs:", sessionSigs) 
const decryption = await myLit.decrypt(ciphertext, dataToEncryptHash, sessionSigs, JSON.parse(accessControlConditionstext), );
//const decryption = await myLit.decrypt(JsonData.ciphertext, JsonData.dataToEncryptHash, sessionSigs, JsonData.accessControlConditionstext );

console.log("done",decryption) 
// save decryption into file in directory
 fs.writeFileSync('./decrypted2.jpg', decryption.decryptedString);
     
 
