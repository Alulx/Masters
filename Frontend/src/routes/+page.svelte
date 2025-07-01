<script>
    // You can add any necessary JavaScript here
</script>

<div class="container flex flex-col items-center text-center p-5 ml-auto mr-auto  max-w-fit">
    <div class="welcome-description w-full bg-secondary text-white p-5 rounded-lg">
        <div class="text-5xl mb-5">Welcome</div>
        <div class="text-xl">
            <p>1. Assign some roles to someone</p>
            <p>2. Upload data to the network</p>
            <p>3. Verify access control</p>
        </div>
    </div>
    <div class="boxes flex justify-around mt-8 w-full">
        <div class="box border border-neutral p-5 w-1/3 shadow-lg rounded-lg bg-secondary text-white">
            <h3 class="mb-3 text-2xl">Assign Roles</h3>
            <p>Assign roles to users in the system.</p>
            <button class="mt-3 px-5 py-2 bg-primary text-white rounded" on:click={() => window.location.href='/assign'}>Go to Role Assignment</button>
        </div>
        <div class="box border border-neutral p-5 w-1/3 shadow-lg rounded-lg bg-secondary text-white">
            <h3 class="mb-3 text-2xl">Upload Data</h3>
            <p>Upload your data to the network.</p>
            <button class="mt-3 px-5 py-2 bg-primary text-white rounded" on:click={() => window.location.href='/upload'}>Go to Upload</button>
        </div>
        <div class="box border border-neutral p-5 w-1/3 shadow-lg rounded-lg bg-secondary text-white">
            <h3 class="mb-3 text-2xl">Verify Access</h3>
            <p>Verify access control for users.</p>
            <button class="mt-3 px-5 py-2 bg-primary text-white rounded" on:click={() => window.location.href='/verify'}>Go to Verify</button>
        </div>
    </div>
</div>