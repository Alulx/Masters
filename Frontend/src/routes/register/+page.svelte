<script lang="ts">
import { 
  EAS,
  NO_EXPIRATION,
  type MerkleValue,
  PrivateData,
  SchemaEncoder,
  OffchainAttestationVersion,
  Offchain,
  type SignedOffchainAttestation,
  type OffchainConfig,
} from '@ethereum-attestation-service/eas-sdk';

import {
  connected,
  provider,
  chainId,
  signer,
  signerAddress,
  contracts,

  defaultEvmStores

} from 'ethers-svelte'

  import {  user,RegistryContractAddress } from '$lib/stores';
  import { onMount } from 'svelte';
  import  RegistryAbi from "../../../../artifacts/contracts/Registry.sol/Registry.json"

	// import SchemaUid from .env
	const PRIVATEDATASCHEMA = "0x20351f973fdec1478924c89dfa533d8f872defa108d9c3c6512267d7e7e5dbc2"

	export const SepoliaEASContractAddress = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e'; // Sepolia v0.26

	// Initialize the sdk with the address of the EAS Schema contract address
	const eas = new EAS(SepoliaEASContractAddress);
   // eas.connect($signer);

	// Gets a default provider (in production use something else like infura/alchemy)

	// Connects an ethers style provider/signingProvider to perform read/write functions.
	// MUST be a signer to do write operations!

    let name: string = $state('');
    let age: number = $state(0);
    let occupation: string = $state('');
    let country: string = $state('');
    let newAttestationUID: string= $state('');
    let downloadUrl: string = $state('');


    onMount(async () => {
       if (localStorage?.getItem('personalUID')){
            try{
                newAttestationUID = localStorage.getItem('personalUID');

            } catch (ex){
                console.log(ex);
            }
        }
    });

    async function registerIdentity(){
        defaultEvmStores.attachContract('Registry', RegistryContractAddress, JSON.stringify(RegistryAbi.abi))
        console.log(newAttestationUID)
        await $contracts.Registry.registerIdenity( newAttestationUID);
        console.log("registered: ", await $contracts.Registry.getUID($user));
        alert("Identity Registered Successfully");
    }

	async function verify(SchemaUid: string) {        
		console.log('Button clicked!');
		console.log("registered: ", await $contracts.Registry.getUID($user));
        alert("Identity Registered Successfully" + await $contracts.Registry.getUID($user));
    }

	async function createPrivateDataOffchain() {   
		if (!name || !age || !occupation || !country) {
            alert('Please fill in all the fields before continuing.');
            return;
        }    
        if (!$connected) {
            alert('Please connect your wallet before continuing.');
            return;
        }


       eas.connect($signer);

        const offchain = await eas.getOffchain();
        console.log("Offchain:", offchain);


        const values: MerkleValue[] = [
            { type: "string", name: "Name", value: name },
            { type: "uint256", name: "Age", value: age },
            { type: "string", name: "Occupation", value:  occupation},
            { type: "string", name: "Country", value:  country},
        ];
        const privateData = new PrivateData(values);
        const fullTree = privateData.getFullTree();
        
		const schemaEncoder = new SchemaEncoder("bytes32 privateData");
        const encodedData = schemaEncoder.encodeData([
         { name: "privateData", value: fullTree.root, type: "bytes32" },
        ]);
    
       
	 	const transaction = await offchain.signOffchainAttestation(
            {
                recipient: $user,
                expirationTime: NO_EXPIRATION,
                time: BigInt(Math.floor(Date.now() / 1000)), // Unix timestamp of current time
                revocable: true,
                schema: PRIVATEDATASCHEMA,
                refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
                data: encodedData,
            }, 
            $signer,
        );

        const UID = await transaction
        console.log(UID)
        newAttestationUID = UID.uid;
        //save UId.uid to cookies
        localStorage.setItem('personalUID', newAttestationUID); 
        

       /*  const proofIndexes = [0, 2]; // Revealing only name and occupation
        const multiProof = privateData.generateMultiProof(proofIndexes);

        console.log("Multi-proof for selective reveal:", multiProof);  */

        const jsonString = JSON.stringify(UID, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
        }, 2);
        console.log(jsonString);
        // Convert the data to a JSON string

        // Create a Blob from the JSON string
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Generate a URL for the Blob
        downloadUrl = URL.createObjectURL(blob);
        
        //VERFIFY
        const EAS_CONFIG: OffchainConfig = {
            address: UID.domain.verifyingContract,
            version: UID.domain.version,
            chainId: UID.domain.chainId,
        };

        const offchain2 = new Offchain(EAS_CONFIG, OffchainAttestationVersion.Version2, eas);
        const isValidAttestation = offchain2.verifyOffchainAttestationSignature(
            $signerAddress,
            UID
        
     );
        console.log(isValidAttestation)
	}


    async function createPrivateData() {   
		if (!name || !age || !occupation || !country) {
            alert('Please fill in all the fields before continuing.');
            return;
        }    
        if (!$connected) {
            alert('Please connect your wallet before continuing.');
            return;
        }


       eas.connect($signer);

        const values: MerkleValue[] = [
            { type: "string", name: "Name", value: name },
            { type: "uint256", name: "Age", value: age },
            { type: "string", name: "Occupation", value:  occupation},
            { type: "string", name: "Country", value:  country},
        ];
        const privateData = new PrivateData(values);
        const fullTree = privateData.getFullTree();
        
		const schemaEncoder = new SchemaEncoder("bytes32 privateData");
        const encodedData = schemaEncoder.encodeData([
         { name: "privateData", value: fullTree.root, type: "bytes32" },
        ]);
    
       
        const transaction = await eas.attest({
        schema: PRIVATEDATASCHEMA,
        data: {
            recipient: $user,
            expirationTime: NO_EXPIRATION,
            revocable: true,
            data: encodedData,
        },
        });

        const UID = await transaction.wait();
        console.log(UID)
        newAttestationUID = UID
        //save UId.uid to cookies
        localStorage.setItem('personalUID', newAttestationUID); 
        const proofIndexes = [0, 1,2,3]; // Revealing only name and isStudent
        const multiProof = privateData.generateMultiProof(proofIndexes);

        console.log("Multi-proof for selective reveal:", multiProof);


        const jsonString = JSON.stringify(multiProof, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
        }, 2);
        console.log(jsonString);
        // Convert the data to a JSON string

        // Create a Blob from the JSON string
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Generate a URL for the Blob
        downloadUrl = URL.createObjectURL(blob);
        
	}

</script>

<div class="flex flex-col h-fit mt-10 mx-5">
    <h1 class="text-5xl font-bold text-center mb-5 text-white">Register Now to Get Your Identity</h1>
    <p class="text-center text-3xl mb-5 text-white">Please use your private data to register.</p>
    <div class="border-red-500 flex flex-col justify-center items-center space-y-4">
        <div class="flex flex-col w-full max-w-md">
            <label for="name" class="text-white mb-1">Name</label>
            <input
                id="name"
                bind:value={name}
                type="text"
                placeholder="Name"
                class="input input-bordered input-accent text-white"
            />
        </div>
        <div class="flex flex-col w-full max-w-md">
            <label for="age" class="text-white mb-1">Age</label>
            <input
                id="age"
                bind:value={age}
                type="number"
                placeholder="Age"
                class="input input-bordered input-accent text-white"
            />
        </div>
        <div class="flex flex-col w-full max-w-md">
            <label for="occupation" class="text-white mb-1">Occupation</label>
            <input
                id="occupation"
                bind:value={occupation}
                type="text"
                placeholder="Occupation"
                class="input input-bordered input-accent text-white"
            />
        </div>
        <div class="flex flex-col w-full max-w-md">
            <label for="country" class="text-white mb-1">Country</label>
            <input
                id="country"
                bind:value={country}
                type="text"
                placeholder="Country"
                class="input input-bordered input-accent text-white"
            />
        </div>
        <div class="flex gap-5">
            <button
            onclick={createPrivateData}
            class="btn btn-accent mt-5  btn-lg"
        >
            Create Onchain Identity
        </button>
        <button
        onclick={createPrivateDataOffchain}
            class="btn btn-secondary mt-5  btn-lg"
        >
            Create Offchain Identity
        </button>
        <button
        onclick={registerIdentity}
        class="btn btn-accent mt-5  btn-lg"
    >
        Register Identity
    </button>
    <button
    onclick={registerIdentity}
    class="btn btn-secondary mt-5  btn-lg"
>
    Revoke Identity
</button>
        </div>
        
        {#if newAttestationUID}
        <div class="mt-5">
            <h2 class="text-xl font-bold text-white">UID:</h2>
            <p class="text-white"> {newAttestationUID}</p>
            <p class="text-white"> Note: Future Attestations will use this UID as a reference Point</p>
            <a href={downloadUrl} download="PrivateDataID.json" class="btn-accent btn">Download File</a>
            <button
            onclick={verify}
            class="btn btn-secondary mt-5  btn-md"
        >
           Verify
        </button>
            <p class="text-white"> Download your proofs to selectively reveal your data!</p>

        </div>
        {/if}

    </div>

        
 
</div>

<style>



</style>