<script lang=ts>
  import { user } from "$lib/stores";

import { ethers } from "ethers";
import { onMount } from "svelte";
import { writable } from "svelte/store";

    //import {accessControlCondition} from '$lib/litEncryption';
     let data = $props();

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

export const litNodeClientStore = writable(null);

  let dataToEncrypt = 'Hello, World!';
  let ciphertext = $state();
  let dataToEncryptHash = $state();
  let sessionSignature = $state();
  let decryptedString = $state();

  </script>
  

    <div>
      <h1>Data from Server</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
