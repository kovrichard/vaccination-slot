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

    it("contract owner can issue slots", async () => {
        const startType = 1;
        const startInterval = 3;
        await vaccinationSlotInstance.issueSlot(accounts[1], startType, startInterval);

        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        const slotType = slotOfUser['2'].words[0];
        const slotInterval = slotOfUser['5'].words[0];

        assert.equal(slotType, startType, "Slot was not issued");
        assert.equal(slotInterval, startInterval, "Slot was not issued");
    });

    it("contract owner can not issue new slot for user if one is already issued", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], 1, 1);
        
        await assertLib.reverts(vaccinationSlotInstance.issueSlot(accounts[1], 2, 2));
    });
});
