import { writable, derived, readable } from 'svelte/store';

/**
 * Tracks the currently logged in user.
 */
export const user = writable('No Account Connected');
export const schemaUID = '0xbcce81c34bf6265924043d64fd27bbd676a99aa76a2b59821bd32e9b51ae5588';
export const SepoliaEASContractAddress = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e'; // Sepolia v0.26
export const FactoryContractAddress = '0xbF6169A8834AA07014A829B2691Bd5BBf3b42627'
export const RegistryContractAddress = '0x19A474BEdae04Ed637a03BF07C6EA6E271B4E97b'
/* export const test = makeContractStore(SBT_ABI.abi as AbiItem[], contractAddress.SBT);
 */

//0x19a2b4fCB66928bF6590820828f0526d4D24F48b