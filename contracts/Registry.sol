// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

contract Registry {

    mapping (address => bytes32) public UserToUID;
    mapping (bytes32 => address) public UIDToUser;

    function registerIdenity(bytes32  _UID) public {
        require(UIDToUser[_UID] == address(0), "UID already registered");
        UserToUID[msg.sender] = _UID;
    }

    function getUID(address user) public view returns (bytes32) {
        return UserToUID[user];
    }

    function isUserRegistered(address user) public view returns (bool) {
        return UserToUID[user] != 0x0000000000000000000000000000000000000000000000000000000000000000 ? true : false;
    }
}

