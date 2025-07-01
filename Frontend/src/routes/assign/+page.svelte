<script lang="ts">
	import { EAS, Offchain, SchemaEncoder, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
	import {  NO_EXPIRATION } from '@ethereum-attestation-service/eas-sdk';
	import {
  connected,
  provider,
  chainId,
  signer,
  signerAddress,
  contracts
} from 'ethers-svelte'
	import { defaultEvmStores } from 'ethers-svelte'
	import { ethers } from 'ethers';
  import { schemaUID, user } from '$lib/stores';
  import { derived, writable } from 'svelte/store';
  import { onMount } from 'svelte';

  const attestations = writable([]);
  const filterField = writable('recipient');
  const filterText = writable('');
  const filteredAttestations = derived(
    [attestations, filterText, filterField],
    ([$attestations, $filterText, $filterField]) => {
        if (!$filterText) return $attestations;
        return $attestations.filter(attestation =>
            attestation[$filterField].includes($filterText)
        );
    }
);

let attestationData;

onMount(async () => {
  try {
	console.log("test")
	const response = await fetch('/assign');
	const data = await response.json();
	console.log("test")
	attestationData = data.attestationData;
	alert('Attestation data fetched successfully!');
	console.log("datreal:", attestationData)
	// Create a Blob from the attestation data
	const blob = new Blob([attestationData], { type: 'application/json' });

	// Create a URL for the Blob
	const url = URL.createObjectURL(blob);

	// Create a link element
	const a = document.createElement('a');
	a.href = url;
	a.download = 'attestation.json';

	// Append the link to the body
	document.body.appendChild(a);

	// Programmatically click the link to trigger the download
	a.click();

	// Remove the link from the document
	document.body.removeChild(a);
  } catch (error) {
	console.error('Error fetching attestation data:', error);
  }
});



	// import SchemaUid from .env
	const SchemaUidold = "0xee7a240b5b2c316290e416a0c857db693effd3eb01ca48586ee4e044dc1060ff"

	$: if (connected) {
    console.log(new Date().toLocaleDateString("en-GB"))
	}

	export const SepoliaEASContractAddress = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e'; // Sepolia v0.26
	console.log('EASContractAddress', SepoliaEASContractAddress);

	// Initialize the sdk with the address of the EAS Schema contract address
	const eas = new EAS(SepoliaEASContractAddress);

	// Gets a default provider (in production use something else like infura/alchemy)
	eas.connect($signer);

	// Connects an ethers style provider/signingProvider to perform read/write functions.
	// MUST be a signer to do write operations!

	
	let role: string;
	let recipient: string;
	let id: string;
	let authority: string;
	let RevokeUid: string;

	async function getBalance() {
		const balance = await $provider.getBalance($user);
		console.log( $provider);

		console.log(await $provider.getNetwork());
		console.log('Balance:', balance);
	}

	async function getAttesations(SchemaUid: string) {        
		console.log('Button clicked!');
		const uid = '0xff08bbf3d3e6e0992fc70ab9b9370416be59e87897c3d42b20549901d2cccc3e';
		const attestation = await eas.getAttestation("0x6d5b828bf3f28e44793b0a5386b4362384a2899a8ce364d1e7995901dd65ae08");

		console.log(attestation);
        console.log('Button clicked!');
    }
	async function attestOffCHainRole(id: string, role: string, authority: string, recipient: string) {   
		alert('attesting offchain role');
		const eas = new EAS(SepoliaEASContractAddress);		
		const schemaEncoder = new SchemaEncoder("string Role,address IssuedBy");

		const provider = ethers.getDefaultProvider('sepolia');
		eas.connect(provider);
		const signer = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY_LIT, provider);

		const encodedData = schemaEncoder.encodeData([
			{ name: "Role", value: "any", type: "string" },
			{ name: "IssuedBy", value: "0x8d1038F350110D16330134945A13F524453c4288", type: "address" },
		]);		
		const offchain = await eas.getOffchain();

		const offchainAttestation = await offchain.signOffchainAttestation(
		{
			recipient: '0x8d1038F350110D16330134945A13F524453c4288',
			expirationTime: NO_EXPIRATION, // Unix timestamp of when attestation expires (0 for no expiration)
			time: BigInt(Math.floor(Date.now() / 1000)), // Unix timestamp of current time
			revocable: true, // Be aware that if your schema is not revocable, this MUST be false
			schema: schemaUID,
			refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
			data: encodedData
		},
		signer
		);
	}

	async function attestRole(id: string, role: string, authority: string, recipient: string) {   
		if (!id || !role || !authority || !recipient) {
            alert('Please fill in all the fields before attesting a role.');
            return;
        }     
		console.log("recipient", recipient);
		const eas = new EAS(SepoliaEASContractAddress);
		// Signer must be an ethers-like signer.
		// Initialize SchemaEncoder with the schema string
		const schemaEncoder = new SchemaEncoder("bytes32 roleId,string role,bytes32[] authoriztations");
		const encodedData = schemaEncoder.encodeData([
			{ name: "roleId", value: "01", type: "bytes32" },
			{ name: "role", value: "editor", type: "string" },
			{ name: "authoriztations", value: ["0x0000000000000000000000000000000000000000000000000000000000000777"], type: "bytes32[]" },
		]);										  
			eas.connect($signer);

			const tx = await eas.attest({
			schema: schemaUID,
			data: {
				recipient: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				expirationTime: NO_EXPIRATION,
				revocable: true, // Be aware that if your schema is no t revocable, this MUST be false
				data: encodedData,
			},
		});
		const newAttestationUID = await tx.wait();
		console.log("New attestation UID:", newAttestationUID);
	}

	async function revokeRole(Uid: string) {
		if (!RevokeUid) {
            alert('Please fill in the RevokeUid field before revoking a role.');
            return;
        }
		console.log("revoking", Uid);
		const transaction = await eas.revoke({
			schema: schemaUID,
			data:{
				uid: Uid,
			},
		});
		const rrr = await transaction.wait();
		console.log("revoked", rrr);

	}




  function getGames(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
    throw new Error('Function not implemented.');
  }


  async function isRevoked() {        
		const uid = '0x6d5b828bf3f28e44793b0a5386b4362384a2899a8ce364d1e7995901dd65ae08';
		const attestation = await eas.isAttestationRevoked(uid)

		console.log(attestation);
        console.log('Button clicked!');
    }

	async function fetchAttestations() {
        const query = `
            query Attestations($where: SchemaWhereUniqueInput!) {
				schema(where: $where) {
					attestations {
					id
					recipient
					attester
					time
					timeCreated
					expirationTime
					revocationTime
					revoked
					decodedDataJson
					}
				}
			}
        `;

        const variables = {
            where: {
                id: schemaUID,
            }
        };
// https://sepolia.easscan.org/graphql
// http://localhost:4000/
        const response = await fetch('https://sepolia.easscan.org/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables
            }),
        });

        const result = await response.json();
		attestations.set(result.data.schema.attestations);

        console.log(result);
    }

	onMount(() => {
        fetchAttestations();
    });




	function getRole(decodedDataJson) {
        try {
            const decodedData = JSON.parse(decodedDataJson);
            const roleField = decodedData.find(field => field.name === 'role');
            return roleField ? roleField.value.value : 'N/A';
        } catch (error) {
            console.error('Error parsing decoded data:', error);
            return 'N/A';
        }
    }

</script>
<!-- <div class="m-10 flex flex-col border w-20 h-20">
	<div class="border basis-1/3 ">
		HALLO 
	</div>
	<div class="border basis-2/3 overflow-auto" >
		HALLO Wellt
		HALLO Wellt
		HALLO Wellt

	</div>
</div>
 -->
    <div class="flex flex-col border h-fit mt-5 mx-5">
        <div class=" border-red-500 flex flex-col justify-center items-center border basis-1/3    ">
            <div class="flex gap-1 m-1">
				<button class="btn btn-accent btn-lg "
					on:click={() => attestOffCHainRole("1", 'editor', "777", recipient)}
					><span class=" text-3xl text-white">attest new offchain role</span>
				</button>
				<button class="btn btn-accent btn-lg "
					on:click={() => attestRole("1", 'editor', "777", recipient)}
					><span class=" text-3xl text-white">attest new role</span>
				</button>
				<input
					bind:value={recipient}
					type="string"
					placeholder="recipient"
					class="input mt-3  text-white input-bordered input-accent "
				/>
				<input
					bind:value={role}
					type="string"
					placeholder="role"
					class="input mt-3 text-white input-bordered input-accent "
				/>
				<input
					bind:value={id}
					type="string"
					placeholder="id"
					class="input mt-3  text-white input-bordered input-accent "
				/>
				<input
					bind:value={authority}
					type="string"
					placeholder="authority"
					class="input mt-3 text-white  input-bordered input-accent "
				/>
				
			</div>
			<div class="flex gap-1 m-1">
				<button class="btn btn-accent btn-lg "
				on:click={() => revokeRole(RevokeUid)}
				><span class=" text-3xl text-white">Revoke Role</span>
			</button>
			<input
				bind:value={RevokeUid}
				type="string"
				placeholder="RevokeUid"
				class="input mt-3 input-bordered input-accent text-white "
			/>

			</div>
		

			<button class="btn btn-accent btn-lg "
                on:click={() => getAttesations(schemaUID)}
                ><span class=" text-3xl text-white">get Attestations</span>
            </button>
            
            
        </div>

        <div class="border basis-2/3 overflow-auto m-5 border-gray-500  ">
		<!-- 	 <button class="btn btn-accent btn-lg "
				on:click={() => isRevoked()}
				><span class=" text-3xl text-white">isRevoked</span>
			</button>

			<button class="btn btn-accent btn-lg "
				on:click={() => fetchAttestations()}
				><span class=" text-3xl text-white">test</span>
			</button> -->
			<div class="flex items-center ">
				<span class="text-5xl text-white">The last Attestations</span>
				<button class="btn  btn-rounded ml-auto btn-accent" 
					on:click={fetchAttestations}>
					<span class=" text text-white">Refresh &#x21bb</span>
				</button>
				<select class="select select-bordered ml-5 text-gray-400" bind:value={$filterField}>
					<option value="recipient">Recipient</option>
					<option value="attester">Attester</option>

				</select>
				<input
					type="text"
					placeholder="Filter attestations"
					class="input input-bordered ml-5 text-white"
					on:input={(e) => filterText.set(e.target.value)}
				/>
			</div>
        

			<div class="flex items-center  border mx-auto overflow-auto gap-1 mt-5">
				{#each $filteredAttestations as attestation}
					<div class="w-full border border-neutral p-5 mb-5 shadow-lg rounded-lg bg-white text-black">
						<p><strong>ID:</strong> {attestation.id}</p>
						<p><strong>Recipient:</strong> {attestation.recipient}</p>
						<p><strong>Attester:</strong> {attestation.attester}</p>
						<p><strong>Time:</strong> {new Date(attestation.time * 1000).toLocaleString()}</p>
						<p><strong>Expiration Time:</strong> {attestation.expirationTime ? new Date(attestation.expirationTime * 1000).toLocaleString() : 'N/A'}</p>
						<p><strong>Revocation Time:</strong> {attestation.revocationTime ? new Date(attestation.revocationTime * 1000).toLocaleString() : 'N/A'}</p>
						<p><strong>Revoked:</strong> {attestation.revoked ? 'Yes' : 'No'}</p>
						<p><strong>Role:</strong> {getRole(attestation.decodedDataJson)}</p>
					</div>
				{/each}
			</div>
            <!-- if games avaialble show them otherwise say no page online right now -->
        </div>
    </div> 
   

<style>



</style>