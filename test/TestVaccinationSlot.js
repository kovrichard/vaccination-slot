const VaccinationSlot = artifacts.require("VaccinationSlot");
const { forEach } = require('lodash');
const assertLib = require('truffle-assertions');

contract("VaccinationSlot", (accounts) => {
    let vaccinationSlotInstance;

    beforeEach(async () => {
        vaccinationSlotInstance = await VaccinationSlot.new();
    });

    it("issuing is only possible by the contract owner", async () => {
        await assertLib.reverts(vaccinationSlotInstance.issueSlot(accounts[2], 1, 1, { from: accounts[1]}));
    });


    it("contract owner can not issue new slot for user if one is already issued", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 1, 1);
        
        await assertLib.reverts(vaccinationSlotInstance.issueSlot(accounts[1], 2, 2));
    });

    it("contract owner can not issue with type less than or equal to zero", async () => {
        await assertLib.reverts(vaccinationSlotInstance.issueSlot(accounts[1], 0, 1));
    })

    it("contract owner can issue slots", async () => {
        const startType = 1;
        const startInterval = 3;
        await vaccinationSlotInstance.issueSlot(accounts[1], startType, startInterval);

        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const slotType = slotOfUser['2'].words[0];
        const slotInterval = slotOfUser['5'].words[0];

        assert.equal(slotType, startType, "Slot type should be the same as given by the initialization");
        assert.equal(slotInterval, startInterval, "Slot interval should be the same as given by the initialization");
    });

    it("issued slots have default values set", async () => {
        const slotType = 3;

        await vaccinationSlotInstance.issueSlot(accounts[1], slotType, 4);

        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const issuedAt = slotOfUser['0'].words[0];
        const issuer = slotOfUser['1'];
        const left = slotOfUser['3'].words[0];
        const lastUsed = slotOfUser['4'].words[0];

        assert.isAbove(issuedAt, 0, 'Slot issue date should be positive');
        assert.equal(issuer, accounts[0], 'Issuer should be the contract owner');
        assert.equal(left, slotType, "Left should be equal to the slot type on initialization");
        assert.equal(lastUsed, 0, "Last used should be set to zero on initialization");
    });

    it("empty slots can be queried by users", async () => {
        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const issuedAt = slotOfUser['0'].words[0];
        const issuer = slotOfUser['1'];
        const slotType = slotOfUser['2'].words[0];
        const left = slotOfUser['3'].words[0];
        const lastUsed = slotOfUser['4'].words[0];
        const interval = slotOfUser['5'].words[0];

        assert.equal(issuedAt, 0, "Empty slot should have issuance date zero");
        assert.equal(issuer, "0x0000000000000000000000000000000000000000", "Empty slot should have issuer zero");
        assert.equal(slotType, 0, "Empty slot should have type zero");
        assert.equal(left, 0, "Empty slot should have left zero");
        assert.equal(lastUsed, 0, "Empty slot should have last used date zero");
        assert.equal(interval, 0, "Empty slot should have interval zero");
    });
});
