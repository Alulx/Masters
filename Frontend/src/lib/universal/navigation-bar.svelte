<script lang=ts>
import {  FactoryContractAddress, user } from "$lib/stores";

import { onMount } from "svelte";
import {
  connected,
  provider,
  signer,
  signerAddress,
  contracts
} from 'ethers-svelte'
import { defaultEvmStores } from 'ethers-svelte'


/* defaultEvmStores.attachContract('sbtcontract',contractAddress.SBT, SBT_ABI.abi as AbiItem[])
 */
/**
 * Disconnect all connections form metamask
 */
async function disconnect(){
    await defaultEvmStores.disconnect()
    user.set("No Account Connected")
    localStorage.setItem('isWalletConnected', "false");
    localStorage.setItem('connectedUser', "No Account Connected");
}

async function connect(){
        await defaultEvmStores.setProvider() 
        localStorage.setItem('isWalletConnected', "true");
        let address =  await $signerAddress
        console.log(address)
        user.set(address);
        localStorage.setItem('connectedUser', $user); 
    }
/**
 *  Check if User is still connected after page reload
*/
onMount(async () => {
		if (localStorage?.getItem('isWalletConnected') === 'true'){
            try{
                console.log("Reconnecting...")
                await defaultEvmStores.setProvider();
                 let address =  await $signerAddress
                user.set(address);
                localStorage.setItem('connectedUser', $user);
                localStorage.setItem('isWalletConnected', "true"); 

            } catch (ex){
                console.log(ex);
            }
        }
	});

let address: string;

user.subscribe(value => {
    address = value;
});

</script>

<div class="navbar bg-gradient-to-r from-primary to-secondary w-full gap-2">
    <p class="btn btn-ghost normal-case text-3xl "><a href ='/' >App™</a></p>
    <p class="btn btn-ghost normal-case text-2xl pt-2"><a href ='/register' >Register</a></p>
    <p class="btn btn-ghost normal-case text-2xl pt-2"><a href ='/assign' >Role Assignment</a></p>
    <p class="btn btn-ghost normal-case text-2xl pt-2"><a href ='/manage' >Browse Organisations</a></p>
    <p class="btn btn-ghost normal-case text-2xl pt-2"><a href ='/upload' >Upload Data</a></p>
    <p class="btn btn-ghost normal-case text-2xl pt-2"><a href ='/verify' >Verfication</a></p>
    
    <div style="margin-left:auto;" class=" w-auto gap-5">

        {#if $connected}
        <p class="ml-auto">{$signerAddress}</p>
        {/if}
        {#if $connected}
        <button  on:click={disconnect} class="btn btn-ghost normal-case text-xl">Disconnect </button>
        {:else}
        <button  on:click={connect} class="btn btn-ghost normal-case text-xl">Connect </button>
        {/if}
      
        
    </div>
    
</div>

