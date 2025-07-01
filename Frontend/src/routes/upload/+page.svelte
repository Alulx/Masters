<script>
  let file;
  let accessControlConditions = [];

  function handleFileUpload(event) {
    file = event.target.files[0];
    console.log(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    file = event.dataTransfer.files[0];
    console.log(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function addContractAddress() {
    accessControlConditions = [...accessControlConditions, { contractAddress: '', roles: [''] }];
  }

  function addRole(index) {
    accessControlConditions[index].roles = [...accessControlConditions[index].roles, ''];
  }

  function updateContractAddress(index, event) {
    accessControlConditions[index].contractAddress = event.target.value;
  }

  function updateRole(contractIndex, roleIndex, event) {
    accessControlConditions[contractIndex].roles[roleIndex] = event.target.value;
  }
</script>

<div class="flex flex-col items-center justify-center h-screen text-center">
  <div class="text-5xl mb-4 text-white">Upload your file</div>
  <div class="flex space-x-4">
    <div 
      class="border-2 border-dashed border-gray-400 rounded-lg p-8 w-80 h-48 flex items-center justify-center mt-4 hover:border-gray-600"
      on:drop={handleDrop} 
      on:dragover={handleDragOver}
    >
      <input type="file" on:change={handleFileUpload} class="hidden" id="fileInput" />
      <label for="fileInput" class="cursor-pointer text-white">Drop file here or click to upload</label>
    </div>

    <div class="border-2 border-gray-400 rounded-lg p-4 w-80 h-auto flex flex-col mt-4 max-h-96 overflow-y-auto">
      <div class="text-xl mb-2 text-white">Access Control Conditions</div>
      {#each accessControlConditions as condition, contractIndex}
        <div class="mb-4">
          <input 
            type="text" 
            placeholder="Contract Address" 
            class="border p-2 w-full mb-2" 
            on:input={(event) => updateContractAddress(contractIndex, event)} 
            value={condition.contractAddress}
          />
          {#each condition.roles as role, roleIndex}
            <input 
              type="text" 
              placeholder="Role" 
              class="border p-2 w-full mb-2" 
              on:input={(event) => updateRole(contractIndex, roleIndex, event)} 
              value={role}
            />
          {/each}
          <button class="btn btn-secondary text-white p-2 rounded" on:click={() => addRole(contractIndex)}>Add Role</button>
        </div>
      {/each}
      <button class="btn-primary btn text-white p-2 rounded" on:click={addContractAddress}>Add Contract Address</button>
    </div>
  </div>
</div>