// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract VaccinationSlot {
    struct Slot {
        uint256 issuedAt;
        address issuer;
        uint slotType;
        uint left;
        uint256 lastUsed;
        uint256 interval;
    }

    address owner;
    mapping(address => Slot) slots;

    constructor() public {
        owner = msg.sender;
    }

    function issueSlot(address receiver, uint slot, uint256 interval) public {
        require(msg.sender == owner, "Only the contract owner is able to issue slots");
        require(slots[receiver].issuedAt == 0, "Cannot issue new slot for address that already has one");
        require(slot > 0, "Slot type must be greater, than zero");

        Slot memory tmp = Slot(getTime(), owner, slot, slot, 0, interval);

        slots[receiver] = tmp;
    }

    function getTime() private view returns(uint256 time){
        return block.timestamp;
    }

    function getSlot() public view returns(uint256, address, uint, uint, uint256, uint256) {
        Slot memory tmp = slots[msg.sender];
        
        return (
            tmp.issuedAt,
            tmp.issuer,
            tmp.slotType,
            tmp.left,
            tmp.lastUsed,
            tmp.interval
        );
    }

    function transferSlot(address receiver) public {
        require(slots[msg.sender].issuedAt != 0, "Sender must have a valid slot to swap");
        require(slots[receiver].issuedAt != 0, "Receiver must have a valid slot to swap");

        Slot memory tmp = slots[msg.sender];
        slots[msg.sender] = slots[receiver];
        slots[receiver] = tmp;
    }

    function burnSlot(address slotOwner) private {
        require(msg.sender == owner, "Only the contract owner is able to burn slots");
        require(slots[slotOwner].issuedAt != 0, "Owner must have a valid slot to burn");

        slots[slotOwner].issuedAt = 0;
        slots[slotOwner].issuer = 0x0000000000000000000000000000000000000000;
        slots[slotOwner].slotType = 0;
        slots[slotOwner].left = 0;
        slots[slotOwner].lastUsed = 0;
        slots[slotOwner].interval = 0;
    }

    function vaccinate(address patient) public {
        Slot memory slot = slots[patient];

        require(msg.sender == owner, "Only the contract owner is able to vaccinate");
        require(slot.issuedAt != 0, "Patient must have a slot to get a vaccine");
        require(slot.left > 0, "Slot must have a remaining piece");

        slot.left--;
        slot.lastUsed = getTime();
        slots[patient] = slot;

        if (slot.left <= 0) {
            burnSlot(patient);
        }
    }
}
