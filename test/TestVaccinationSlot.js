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

    it("transfer is only possible if the sender has a valid slot", async () => {
        assertLib.reverts(
            vaccinationSlotInstance.transferSlot(accounts[1]),
            "Sender must have a valid slot to swap"
        );
    });

    it("transfer is only possible if the receiver has a valid slot", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 1, 1);

        assertLib.reverts(
            vaccinationSlotInstance.transferSlot(accounts[2], { from: accounts[1] }),
            "Receiver must have a valid slot to swap"
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
});
