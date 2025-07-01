// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

enum AccessType { Attribute, View, Edit }

struct schemaData {
        string Role;
        address IssuedBy;
}

struct Role {
    string name;
    AccessType authorization;
}

struct RessourceAccessControl {
    address orga;
    string[] allowedRoles;
}

struct Resource {
    string cid;
    address owner;
    RessourceAccessControl[] accessControl;
    /* mapping (uint => AccessControl) accessControl;
    uint accessControlCount; */
}
