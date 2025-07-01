<script lang="ts">
  import ACcontractAbi from "../../../../../artifacts/contracts/orgaFactory.sol/ACcontract.json";
  //import EASTEST2 from "../../../../../artifacts/contracts/orgaFactory.sol/EASTEST2.json";
  import {page} from '$app/stores';
  import {
    connected,
    provider,
    chainId,
    signer,
    signerAddress,
    contracts,
    defaultEvmStores
  } from 'ethers-svelte'
import { user } from "$lib/stores";
  import { onMount } from "svelte";
 
  let { data } = $props();
  let slug: any;

    let roleName: string = $state('Viewer');
    let authorization: string = $state('view');
    let recipient: string= $state('0x353D43FbA89263806e7C7Ac509AA54f6563103cf');
    let role: string= $state('Viewer');
    let cid: string= $state('QmZ6x4u8GowdkXm9x2BrsJETz5aRQRjiJRjAqBgUoaKMVk');
    let orgaAdress: string= $state(slug);
    let searchResult: string = $state("");
    let selectedRoles: string = $state("");
    let expirationTime: number = $state(0);
    let revocable: string = $state('true');

    let smartContractOrganizationalAccess: boolean = $state(false);
    let hasOrganizationalAccess: boolean = $derived(smartContractOrganizationalAccess || data.props.founder === $user);
    let mode = $state('addResource');

    $effect(() =>{
      console.log(mode);
    })

    $effect(() => {
      slug = $page.params.slug;
    
    });


    // Attach the contract using the [slug] parameter
    $effect(() => {
      if (slug) {
        defaultEvmStores.attachContract('ACcontract', slug, JSON.stringify(ACcontractAbi.abi));
       // defaultEvmStores.attachContract('EASTEST2', '0x230e6EdC95F692Cf08Ec2E8A74FEee3Ff96D792F', JSON.stringify(EASTEST2.output.abi));
      }
    });

  onMount(async () => {
    //console.log(await $contracts.ACcontract.resourceCount());

    smartContractOrganizationalAccess =  await $contracts.ACcontract.userToOrganisationalAccess($user);
  });



    async function getRoleFront() {
      const roles = await $contracts.ACcontract.getRoles();
      return roles;
    }


    async function doesUserHaveRoleFront() {
     // function doesUserhaveRole(string memory role_, address user_, bytes32[] memory uids_, address attesterOrganisation_) public view returns (bool) {

    }

    function formatRoles(_roles: string) {
      console.log("roles", _roles);
      return _roles.split(',').map(role => role.startsWith('0') ? `<br>${role}` : role).join(' ');
    }
    async function attestRoleFront() {

      if (!recipient || !role || !revocable ) {
        console.error('Recipient and role must not be empty');
        alert('Role name and authorization must not be empty');
        return;
      }

      //check if any element in roles array has the name of role
      const roles = await getRoleFront();
      let roleFound = false;

      for (let i = 0; i < roles.length; i++) {
       
        if (roles[i].name == role) {
          console.log("role found",roles[i].name);
          roleFound = true;

          break;
        } 
      }

      if (!roleFound) {
        console.error('Role not found');
        alert('Role not found');
        return;
      }
      
      try {
        const result = await $contracts.ACcontract.attestRole(recipient, role, expirationTime, /* revocable, */ {
         /*  value: 0,
           gasLimit: 60000000 // Set the gas limit manually */
        });      console.log("attested role", result);
        return result;
      } catch (error) {
        console.error('Error attesting role:', error);
        handleRevertMessage(error);

      }
    }

    async function addRoleFront() {

    if (!roleName || roleName=='') {
      console.error('Role name must not be empty');
      alert('Role name must not be empty');
      return;
    }

    let mappedAuthorization = authorization === 'view' ? 0 : 1;
    try {
      const result = await $contracts.ACcontract.addRole(roleName, mappedAuthorization, );
      console.log("added role", result);
      return result;
    } catch (error) {
      console.error('Error adding role:', error);
      handleRevertMessage(error);

    }
  }

    async function addResources(){
      if (!cid || cid=='') {
        console.error('CID must not be empty');
        alert('CID must not be empty');
        return;
      }
      const accesscontrol = [
      [
        "0x7CFe6a051e206a4AC34805De144f4e9705960301", 
          [
              "Guest", 
          ],
        
      ],
      [
        "0x27478D4f5920D9E6ff056c29A1Ad86875Fda2565", 
          [
              "Editor",
              "Viewer" 
          ],
        
      ],
     ]
      try {
        const result = await $contracts.ACcontract.registerInternalResource(cid, accesscontrol);
        console.log("added resource", result);
        return result;
      } catch (error) {
        console.error('Error adding resource:', error);
        handleRevertMessage(error);
      }
    }

  function handleRevertMessage(error: any) {
    if (error.data && error.data.message) {
      alert(`Revert message: ${error.data.message}`);
    } else if (error.message) {
      alert(`Error: ${error.message}`);
    } else {
      alert('An unknown error occurred');
    }
  }

  function getRoleFromData(decodedDataJson) {
        try {
            const decodedData = JSON.parse(decodedDataJson);
            const roleField = decodedData.find(field => field.name === 'Role');
            return roleField ? roleField.value.value : 'N/A';
        } catch (error) {
            console.error('Error parsing decoded data:', error);
            return 'N/A';
        }
    }

    
	function getUsersByRole(roleName: string, attestations: any) {
    let allUsers = [];
    for (let i = 0; i < attestations.length; i++) {
      const decodedData = attestations[i].decodedDataJson;
      if(getRoleFromData(decodedData) == roleName){
        allUsers.push(attestations[i].recipient);
      }
    } 
    if(allUsers.length == 0){
      return 'No members yet ';
    }
    return allUsers;
  }

  function setMode(newMode) {
    mode = newMode;
  }

	async function SearchOrga() {
    defaultEvmStores.attachContract('ACcontract', orgaAdress, JSON.stringify(ACcontractAbi.abi));

		const addr: string = await $contracts.ACcontract.getRoles();

    searchResult = addr;
    console.log("search result", addr);
	}

  async function addToSearchedRoles() {
    selectedRoles = role;
  }

</script>
 
<main class="p-5 mx-5">
  <h1 class="text-5xl font-bold mb-4 text-white ">{data.props.orgaName}</h1>


  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="card bg-gray-800 text-white shadow-xl">
      <div class="card-body">
        <h2 class="card-title pb-2">Organization Info</h2>
        <p><strong>Address:</strong> {data.props.orgaAddress}</p>
        <p><strong>Founder:</strong> {data.props.founder}</p>
        <p><strong>Resources under Management:</strong> {data.props.resourceCount}</p>

        <p><strong>Organization Terminated:</strong> {data.props.isOrgaTerminated ? 'Yes' : 'No'}</p>
        <p><strong>Organizational Access Granted:</strong> {hasOrganizationalAccess ? 'Yes' : 'No'}</p>

      </div>
    </div>

    <div class="card bg-gray-800 text-white shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Roles</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each data.props.roles as role}
            <div class="card bg-primary text-white shadow-md w-full">
              <div class="card-body">
                <p><strong>Name:</strong> {role[0]}</p>
                <p><strong>Permissions:</strong> {role[1] == 0 ? 'View' : role[1] == 1 ? 'View, Edit' : 'unknown'}</p>
                <p><strong>Members:</strong></p> <p class="text-sm -mt-2 ">{getUsersByRole(role[1], data.props.attestations)} </p>

              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>


  <!-- if user has organizational access then shoow this part otherwise tell him to fuck off-->
  {#if hasOrganizationalAccess }
  <div class="mt-5">
    <h2 class="text-2xl font-bold mb-4 text-white ">Actions</h2>
    <button class="btn btn-primary " onclick={() => setMode('adding')}>Add Role</button>
    <button class="btn btn-primary" onclick={() => setMode('attesting')}>Attest Role</button>
    <button class="btn btn-primary" onclick={() => setMode('addResource')}>Add Resource</button>

    <button class="btn btn-primary" onclick={() => setMode('attestations')}>Show all Attestations</button>
    <button class="btn btn-primary" onclick={() => setMode('resources')}>Show all Resources</button>

  </div>
 
  {#if mode == 'attesting'}
  <div class="mt-5">
    <input
      bind:value={recipient}
      type="text"
      placeholder="Recipient"
      class="input mt-3 text-white input-bordered input-accent"
    />
    <input
      bind:value={role}
      type="text"
      placeholder="Role"
      class="input mt-3 text-white input-bordered input-accent"
    />
    <input
      bind:value={expirationTime}
      type="text"
      placeholder="Expiration Time, 0 for none"
      class="input mt-3 text-white input-bordered input-accent"
    />
    <input
      bind:value={revocable}
      type="text"
      placeholder="Revocable?"
      class="input mt-3 text-white input-bordered input-accent"
   />

    <button class="btn btn-accent mt-3" onclick={attestRoleFront}>Confirm Attest Role</button>
  </div>
  {/if}

  {#if mode == 'adding'}
    <div class="mt-5">
      <input
        bind:value={roleName}
        type="text"
        placeholder="Role Name"
        class="input mt-3 text-white input-bordered input-accent"
      />
      <select bind:value={authorization} class="select mt-3 text-white select-bordered select-accent">
        <option value="view">View</option>
        <option value="edit">Edit</option>
      </select>
      <button class="btn btn-accent mt-3" onclick={addRoleFront}> Add Role</button>
    </div>
    {/if}

    {#if mode == 'addResource'}
    
    <div class="mt-5 flex justify-between">
      <div class="flex  gap-5">
        <input
        bind:value={cid}
        type="text"
        placeholder="cid"
        class="input mt-3 text-white input-bordered input-accent"
      />
      <button class="btn btn-accent mt-3" onclick={addResources}>Confirm Add Resource</button>
      {#if selectedRoles}
        <div class="mt-3">
          <p><strong>Selected Roles:</strong> {selectedRoles}</p>
        </div>
      {/if}
      </div>
      
      <div class="flex gap-5">
      
        <input
          bind:value={orgaAdress}
          type="text"
          placeholder="search for orga"
          class="input mt-3 text-white input-bordered input-accent"
        />
        <button class="btn btn-accent mt-3" onclick={SearchOrga}>Search</button>
        
      </div>
      
    </div>
    {#if searchResult}
    <div class="mt-5 text-white gap-5">
      Search Result:
      {#each searchResult as result}
      <div class="card bg-gray-700 text-white shadow-md border w-64  mt-2">
        <div  class="card-body  gap-10">
            <p><strong class="text-white"></strong> {result}</p>
        </div>
      </div>
      {/each}
    </div>
    {/if}
   

    {/if}

    {#if mode === 'attestations'}
      <div class="mt-5 overflow-auto h-96 border ">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {#each data.props.attestations as attestation}
            <div class="card bg-gray-700 text-white shadow-md">
              <div class="card-body">
                <p><strong>ID:</strong> {attestation.id}</p>
                <p><strong>Recipient:</strong> {attestation.recipient}</p>
                <p><strong>Attester:</strong> {attestation.attester}</p>
                <p><strong>Time:</strong> {attestation.time}</p>
                <p><strong>Time Created:</strong> {attestation.timeCreated}</p>
                <p><strong>Expiration Time:</strong> {attestation.expirationTime}</p>
                <p><strong>Revocation Time:</strong> {attestation.revocationTime}</p>
                <p><strong>Revoked:</strong> {attestation.revoked ? 'Yes' : 'No'}</p>
                <p><strong>Decoded Data:</strong> {JSON.stringify(attestation.decodedDataJson)}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    {#if mode === 'resources'}
      <div class="mt-5 overflow-auto h-96   ">
        <div class=" gap-4  w-fit">
          {#each data.props.resources as resource}
            <div class="card bg-gray-700 text-white shadow-md ">
              <div class="card-body  ">
                <p><strong>CID:</strong> {resource[0]}</p>
                <p><strong>Owner:</strong> {resource[1]}</p>
                <p><strong>allowed Roles:</strong> </p>
                {#each resource[2] as role}
                  <p><strong></strong> {role}</p>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  
  {:else}
  <div class="flex justify-center  h-screen">
    <div class="bold text-white text-5xl  pt-20">
      You do not have organizational Access
    </div>
  </div>
  {/if}


</main>