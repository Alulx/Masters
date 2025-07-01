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
  import { FactoryContractAddress, schemaUID,  SepoliaEASContractAddress,  user } from '$lib/stores';
  import { derived, writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import  orgaFactoryAbi from "../../../../artifacts/contracts/orgaFactory.sol/orgaFactory.json"
  import type { Orga } from '$lib/types/interfaces';
  
    let searchQuery = '';
	let orgaName: string = $state('');
	let orgas: Orga[] = $state([]);
	let loading: boolean = true;
	defaultEvmStores.attachContract('orgaFactory', FactoryContractAddress, JSON.stringify(orgaFactoryAbi.abi))

	// Initialize the sdk with the address of the EAS Schema contract address
	const eas = new EAS(SepoliaEASContractAddress);

	 onMount(async () => {
		while (!$contracts.orgaFactory) {
			$inspect('Waiting for contracts to load...');
			await new Promise(resolve => setTimeout(resolve, 100));

		}
			getOrgasFront();
		
	});

	async function getOrgasFront() {
		const addr: string[] = await $contracts.orgaFactory.getOrgas();
		let tmpOrgas: Orga[] = [];
		for (let i = 0; i < addr.length; i++) {
			const orgaName = await $contracts.orgaFactory.orgaAddressToOrgaName(addr[i]);
			tmpOrgas.push({ orgaAdress: addr[i], orgaName: orgaName });
		}
		orgas = tmpOrgas;

	}

	async function createOrga(orgaName: string) {
		//check if organame is not empty
		if (!orgaName) {
			alert('Please fill in all the fields before creating a new orga.');
			return;
		}
		const address = await $contracts.orgaFactory.createOrga(orgaName);
		console.log("address", address);
	}

	async function orgaAddressToOrgaName(orga: string) {
    	const name = await $contracts.orgaFactory.getOrgaName(orga);
		return name;
	}
	
    function searchOrga() {
        // Implement search functionality here
        console.log("Searching for:", searchQuery);
    }
	function redirectToOrga(address) {
        window.location.href = "organisation/"+address;
    }

</script>


<div class="flex flex-col items-start justify-start h-screen p-5">
    <div class="flex justify-center w-full mb-5 ">
        <div class="flex justify-center w-4/5 gap-5" >
			<div>
				<input type="text" bind:value={searchQuery} placeholder="Search Organizations" class="text-white p-2 border rounded " />
				<button on:click={searchOrga} class="text-white p-2 bg-blue-500  rounded mr-2">Search</button>
			</div>
            <div>
				<input type="text" bind:value={orgaName} placeholder="Organization Name" class="p-2 border rounded text-white" />
				<button on:click={() => createOrga(orgaName)} class="p-2 btn btn-accent text-white rounded">Create New Organization</button>
			</div>
        
        </div>
    </div>

    <div class=" flex items-start justify-center w-full ">
        <div class="w-4/5 bg-gray-800 text-white p-5 rounded-lg shadow-lg">
            <h2 class="text-xl mb-4">Organizations</h2>
            <div>
                {#each orgas as orga}
                    <div class="p-2 mb-2 bg-gray-700 rounded cursor-pointer" on:click={() => redirectToOrga(orga.orgaAdress)}>
                        <p>{orga.orgaName} ({orga.orgaAdress})</p>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>