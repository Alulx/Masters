import { ethers } from 'ethers';
import orgaFactoryAbi from "../../../../../artifacts/contracts/orgaFactory.sol/orgaFactory.json";
import ACcontractAbi from "../../../../../artifacts/contracts/orgaFactory.sol/ACcontract.json";
import { FactoryContractAddress, schemaUID } from '$lib/stores';
import * as dotenv from "dotenv";


dotenv.config();
const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`);
const orgaFactory = new ethers.Contract(FactoryContractAddress, orgaFactoryAbi.abi, provider);




export async function load({ params, cookies }) {
    const { slug } = params;
    let orgaName;
    let roles;
    let isUserAuthorized: boolean;
    let isOrgaTerminated: boolean;
    let founder; 
    let attestations
    let resourceCount;
    let resources;

    try {
      const acContract = new ethers.Contract(slug, ACcontractAbi.abi, provider);

      attestations = await fetchAttestations();
      //get all elements of attestations
      //const filteredAttestations = filterAttestations(attestations, slug);
      //console.log(filteredAttestations);
      //console.log(attestations);
  
      orgaName = await orgaFactory.orgaAddressToOrgaName(slug);
      roles = await acContract.getRoles();
      founder = await acContract.founder();
      resourceCount = await acContract.resourceCount();
      isOrgaTerminated = await acContract.orgaTerminated();
      resources = await acContract.getResources();
      console.log(resources);
      
    } catch (error) {
      console.error('Error fetching organization:', error);
      return {
        status: 404,
        error: new Error('Organization not found')
      };
    }
    console.log(roles)
    return {
      props: {
        orgaAddress: slug,
        orgaName,
        roles,
        founder,
        resourceCount,
        resources,
        isOrgaTerminated,
        attestations,
      }
    };
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
  let attestations = (result.data.schema.attestations);
  console.log(result);

  return attestations;
}

//function to check if the attester address is equal to the contract address slug and see if it has been revoked
function filterAttestations(attestations: string[], addressToFilter: string) {
return attestations.filter((attestation: any) => attestation.attester === addressToFilter && attestation.revoked === false);
};
