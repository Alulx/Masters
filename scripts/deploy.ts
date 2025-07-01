import hre from "hardhat";
import { ACModule } from "../ignition/modules/ac";
import { FactoryModule } from "../ignition/modules/ac";
const fs = require('fs'); 

async function main() {
    const { ac } = await hre.ignition.deploy(ACModule);
  
    const address = await ac.getAddress()
    console.log(`actest deployed to address: ${address}`);

    const { factory } = await hre.ignition.deploy(FactoryModule, {
        parameters: { FactoryModule: { address } },
      });    
    console.log(`fac deployed to: ${await factory.getAddress()}`);
      // write both addresses in a text file in the same directory
    fs.writeFile('addresses.txt', `ac: ${address}\nfac: ${await factory.getAddress()}`, (err: any) => {
        if (err) throw err;
    });

  }
  
main().catch(console.error);
  