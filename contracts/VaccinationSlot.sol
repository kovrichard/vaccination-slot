// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract VaccinationSlot {
    address owner;
    mapping(address => string) slots;

    constructor() public {
        owner = msg.sender;
    }

    function issueSlot(address receiver, string memory slot) public {
        require(msg.sender == owner, "Only the contract owner is able to issue slots");
        bytes memory emptyStringTest = bytes(slots[receiver]);
        require(emptyStringTest.length == 0, "Cannot issue new slot for address that already has one");

        slots[receiver] = slot;
    }

    function getSlot() public view returns(string memory) {
        return slots[msg.sender];
    }

    function transferSlot(address receiver) public {
        bytes memory noSenderSlotTest = bytes(slots[msg.sender]);
        require(noSenderSlotTest.length != 0, "Sender must have a valid slot to swap");
        bytes memory noReceiverSlotTest = bytes(slots[receiver]);
        require(noReceiverSlotTest.length != 0, "Receiver must have a valid slot to swap");

        string memory tmp = slots[msg.sender];
        slots[msg.sender] = slots[receiver];
        slots[receiver] = tmp;
    }

    function burnSlot(address slotOwner) public {
        require(msg.sender == owner, "Only the contract owner is able to burn slots");
        bytes memory noSlotTest = bytes(slots[slotOwner]);
        require(noSlotTest.length != 0, "Owner must have a valid slot to burn");

        slots[slotOwner] = "";
    }
}
