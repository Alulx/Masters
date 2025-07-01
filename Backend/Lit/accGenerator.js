import fs from 'fs';

class RessourceAccessControl {
    constructor(orga, allowedRoles) {
      this.orga = orga;
      this.allowedRoles = allowedRoles;
    }
  }
  const verifierContractAddress ="0xf85C7A95F5740b774Dd207E6791F37771A1c23c9"

  // Example usage
  let accessControls = [
    new RessourceAccessControl("0x6905F13A31aC4b5b2a5f34e14720A5E81629Af36", ["DEV_Solidity"]),
    new RessourceAccessControl("0x47ae821718405C9DB0Fb21368f11499095625eaB", ["Sec_Auditer"]),
  ];
  
  function generateAccessControlConditions(accessControls) {
    let evmContractConditions = [];
  
    accessControls.forEach((accessControl, index) => {
      accessControl.allowedRoles.forEach((role) => {
        evmContractConditions.push({
          contractAddress: verifierContractAddress,
          functionName: "doesUserhaveEASRoleAC",
          functionParams: [":userAddress", accessControl.orga, role],
          functionAbi: {
            inputs: [
              {
                internalType: "address",
                name: "_user",
                type: "address",
              },
              {
                internalType: "address",
                name: "_attesterAcontract",
                type: "address",
              },
              {
                internalType: "string",
                name: "_role",
                type: "string",
              },
            ],
            name: "doesUserhaveEASRoleAC",
            outputs: [
              {
                internalType: "bool",
                name: "",
                type: "bool",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
          chain: "sepolia",
          returnValueTest: {
                key: "", // Add the key property here
                comparator: '=',
                value: 'true'
          },
        });
  
        // Add the "or" operator if there are more conditions
        if (index < accessControls.length - 1 || role !== accessControl.allowedRoles[accessControl.allowedRoles.length - 1]) {
          evmContractConditions.push({ operator: "or" });
        }
      });
    });
  
    return evmContractConditions;
  }
  
  // Generate the access control conditions
  const evmContractConditions = generateAccessControlConditions(accessControls);
  console.log(JSON.stringify(evmContractConditions, null, 2));
   fs.writeFileSync('./CurrentEvmContractConditions.json', JSON.stringify(evmContractConditions));

   /* var evmContractConditions = [
  {
    contractAddress: "0xf85C7A95F5740b774Dd207E6791F37771A1c23c9",
    functionName: "doesUserhaveEASRoleAC",
    functionParams: [ ":userAddress","0x6905F13A31aC4b5b2a5f34e14720A5E81629Af36", "DEV_Solidity"  ],
    functionAbi: {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_attesterAcontract",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_role",
          "type": "string"
        }
      ],
      "name": "doesUserhaveEASRoleAC",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
      
    },
    chain: "sepolia",
    returnValueTest: {
      key: "", // Add the key property here
      comparator: '=',
      value: 'true'
    },
  },
]; */
  
