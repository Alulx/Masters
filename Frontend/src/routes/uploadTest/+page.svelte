<script lang=ts>
  import { user } from "$lib/stores";

import { ethers } from "ethers";
import { onMount } from "svelte";
import { writable } from "svelte/store";


    //import {accessControlCondition} from '$lib/litEncryption';
    
  const accessControlCondition = [
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


  let dataToEncrypt = 'Hello, World!';
  let ciphertext = $state();
  let dataToEncryptHash = $state();
  let sessionSignature = $state();
  let decryptedString = $state();

    async function checkLit() {
      const response = await fetch('/api/lit');
      const data = await response.json();
      console.log(data.message);
    }

    async function disconnectLit() {
      const response = await fetch('/api/lit-disconnect', { method: 'POST' });
      const data = await response.json();
      console.log(data.message); // Logs: "Lit Client disconnected"
    } 

    async function encryptData() {
      const response = await fetch('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataToEncrypt: dataToEncrypt, accessControlCondition: accessControlCondition }),
      });

      const result = await response.json();
      if (result.error) {
        console.error('Error:', result.error);
      } else {
        ciphertext = result.ciphertext;
        dataToEncryptHash = result.dataToEncryptHash;  
      } 
  } 


async function decryptData() {
  //console.log("decryptin with this:_",sessionSignature);
  const response = await fetch('/api/decrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ciphertext: ciphertext,
      dataToEncryptHash: dataToEncryptHash, // Replace with actual hash
      accessControlConditions: accessControlCondition,
      sessionSigs: sessionSignature, // Replace with your session signature object
    }),
  });

  const result = await response.json();
  if (result.error) {
    console.error('Decryption error:', result.error);
  } else {
    decryptedString = result.decryptedString;
  }
} 


const authSigStore = writable(null);
  let error: string | null = null;
  let signer: any;

  async function getEthersWallet(){
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      try {
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        console.log("SIGNER",signer)
 
        return signer; 
      } catch (e) {
        error = "Fehler beim Verbinden mit MetaMask: " + (e as Error).message;
      }
    } else {
      error = "MetaMask ist nicht installiert";
    }

  }

  async function generateSessionSignatures() {
    const {toSign, signedMessage} = await signMessage();
   
    const response = await fetch('/api/session/session-signer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessControlConditions: accessControlCondition,
        dataToEncryptHash: dataToEncryptHash, // Replace with actual hash
        ethersWallet: await test(),
        signedMessage: signedMessage,
        toSign: toSign,
      })
    });

    const result = await response.json();
    console.log('Session Signatures:', result);
    // result to readable format
    sessionSignature = result;
  }


 async function signMessage() {
  const ethersWallet = await getEthersWallet();
    const response = await fetch('/api/session/message-signer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessControlConditions: accessControlCondition,
        dataToEncryptHash: dataToEncryptHash, // Replace with actual hash
        ethersWallet: await test(),
      })
    });

    const result = await response.json();
   // console.log('message to Sign:', result);
    const toSign = result;
    const signedMessage = await ethersWallet.signMessage(result);
    return {toSign, signedMessage};
  } 

async function test(){
  let obj = await getEthersWallet();
  let cache = [];
  let str = JSON.stringify(obj, function(key, value) {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // reset the cache
 // console.log("OBJ",str);

  str = JSON.parse(str);
  //console.log("OBJ",str);

  return str;
}


  /* const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  
  const thing = await signer.signMessage("Hello, World!");  
  console.log(thing); */
  function extractSessionKey(sessionSignature) {
    for (const key in sessionSignature) {
      if (sessionSignature.hasOwnProperty(key)) {
        const signedMessage = sessionSignature[key].signedMessage;
        const parsedMessage = JSON.parse(signedMessage);
        let sessionKey = parsedMessage.sessionKey;
        return sessionKey;
        break; // Assuming you only need the first sessionKey
      }
    }
  }

  </script>
  
     <button class="btn btn-primary" onclick={test}>test</button>
 

  <button class="btn btn-primary" onclick={disconnectLit}>Disconnect Lit Client</button>
  
  <button class="btn btn-primary" onclick={checkLit}>Check Lit Client</button>

  <button class="btn btn-primary" onclick={encryptData}>encrypt</button> 

  <p class="text-white">dataToEncrypt: {dataToEncrypt}</p>
  <p class="text-white">ciphertext: {ciphertext}</p>
  <p class="text-white">dataToEncryptHash: {dataToEncryptHash}</p>
  <button class="btn btn-primary" onclick={generateSessionSignatures}>generateSessionSignatures</button>
  <p class="text-white">Session Signature: {extractSessionKey(sessionSignature)}</p>
  <button class="btn btn-primary" onclick={decryptData}>decrypt</button> 

  <p class="text-white">decryptedString: {decryptedString}</p>


 <!-- 
  <button class="btn btn-primary" on:click={decryptData}>decrypt</button>
 -->