const VaccinationSlot = artifacts.require("VaccinationSlot");
const { forEach } = require('lodash');
const assertLib = require('truffle-assertions');

contract("VaccinationSlot", (accounts) => {
    let vaccinationSlotInstance;

    beforeEach(async () => {
        vaccinationSlotInstance = await VaccinationSlot.new();
    });

    it("issuing is only possible by the contract owner", async () => {
        await assertLib.reverts(vaccinationSlotInstance.issueSlot(
            accounts[2], 1, 1, { from: accounts[1]}),
            "Only the contract owner is able to issue slots"
        );
    });

    it("contract owner can not issue new slot for user if one is already issued", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 1, 1);
        
        await assertLib.reverts(
            vaccinationSlotInstance.issueSlot(accounts[1], 2, 2),
            "Cannot issue new slot for address that already has one"    
        );
    });

    it("contract owner can not issue with type less than or equal to zero", async () => {
        await assertLib.reverts(
            vaccinationSlotInstance.issueSlot(accounts[1], 0, 1),
            "Slot type must be greater, than zero"    
        );
    })

    it("contract owner can issue slots", async () => {
        const startType = 1;
        const startInterval = 3;
        await vaccinationSlotInstance.issueSlot(accounts[1], startType, startInterval);

        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const slotType = slotOfUser['3'].words[0];
        const slotInterval = slotOfUser['6'].words[0];

        assert.equal(slotType, startType, "Slot type should be the same as given by the initialization");
        assert.equal(slotInterval, startInterval, "Slot interval should be the same as given by the initialization");
    });

    it("issued slots have default values set", async () => {
        const slotType = 3;

        await vaccinationSlotInstance.issueSlot(accounts[1], slotType, 4);

        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const issuedAt = slotOfUser['0'].words[0];
        const issuer = slotOfUser['1'];
        const slotOwner = slotOfUser['2'];
        const left = slotOfUser['4'].words[0];
        const lastUsed = slotOfUser['5'].words[0];

        assert.isAbove(issuedAt, 0, 'Slot issue date should be positive');
        assert.equal(issuer, accounts[0], 'Issuer should be the contract owner');
        assert.equal(slotOwner, accounts[1], 'Slot owner should be set');
        assert.equal(left, slotType, "Left should be equal to the slot type on initialization");
        assert.equal(lastUsed, 0, "Last used should be set to zero on initialization");
    });

    it("empty slots can be queried by users", async () => {
        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const issuedAt = slotOfUser['0'].words[0];
        const issuer = slotOfUser['1'];
        const slotOwner = slotOfUser['2'];
        const slotType = slotOfUser['3'].words[0];
        const left = slotOfUser['4'].words[0];
        const lastUsed = slotOfUser['5'].words[0];
        const interval = slotOfUser['6'].words[0];

        assert.equal(issuedAt, 0, "Empty slot should have issuance date zero");
        assert.equal(issuer, "0x0000000000000000000000000000000000000000", "Empty slot should have issuer zero");
        assert.equal(slotOwner, "0x0000000000000000000000000000000000000000", "Empty slot should have slot owner zero");
        assert.equal(slotType, 0, "Empty slot should have type zero");
        assert.equal(left, 0, "Empty slot should have left zero");
        assert.equal(lastUsed, 0, "Empty slot should have last used date zero");
        assert.equal(interval, 0, "Empty slot should have interval zero");
    });

    it("receiver can query its offers' ids", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 3, 4);
        await vaccinationSlotInstance.issueSlot(accounts[3], 4, 4);
        await vaccinationSlotInstance.issueSlot(accounts[4], 5, 4);
        await vaccinationSlotInstance.createOffer(accounts[3], { from: accounts[4] });
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[3] });

        const offerIds = await vaccinationSlotInstance.getOfferIDs.call({ from: accounts[2] });


        assert.equal(offerIds.length, 2, "Addresses should only see offers made for them");
    });

    it("receiver can query its offer by id", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 3, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });

        const offerIds = await vaccinationSlotInstance.getOfferIDs.call({ from: accounts[2] });
        const offerId = offerIds['0'].words[0];

        const offer = await vaccinationSlotInstance.getOfferById.call(offerId, { from: accounts[2] });
        const slotType = offer['0'].words[0];
        const senderAddress = offer['1'];

        assert.equal(slotType, 2, "Slot type is not correct");
        assert.equal(senderAddress, accounts[1], "Slot type is not correct");
    });

    it("offer cannot be queried if receiver is not the caller", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 3, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });
        const offerIds = await vaccinationSlotInstance.getOfferIDs.call({ from: accounts[2] });
        const offerId = offerIds['0'].words[0];

        assertLib.reverts(
            vaccinationSlotInstance.getOfferById.call(offerId, { from: accounts[3] }),
            "Offer can only be queried by the receiver"
        );
    });

    it("receiver cannot query not existing offer", async () => {
        assertLib.reverts(
            vaccinationSlotInstance.getOfferById(0, { from: accounts[0] }),
            "Offer must exist"
        );
    });

    it("sender can query its offers' ids", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 3, 4);
        await vaccinationSlotInstance.issueSlot(accounts[3], 4, 4);
        await vaccinationSlotInstance.issueSlot(accounts[4], 5, 4);
        await vaccinationSlotInstance.createOffer(accounts[3], { from: accounts[4] });
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[3] });

        const offerIds = await vaccinationSlotInstance.getCreatedOfferIDs.call({ from: accounts[1] });


        assert.equal(offerIds.length, 1, "Addresses should only see offers made for them");
    });

    it("sender can query its offer by id", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 3, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });

        const offerIds = await vaccinationSlotInstance.getCreatedOfferIDs.call({ from: accounts[1] });
        const offerId = offerIds['0'].words[0];

        const offer = await vaccinationSlotInstance.getCreatedOfferById.call(offerId, { from: accounts[1] });
        const slotType = offer['0'].words[0];
        const receiverAddress = offer['1'];

        assert.equal(slotType, 3, "Slot type is not correct");
        assert.equal(receiverAddress, accounts[2], "Slot type is not correct");
    });

    it("offer cannot be queried if sender is not the caller", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 3, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });
        const offerIds = await vaccinationSlotInstance.getCreatedOfferIDs.call({ from: accounts[1] });
        const offerId = offerIds['0'].words[0];

        assertLib.reverts(
            vaccinationSlotInstance.getCreatedOfferById.call(offerId, { from: accounts[3] }),
            "Offer can only be queried by the sender"
        );
    });

    it("sender cannot query not existing offer", async () => {
        assertLib.reverts(
            vaccinationSlotInstance.getCreatedOfferById(0, { from: accounts[0] }),
            "Offer must exist"
        );
    });

    it("Offer cannot be created without a valid slot of the sender", async () => {
        assertLib.reverts(
            vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] }),
            "Sender must have a valid slot to swap"
        );
    });

    it("Offer cannot be created without a valid slot of the receiver", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        assertLib.reverts(
            vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] }),
            "Receiver must have a valid slot to swap"
        );
    });

    it("Offer cannot be created with a used slot of the sender", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 2, 4);
        await vaccinationSlotInstance.vaccinate(accounts[1]);
        assertLib.reverts(
            vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] }),
            "Sender slot must be unused"
        );
    });

    it("Offer cannot be created with a used slot of the receiver", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 2, 4);
        await vaccinationSlotInstance.vaccinate(accounts[2]);
        assertLib.reverts(
            vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] }),
            "Receiver slot must be unused"
        );
    });

    it("Offer cannot be created with the sender having an active offer", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 2, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });

        assertLib.reverts(
            vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] }),
            "Sender already made and offer"
        );
    });

    it("Offer can only be deleted by the sender", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 2, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });

        const offerIds = await vaccinationSlotInstance.getCreatedOfferIDs.call({ from: accounts[1] });
        const offerId = offerIds['0'].words[0];

        assertLib.reverts(
            vaccinationSlotInstance.deleteOffer.call(offerId, { from: accounts[3] }),
            "Only the sender can delete an offer"
        );
    });

    it("Sender can delete offer", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 2, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });

        const offerIds = await vaccinationSlotInstance.getCreatedOfferIDs.call({ from: accounts[1] });
        const offerId = offerIds['0'].words[0];

        await vaccinationSlotInstance.deleteOffer(offerId, { from: accounts[1] });
        assertLib.reverts(
            vaccinationSlotInstance.getCreatedOfferById.call(offerId, { from: accounts[1] }),
            "Offer must exist"    
        );
    });

    it("Non existing offer cannot be accepted", async () => {
        assertLib.reverts(
            vaccinationSlotInstance.acceptOffer(0, { from: accounts[2] }),
            "Offer must exist"    
        );
    });

    it("Offer cannot be accepted with a used slot of the sender", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 2, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });
        await vaccinationSlotInstance.vaccinate(accounts[1]);

        assertLib.reverts(
            vaccinationSlotInstance.acceptOffer(0, { from: accounts[2] }),
            "Sender slot must be unused"    
        );
    });

    it("Offer cannot be accepted with a used slot of the receiver", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 2, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });
        await vaccinationSlotInstance.vaccinate(accounts[2]);

        assertLib.reverts(
            vaccinationSlotInstance.acceptOffer(0, { from: accounts[2] }),
            "Receiver slot must be unused"    
        );
    });

    it("Other address than the receiver cannot accept offer", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 4, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });

        assertLib.reverts(
            vaccinationSlotInstance.acceptOffer(0, { from: accounts[3] }),
            "Only the receiver can accept an offer"
        );
    });

    it("Accepted offer swaps slots", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 4, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });
        await vaccinationSlotInstance.acceptOffer(0, { from: accounts[2] });

        const slotOfOne = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const slotOfTwo = await vaccinationSlotInstance.getSlot.call({ from: accounts[2] });
        const type1 = slotOfOne['3'].words[0];
        const type2 = slotOfTwo['3'].words[0];

        assert.equal(type1, 4, "Address one should have slot of address two");
        assert.equal(type2, 2, "Address two should have slot of address one");
    });

    it("Accepted offer is deleted", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 2, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 4, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });
        await vaccinationSlotInstance.acceptOffer(0, { from: accounts[2] });

        assertLib.reverts(
            vaccinationSlotInstance.getOfferById(0, { from: accounts[2] }),
            "Offer must exist"
        );
    });

    it("vaccination is only possible by the contract owner", async () => {
        assertLib.reverts(
            vaccinationSlotInstance.vaccinate(accounts[1], { from: accounts[2] }),
            "Only the contract owner is able to vaccinate"    
        );
    });

    it("vaccination is not possible without a slot", async () => {
        assertLib.reverts(
            vaccinationSlotInstance.vaccinate(accounts[1]),
            "Patient must have a slot to get a vaccine."
        );
    });

    it("vaccination decreases number of pieces left from slot", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 3, 3);
        await vaccinationSlotInstance.vaccinate(accounts[1]);

        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const left = slotOfUser['4'].words[0];

        assert.equal(left, 2, 'Vaccination should decrease number of pieces left from slot');
    });

    it("vaccination records current time", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 3, 3);
        await vaccinationSlotInstance.vaccinate(accounts[1]);

        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const lastUsed = slotOfUser['4'].words[0];

        assert.isAbove(lastUsed, 0, 'Vaccination should record current time');
    });

    it("vaccination burns slot if there are no pieces left", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 1, 3);
        await vaccinationSlotInstance.vaccinate(accounts[1]);

        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const issuedAt = slotOfUser['0'].words[0];

        assert.equal(issuedAt, 0, "Vaccination should burn slot that has no pieces left");
    });

    it("vaccination deletes offers that contain burned slots", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 1, 4);
        await vaccinationSlotInstance.issueSlot(accounts[2], 3, 4);
        await vaccinationSlotInstance.issueSlot(accounts[3], 4, 4);
        await vaccinationSlotInstance.createOffer(accounts[2], { from: accounts[1] });
        await vaccinationSlotInstance.createOffer(accounts[1], { from: accounts[3] });
        await vaccinationSlotInstance.vaccinate(accounts[1]);

        assertLib.reverts(
            vaccinationSlotInstance.getOfferById(0, { from: accounts[2] }),
            "Offer must exist"
        );

        assertLib.reverts(
            vaccinationSlotInstance.getOfferById(1, { from: accounts[1] }),
            "Offer must exist"
        );
    });
});
