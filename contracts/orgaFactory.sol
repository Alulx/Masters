// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;
import "@openzeppelin/contracts/proxy/Clones.sol";
//import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/*
    2 contracts: GuessingFactory and GuessingGame
    GuessingFactory is the factory contract that creates new GuessingGame contracts
    GuessingGame is the contract that players interact with


*/

string constant VERSION = "0.4";

/*
* 1. Create orga contract using the factory
* 2. Define Roles to use during RBAC and give authorizations for that role space accordingly
* 3. Attest roles using EAS, Resolver will check if Role is predefined and attest if it is defined
* 4. orga contract can get attestations using uid and see if a user has a certain role (perhaps lets find out)
* 5. If we're able to deduce roles from attestation we dont need to assign roles, it might bee useful to map them here as well, but not necessary nor ideal
* 
*/

contract orgaFactory  {
    event NewOrga(address indexed creator, address orga);

    mapping(address => address[]) public userToOrgas;
    // The global mapping for the name and address of all orgas
    mapping(address => string) public orgaAddressToOrgaName;

    address[] public orgas;


    string public constant version = VERSION;

    address public logicContractAddress;

    constructor(address _masterContract) {
        require(_masterContract != address(0), "Invalid contract address");
        logicContractAddress = _masterContract;
    }
    /*
    * Function to create new GuessingGame
    * @param _feeAmount: amount of Ether in Wei to be wagered
    */
    function createOrga(string calldata name_ ) external  returns (address)  {
        require(bytes(name_).length > 0, "name_ cannot be empty");

        address newOrga = Clones.clone(logicContractAddress) ;
        // since the clone create a proxy, the constructor is redundant and you have to use the initialize function
        ACcontract(newOrga).initialize(msg.sender,  name_, address(this)); 

        orgas.push(newOrga);    
        userToOrgas[msg.sender].push(newOrga);
        orgaAddressToOrgaName[newOrga] = name_;

        emit NewOrga(msg.sender, newOrga);
        //console.log("new orga deployed on: ", newOrga);

        return newOrga;
    } 

    function getOrgasByUser(address user) external view returns (address[] memory) {
        return userToOrgas[user];
    }
    
    function getOrgas() external view returns(address[] memory){
        return orgas;
    }

    function doesOrgaExist(address orga) external view returns (bool) {
        return bytes(orgaAddressToOrgaName[orga]).length != 0;
    }
}




/*---------------------- AC CONTRACT ----------------------*/
import { Attestation, AttestationRequest, AttestationRequestData,RevocationRequest, RevocationRequestData } from "./easTypes.sol";
import { RessourceAccessControl, AccessType, Role, Resource, schemaData} from "./Types.sol";

interface IEAS {
       function attest(AttestationRequest calldata request) external payable returns (bytes32);
       function revoke(RevocationRequest calldata request) external payable returns (bytes32);
           function getAttestation(bytes32 uid) external view returns (Attestation memory);
       function isAttestationValid(bytes32 uid) external  view returns (bool);
}

interface IOrgaFactory {
    function doesOrgaExist(address orga) external view returns (bool);
}

interface IACcontract {
    function registerResource(string memory _cid,  AccessControl[] calldata  _accessControl  ) external returns (bool);
    function internalEASRoleExists(string memory roleName) external view returns (bool);
}

interface IRegistry {
    function isUserRegistered(address user) external view returns (bool);
    function getUID(address user) external view returns (bytes32);
}
    

// Use indexer to get attestation data
// use resolver to set specific roles predefined
// Scheema wäree rolle + attestor contract um rollen zu checken 


contract ACcontract is AccessControl{

    bytes32 public constant SCHEMAUID = 0xbcce81c34bf6265924043d64fd27bbd676a99aa76a2b59821bd32e9b51ae5588;

    IOrgaFactory public factory;
    IRegistry public registry;
    IEAS public eas;
    
    bytes32 public constant ResourceAdder = keccak256("ResourceAdder");
    bytes32 public constant EASRoleAdder = keccak256("EASRoleAdder");
    bytes32 public constant InternalRoleAdder = keccak256("InternalRoleAdder");
    bytes32 public constant ContractAdmin = keccak256("ContractAdmin");


    string public orgaName;
    bool public orgaTerminated;
    bool public hasInitialized;
    string public version;
    address public founder;

    // better gas efficiency
    mapping(uint => Resource) public resources;
    uint public resourceCount; 
    
    mapping(address => string[]) public userToRoles;
    Role[] public roles;
   // mapping(address => bool) public userToOrganisationalAccess;
    //mapping(address => Role[]) public userToRoles;


     modifier isACtiveOrga() {
        require(hasInitialized, "Orga has not been initialized");
        require(!orgaTerminated, "Orga has been terminated");
        {
        _;
        return;
        }
    }
 
 
    function initialize(address _owner, string  memory _name, address _factoryAddress  ) external {
        require(_owner != address(0), "Invalid owner address");
        require(hasInitialized == false, "Session has already been initialized");
        
        // Seting up the roles
        
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(ContractAdmin, _owner);
        _grantRole(ResourceAdder, _owner);
        _grantRole(EASRoleAdder, _owner);
        _grantRole(InternalRoleAdder, _owner);

        _setRoleAdmin(ResourceAdder, ContractAdmin);
        _setRoleAdmin(InternalRoleAdder, ContractAdmin);

        //setup contracts
        eas = IEAS(0xC2679fBD37d54388Ce493F1DB75320D236e1815e);
        registry = IRegistry(0xa38Bf8d18585CF44007D3B3E6f96CEa9b1faaC6D);
        //Setup other data

        founder = _owner;
        version = VERSION;
        hasInitialized = true;
        factory = IOrgaFactory(_factoryAddress);
        orgaName = _name;
        orgaTerminated = false; 

      //  commitDeadline = block.timestamp + 1 days; // set the deadline to 1 day from now

       // console.log("Deploying GuessingGame with founder: ", founder);
       // console.log("Deploying on address: ", address(this));
    }

    /*
    * Function to take a ipfs cid and map access control parameters to it, 
    * Only orga approved users may add ressources to it
    * Access controls are a mapping to an array of: [{OtherOrga:adress,Role: string(eas), AcessLevel: 0-2}]
    * @param _cid: ipfs cid
    */
// vielleicht auch einfach bei attest gleichzeitig ne offline attestation?
    function registerInternalResource(string memory _cid,  RessourceAccessControl[] memory  _accessControl  ) isACtiveOrga public {
        //require user to have roles
        //require roles to be predefined */
        require(hasRole(ResourceAdder, msg.sender) || hasRole(ContractAdmin, msg.sender), "Caller is not an ResourceAdder");
        require(bytes(_cid).length > 0, "CID cannot be empty");

        for (uint256 i = 0; i < _accessControl.length; i++) {
            require(factory.doesOrgaExist(_accessControl[i].orga), "Orga does not exist");
            IACcontract newACcontract = IACcontract(_accessControl[i].orga);
               for (uint256 j = 0; j < _accessControl[i].allowedRoles.length; j++) {
                    require(newACcontract.internalEASRoleExists(_accessControl[i].allowedRoles[j]), "Role does not exist");
                }
        }

        //console.log("doing it");
        resourceCount++;
        Resource storage newResource = resources[resourceCount];

        newResource.cid = _cid;
        newResource.owner = msg.sender;
        for (uint256 i = 0; i < _accessControl.length; i++) {
            newResource.accessControl.push(RessourceAccessControl(_accessControl[i].orga, _accessControl[i].allowedRoles));
          //  console.log("added access control for orga: ", _accessControl[i].orga);
        }
    }

    function removeInternalResource( uint256 _index ) isACtiveOrga public {
        require(hasRole(ResourceAdder, msg.sender)|| hasRole(ContractAdmin, msg.sender), "Caller is not an ResourceAdder");
        delete resources[_index];
        //resourceCount--;
    }

    function getResources() public view returns (Resource[] memory) {
        Resource[] memory allResources = new Resource[](resourceCount);
        for (uint256 i = 0; i < resourceCount; i++) {
            allResources[i] = resources[i + 1];
        }
        return allResources;
    }

    /*
    * Function to add roles to the orga
    * @param roleName: name of the role to be added
    * @param authorizations: array of authorizations for the role
    */
    function addEASRole(string memory roleName, AccessType authorization) isACtiveOrga public {
        require(hasRole(InternalRoleAdder, msg.sender) || hasRole(ContractAdmin, msg.sender), "Caller is not an InternalRoleAdder");
        require(bytes(roleName).length > 0, "Role name cannot be empty");
        require(!internalEASRoleExists(roleName), "Role already exists");
        roles.push(Role(roleName, authorization));
    }

    function removeRole(string memory _roleName) public {
        require(hasRole(InternalRoleAdder, msg.sender) || hasRole(ContractAdmin, msg.sender), "Caller is not an InternalRoleAdder");
        require(internalEASRoleExists(_roleName), "Role does not exist");
        for (uint256 i = 0; i < roles.length; i++) {
            if (keccak256(abi.encodePacked(roles[i].name)) == keccak256(abi.encodePacked(_roleName))) {
                delete roles[i];
                break;
            }
        }
    }

  
    function attestEASRole( address _recipient,  string memory _role, uint64 _expirationTime, bool _revocable ) isACtiveOrga public  payable returns (bytes32) {
           require(hasRole(EASRoleAdder, msg.sender) || hasRole(ContractAdmin, msg.sender), "Caller is not an EASRoleAdder");
           require(internalEASRoleExists(_role), "Role does not exist");
           require(registry.isUserRegistered(_recipient), "User is not registered");

            bytes32 uidToReference = registry.getUID(_recipient);

            schemaData memory schema = schemaData({
                Role: _role,
                IssuedBy: msg.sender
            });

            bytes memory encodedData= encodeSchemaData(schema);
            //bytes memory tmp = encodeRoleData(roleData);
            //console.log(schema.Role);
            AttestationRequestData memory requestData = AttestationRequestData({
                recipient: _recipient,
                expirationTime: _expirationTime,
                revocable: _revocable,
                refUID: uidToReference,
                data: encodedData,
                value: msg.value
            });

            AttestationRequest memory request = AttestationRequest({
                schema: SCHEMAUID,
                data: requestData
            });

            bytes32  uid = eas.attest{value: msg.value}(request);
            userToRoles[_recipient].push(_role);
            return uid;
    }


   function revokeEASRole( bytes32 _uid ) public payable isACtiveOrga {
        require(hasRole(EASRoleAdder, msg.sender) || hasRole(ContractAdmin, msg.sender), "Caller is not an EASRoleAdder");
        //require(eas.isAttestationValid(_uid), "Attestation is not valid");
         RevocationRequest memory request = RevocationRequest({
            schema: SCHEMAUID,
            data: RevocationRequestData({
                uid: _uid,
                value: msg.value
            })
         });

        eas.revoke{value: msg.value}(request);
    }

    /*
    * Function to check if a role already exists
    * @param roleName: name of the role
    * @return true if the role exists, false otherwise
    */
    function internalEASRoleExists(string memory roleName) public view returns (bool) {
        for (uint256 i = 0; i < roles.length; i++) {
            if (keccak256(abi.encodePacked(roles[i].name)) == keccak256(abi.encodePacked(roleName))) {
                return true;
            }
        }
        return false;
    }


    function encodeSchemaData(schemaData memory schemaData_) public pure returns (bytes memory) {
        return abi.encode( schemaData_.Role, schemaData_.IssuedBy);
    }

    function getRoles() public view returns (Role[] memory) {
        return roles;
    }

    function getUserToRoles(address adr) public view returns (string[] memory) {
        return userToRoles[adr];
    }

   /*  function grantAdminRights(address _user) public  {
        require(hasRole(ContractAdmin, msg.sender), "Caller is not an Admin");
        _grantRole(ContractAdmin, _user);
    }

    function grevokeAdminRights(address _user) public  {
        require(hasRole(ContractAdmin, msg.sender), "Caller is not an Admin");
        _revokeRole(ContractAdmin, _user);
    }

     function grantEASRoleAdderRights(address _user) public  {
        require(hasRole(ContractAdmin, msg.sender), "Caller is not an Admin");
        _grantRole(EASRoleAdder, _user);
    }

    function revokeEASRoleAdderRights(address _user) public  {
        require(hasRole(ContractAdmin, msg.sender), "Caller is not an Admin");
        _revokeRole(EASRoleAdder, _user);
    }

    function grantResourceAdderRights(address _user) public  {
        require(hasRole(ContractAdmin, msg.sender), "Caller is not an Admin");
        _grantRole(ResourceAdder, _user);
    }

    function revokeResourceAdderRights(address _user) public  {
        require(hasRole(ContractAdmin, msg.sender), "Caller is not an Admin");
        _revokeRole(ResourceAdder, _user);
    }

    function grantInternalRoleAdderRights(address _user) public  {
        require(hasRole(ContractAdmin, msg.sender), "Caller is not an Admin");
        _grantRole(InternalRoleAdder, _user);
    }

    function revokeInternalRoleAdderRights(address _user) public  {
        require(hasRole(ContractAdmin, msg.sender), "Caller is not an Admin");
        _revokeRole(InternalRoleAdder, _user);
    }


    function isUserAdmin(address _user) public view returns (bool) {
        return hasRole(ContractAdmin, _user);
    }

    function isUserResourceAdder(address _user) public view returns (bool) {
        return hasRole(ResourceAdder, _user);
    }

    function isUserEASRoleAdder(address _user) public view returns (bool) {
        return hasRole(EASRoleAdder, _user);
    }
  
    function getContractAddress() public view returns (address) {
        return address(this);
    }
 */
    function terminateOrga() public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not The Admin");
        orgaTerminated = true;
    }

}

