import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

import * as dotenv from "dotenv";

dotenv.config();
const ALCHEMY_KEY = process.env.ALCHEMY_KEY  || "" ;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    hardhat: {},
    // Add other networks if needed
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    taiko_hekla: {
      url: process.env.HEKLA_RPC_URL,
      accounts: [process.env.TAIKO_PRIVATE_KEY],
      },
    scroll_sepolia: {
      url: `https://scroll-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      scroll_sepolia: ETHERSCAN_API_KEY,
      //taiko_hekla: "taiko_hekla", // apiKey is not required, just set a placeholder
    },
    /* customChains: [
      {
        network: "taiko_hekla",
        chainId: 167009,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/167009/etherscan",
          browserURL: "https://hekla.taikoexplorer.com"
        }
      }
    ] */
  },

  
};
export default config;
