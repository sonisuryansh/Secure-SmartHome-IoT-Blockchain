// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HomeSecurity {
    struct Log {
        string action;
        string user;
        uint256 timestamp;
    }
    Log[] public securityLogs;

    function addLog(string memory _action, string memory _user, uint256 _timestamp) public {
        securityLogs.push(Log(_action, _user, _timestamp));
    }

    function getLogs() public view returns (Log[] memory) {
        return securityLogs;
    }
}