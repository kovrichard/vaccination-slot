// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract VaccinationSlot {
    struct Slot {
        uint256 issuedAt;
        address issuer;
        address slotOwner;
        uint slotType;
        uint left;
        uint256 lastUsed;
        uint256 interval;
    }

    struct Offer {
        address from;
        address to;
    }

    mapping(uint256 => Offer) offers;
    uint256 offerId;

    address owner;
    mapping(address => Slot) slots;

    constructor() public {
        owner = msg.sender;
        offerId = 0;
    }

    function issueSlot(address receiver, uint slot, uint256 interval) public {
        require(msg.sender == owner, "Only the contract owner is able to issue slots");
        require(slots[receiver].issuedAt == 0, "Cannot issue new slot for address that already has one");
        require(slot > 0, "Slot type must be greater, than zero");

        Slot memory tmp = Slot(getTime(), owner, receiver, slot, slot, 0, interval);

        slots[receiver] = tmp;
    }

    function getTime() private view returns(uint256 time){
        return block.timestamp;
    }

    function getSlot() public view returns(uint256, address, address, uint, uint, uint256, uint256) {
        Slot memory tmp = slots[msg.sender];
        
        return (
            tmp.issuedAt,
            tmp.issuer,
            tmp.slotOwner,
            tmp.slotType,
            tmp.left,
            tmp.lastUsed,
            tmp.interval
        );
    }

    function getOfferIDs() public view returns(uint[] memory) {
        uint size = 0;

        for (uint i = 0; i < offerId; i++) {
            if (slots[offers[i].to].slotOwner == msg.sender) {
                size++;
            }
        }

        uint[] memory ids = new uint[](size);
        uint256 j = 0;

        for (uint i = 0; i < offerId; i++) {
            if (slots[offers[i].to].slotOwner == msg.sender) {
                ids[j++] = i;
            }
        }

        return ids;
    }

    function getCreatedOfferIDs() public view returns(uint[] memory) {
        uint size = 0;

        for (uint i = 0; i < offerId; i++) {
            if (slots[offers[i].from].slotOwner == msg.sender) {
                size++;
            }
        }

        uint[] memory ids = new uint[](size);
        uint256 j = 0;

        for (uint i = 0; i < offerId; i++) {
            if (slots[offers[i].from].slotOwner == msg.sender) {
                ids[j++] = i;
            }
        }

        return ids;
    }

    function getOfferById(uint256 id) public view returns(uint, address) {
        require(slots[offers[id].from].issuedAt != 0, "Offer must exist");
        require(offers[id].to == msg.sender, "Offer can only be queried by the receiver");

        return (slots[offers[id].from].slotType, offers[id].from);
    }

    function getCreatedOfferById(uint256 id) public view returns(uint, address) {
        require(slots[offers[id].from].issuedAt != 0, "Offer must exist");
        require(offers[id].from == msg.sender, "Offer can only be queried by the sender");

        return (slots[offers[id].to].slotType, offers[id].to);
    }

    function createOffer(address receiver) public {
        require(slots[msg.sender].issuedAt != 0, "Sender must have a valid slot to swap");
        require(slots[receiver].issuedAt != 0, "Receiver must have a valid slot to swap");
        require(slots[msg.sender].lastUsed == 0, "Sender slot must be unused");
        require(slots[receiver].lastUsed == 0, "Receiver slot must be unused");
        bool madeOffer = false;
        for (uint i = 0; i < offerId; i++) {
            if (offers[i].from == msg.sender) {
                madeOffer = true;
            }
        }
        require(!madeOffer, "Sender already made and offer");

        offers[offerId] = Offer(msg.sender, receiver);
        offerId++;
    }

    function deleteOffer(uint256 id) public {
        require(offers[id].from == msg.sender, "Only the sender can delete an offer");

        delete(offers[id]);
    }

    function acceptOffer(uint256 id) public {
        require(offers[id].from != 0x0000000000000000000000000000000000000000, "Offer must exist");
        require(slots[offers[id].from].lastUsed == 0, "Sender slot must be unused");
        require(slots[offers[id].to].lastUsed == 0, "Receiver slot must be unused");
        require(msg.sender == slots[offers[id].to].slotOwner, "Only the receiver can accept an offer");

        Offer memory offer = offers[id];

        Slot memory tmp = slots[offer.from];
        slots[offer.from] = slots[offer.to];
        slots[offer.to] = tmp;

        slots[offer.from].slotOwner = offer.from;
        slots[offer.to].slotOwner = offer.to;

        delete(offers[id]);
    }

    function burnSlot(address slotOwner) private {
        require(msg.sender == owner, "Only the contract owner is able to burn slots");
        require(slots[slotOwner].issuedAt != 0, "Owner must have a valid slot to burn");

        delete(slots[slotOwner]);
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
            
            for (uint i = 0; i < offerId; i++) {
                if (offers[i].from == patient || offers[i].to == patient) {
                    delete(offers[i]);
                }
            }
        }
    }

}
