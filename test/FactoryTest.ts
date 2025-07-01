import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers, ignition } from "hardhat";
import { ACModule } from "../ignition/modules/ac";
import { FactoryModule } from "../ignition/modules/ac";
import  contractAbi  from "../artifacts/contracts/orgaFactory.sol/ACcontract.json";
enum Role {
  View,
  Edit,
  organisationl,
}



async function deployFixtures() {
  const { ac } = await ignition.deploy(ACModule);
  const address = await ac.getAddress()
  const { factory } = await hre.ignition.deploy(FactoryModule, {
    parameters: { FactoryModule: { address } },
  });    
  const [owner, otherAccount, anotherOtherAccount] = await hre.ethers.getSigners();
  return { ac, factory, owner, otherAccount, anotherOtherAccount };

}
/* 
it("should have owner address as owner", async function () {
  const {factory, owner } = await loadFixture(deployFixtures);
  expect(await factory.owner()).to.equal(owner.address);

}); */
describe("Factory", function () {

  it("should have ac address as logicContractAddress", async function () {
    const {factory, ac } = await loadFixture(deployFixtures);
    expect(await factory.logicContractAddress()).to.equal(await ac.getAddress());
  });

  it("should create a new ac instance named orga1 and return its address", async function () {
    const {factory, ac, owner } = await loadFixture(deployFixtures);
    const address = await factory.createOrga("orga1");
    //expect to be  of type 0x...
    //console.log("owner address: ", owner.address);
    expect(address.to).to.be.a("string");

  });

  it("should have orgas array of size 1 now", async function () {
    const {factory, ac, owner } = await loadFixture(deployFixtures);
    const address = await factory.createOrga("orga1");
    const orgas = await factory.getOrgas();
    //console.log("orgas: ", orgas);  
    //expect to be of size 1
    expect(orgas.length).to.equal(1);
  });

  it("should map owners address to orga1", async function () {
    const {factory, ac, owner } = await loadFixture(deployFixtures);
    const address = await factory.createOrga("orga1");
    const orga = await factory.getOrgasByUser(owner.address);
    //console.log(owner.address)
    //console.log("orga: ", orga);  
    //expect to be of type 0x...
    expect(orga[0]).to.be.a("string");
  });



});

describe("acc", async function () {
  let accontract: any;
  let accontract2: any;
  const DEFAULT_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEFAULT_ADMIN_ROLE"));
  const EASRoleAdder = ethers.keccak256(ethers.toUtf8Bytes("EASRoleAdder"));
  const ResourceAdder = ethers.keccak256(ethers.toUtf8Bytes("ResourceAdder"));
  const InternalRoleAdder = ethers.keccak256(ethers.toUtf8Bytes("InternalRoleAdder"));
  const ContractAdmin = ethers.keccak256(ethers.toUtf8Bytes("ContractAdmin"));

  let owner: any;
  let factory: any;
  let otherAccount: any;
  let anotherOtherAccount: any;
  before(async () => {
    //deploy instance of contrac in games(0) from factory contract
    ({factory,  owner, otherAccount, anotherOtherAccount } = await loadFixture(deployFixtures));
    await factory.createOrga("orga1");
    await factory.createOrga("orga2");

    const accontractAddress = await factory.getOrgas();
    const formattedAddress = accontractAddress[0].toLowerCase(); // Convert to lowercase
    const formattedAddress2 = accontractAddress[1].toLowerCase(); // Convert to lowercase

     accontract =  new ethers.Contract(formattedAddress, contractAbi.abi, owner);
     accontract2 =  new ethers.Contract(formattedAddress2, contractAbi.abi, owner);

  });

  it("orga contract should initialize with name orga1", async function () {
    const isInitialized = await accontract.hasInitialized();
    //console.log("isInitialized: ", isInitialized);
    expect(isInitialized).to.be.true;
  });

  it("orga2 contract should initialize with name orga2", async function () {
    const isInitialized = await accontract.hasInitialized();
    const name = await accontract2.orgaName();
    //console.log("isInitialized: ", isInitialized);
    expect(isInitialized).to.be.true;
    expect(name).to.equal("orga2");
  });

  it("should check if owner has admin role ", async function () {
    const hasRole = await accontract.hasRole(DEFAULT_ADMIN_ROLE, owner.address);
    expect(hasRole).to.be.true;
  });

  it("should be able to add a role View and Edit", async function () {

    const role = Role.View;
    const role2 = Role.Edit;
    await accontract.addRole("Viewer", role);
    await accontract.addRole("Editor", role2);
    const roles = await accontract.getRoles();
   // console.log(roles)
    expect(roles.length).to.equal(2);
    expect(roles[0].name).to.equal("Viewer");
    expect(roles[0].authorization).to.equal(Role.View);
  });

  it("should be able to add differnt roles to different contract", async function () {

    const role = Role.View;
    const role2 = Role.Edit;
    await accontract2.addRole("External", role);
    await accontract2.addRole("ExternalMaker", role2);
    const roles = await accontract2.getRoles();
   // console.log(roles)
    expect(roles.length).to.equal(2);
    expect(roles[0].name).to.equal("External");
    expect(roles[0].authorization).to.equal(Role.View);
  });

  it("should not be possible for foreign user to add Roles", async function () {
    const role = Role.View;
    const role2 = Role.Edit;
    await expect(accontract.connect(otherAccount).addRole("Viewer", role)).to.be.reverted;
    await expect(accontract.connect(otherAccount).addRole("Editor", role2))
    .to.be.revertedWith("Caller is not an InternalRoleAdder");
  });

  it("should check if the role exists", async function () {
    const roleExists = await accontract.roleExists("Viewer");
    expect(roleExists).to.be.true;
  });

  it("should not be possible to add same role twice", async function () {
    const role = Role.View;
    await expect(accontract.addRole("Viewer", role)).to.be.revertedWith("Role already exists");
  });

  it("should not be possible to add role with wrong authorization", async function () {
    const role = Role.organisationl;
    await expect(accontract.addRole("Admin", role)).to.be.reverted;
  });

  it("should be possible to give user Internal Role", async function () {
    await accontract.grantRole(InternalRoleAdder, otherAccount.address, );
    expect(await accontract.hasRole(InternalRoleAdder, otherAccount.address)).to.be.true;
  });




  it("should be possible for other user to add role now", async function () {
   // console.log("fdshushudfi: ", await accontract.hasRole(InternalRoleAdder, otherAccount.address));

    const role = Role.Edit;
    await accontract.connect(otherAccount).addRole("TestAdmin", role);
    const roles = await accontract.getRoles();
    console.log(roles);
    expect(roles.length).to.equal(3);
  });


  it("should be possible to give user Admin Role and let them self attest", async function () {
    await accontract.grantRole(ContractAdmin, otherAccount.address, );
    //console.log(await accontract.getRoleAdmin(EASRoleAdder));

/*     console.log(await accontract.hasRole(DEFAULT_ADMIN_ROLE, otherAccount.address))
    console.log(await accontract.hasRole(InternalRoleAdder, otherAccount.address)) */

    await accontract.connect(otherAccount).grantRole(InternalRoleAdder, anotherOtherAccount.address );
    expect(await accontract.hasRole(InternalRoleAdder, anotherOtherAccount.address)).to.be.true;
  });

   it("should not be possible to attest to a nonexisten role", async function () {
    await expect(accontract.attestRole(otherAccount.address, "notexistent", 0, true)).to.be.revertedWith("Role does not exist");
  });
/* 
  it("should be possible to attest a role to a user", async function () {

    const uid = await accontract.attestRole(otherAccount.address, "Viewer", {value: 0});
    console.log("uid: ", uid);
  }); 
 */

 
  it("should not be able to register a Ressource with empty cid", async function () {

    const cid = "";
    const orgaaddress = await accontract.factory();
    //console.log("factory: ", orgaaddress);
    const accessControl = [
      [
        orgaaddress, 
          [
              "Test"
          ]
      ]
  ];

    await expect(accontract.registerInternalResource(cid,accessControl)).to.be.revertedWith("CID cannot be empty");
  }); 


  
  it("should not be able to register a Ressource due to wrong orga", async function () {

    const cid = "https://www.google.com";
    const orgaaddress = await accontract.factory();
    //console.log("factory: ", orgaaddress);
    const accessControl = [
      [
        orgaaddress, 
          [
              "Test"
          ]
      ]
  ];

  

    await expect(accontract.registerInternalResource(cid,accessControl )).to.be.revertedWith("Orga does not exist")
    
  }); 


  it("should not be able to register a Ressource because of a wrong role", async function () {
    const cid = "https://www.google.com";

    const orgaaddress = await accontract.getAddress();
    const accessControl = [
      [
        orgaaddress, 
          [
              "dsfsfa"
          ]
      ]
     ];

    await expect( accontract.registerInternalResource(cid,accessControl )).to.be.revertedWith("Role does not exist");
    
  }); 

  
  it("should be able to register a Ressource", async function () {
    const cid = "QmZ6x4u8GowdkXm9x2BrsJETz5aRQRjiJRjAqBgUoaKMVk";

    const orgaaddress = await accontract.getAddress();
    const accessControl = [
      [
        orgaaddress, 
          [
              "Viewer", 
              "Editor",
          ],
        
      ],
     ];
      await accontract.registerInternalResource(cid,accessControl);
      const resources = await accontract.resourceCount();
      expect(resources).to.equal(1);
      const resource = await accontract.getResources();
      //console.log("Resource:", JSON.stringify(resource, null, 2));
    }); 

    it("should be able to register a Ressource using internal and external roles", async function () {
      const cid = "QmZ6x4u8GowdkXm9x2BrsJETz5aRQRjiJRjAqBgUoaKMVk";
  
      const orgaaddress = await accontract.getAddress();
      const orgaaddress2 = await accontract2.getAddress();

      const accessControl = [
        [
          orgaaddress, 
            [
                "Viewer", 
                "Editor",
            ],
          
        ],
        [
          orgaaddress2, 
            [
                "External", 
                "ExternalMaker",
                
            ],
          
        ]
       ];
        await accontract.registerInternalResource(cid,accessControl);
        const resources = await accontract.resourceCount();
        expect(resources).to.equal(2);
        const resource = await accontract.getResources();
        //console.log("Resource:", JSON.stringify(resource, null, 2));
      }); 

  it("should be able to encode and decode schemaData", async function () {
    const schemaData = {
      Role: "Viewer",
      IssuedBy: owner.address
    };
    //console.log("schemaData: ", schemaData);
    const encodedData = await accontract.encodeSchemaData(schemaData);
    //console.log("encodedData: ", encodedData);
     const decodedData = await accontract.decodeSchemaData(encodedData);
    //console.log("decodedData: ", decodedData);
    expect(decodedData.Role).to.equal(schemaData.Role); 
  });



});

