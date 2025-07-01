
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import { Attestation, AttestationRequest, AttestationRequestData,RevocationRequest, RevocationRequestData } from "./easTypes.sol";
import { RessourceAccessControl, AccessType, Role, Resource, schemaData} from "./Types.sol";

interface IEAS {
       function getAttestation(bytes32 uid) external view returns (Attestation memory);
       function isAttestationValid(bytes32 uid) external  view returns (bool);
}

interface IACcontract {
    function getUserToRoles(address adr) external view returns (string[] memory);
    function internalEASRoleExists(string memory roleName) external view returns (bool);

}

contract Verifier {
    IEAS public eas = IEAS(0xC2679fBD37d54388Ce493F1DB75320D236e1815e);
    
        //address _User will later be filled by the litparams
    function doesUserhaveEASRoleAC(address _user , address _attesterAcontract, string memory _role) public view returns (bool) {
        IACcontract newACcontract = IACcontract(_attesterAcontract);

        require(newACcontract.internalEASRoleExists(_role), "Role does not exist in in the AC contract");   
        string[] memory roles = newACcontract.getUserToRoles(_user);

        for (uint256 i = 0; i < roles.length; i++) {
            if (keccak256(abi.encodePacked(roles[i])) == keccak256(abi.encodePacked(_role))) {
                return true;
            }
        }
        return false; 
    }
    
    

    /*
    * Function to fetch attestations for multiple UIDs
    * @param uids: array of UIDs to fetch attestations for
    * @return array of Attestation structs
    */
    function fetchAttestations(bytes32[] memory uids) internal view returns (Attestation[] memory) {
        Attestation[] memory attestations = new Attestation[](uids.length);
        uint64 count = 0;
        for (uint64 i = 0; i < uids.length; i++) {
            if (eas.isAttestationValid(uids[i])) {
                attestations[count] = eas.getAttestation(uids[i]);
                count++;
            }  
        }
        return attestations;
    }


    /*
    * Function to check eas attestation of a user (rolename)
    */
    function doesUserhaveRoleEAS(string memory role_, address user_, bytes32[] memory uids_, address attesterOrganisation_) public view returns (bool) {

        Attestation[] memory attestations = fetchAttestations(uids_);

        for (uint256 i = 0; i < attestations.length; i++) {
            // Check if the attestation is about _user and not expired
            if (attestations[i].recipient == user_ && (attestations[i].expirationTime == 0 || block.timestamp < attestations[i].expirationTime) && attestations[i].attester == attesterOrganisation_) {
                // Parse the data to verify the role
                // Assuming the data contains the role as a string
                if (keccak256(abi.encodePacked(role_)) == keccak256(abi.encodePacked(getRoleFromData(attestations[i].data)))) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function getRoleFromData(bytes memory data_) public pure returns (string memory) {
        schemaData memory schema = decodeSchemaData(data_);
        return schema.Role;
    }

    function decodeSchemaData(bytes memory data_) public pure returns (schemaData memory) {
        ( string memory role, address issuer ) = abi.decode(data_, ( string, address));
        return schemaData( role, issuer);
    }

}

