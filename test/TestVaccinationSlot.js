const VaccinationSlot = artifacts.require("VaccinationSlot");
const { forEach } = require('lodash');
const assertLib = require('truffle-assertions');

contract("VaccinationSlot", (accounts) => {
    let vaccinationSlotInstance;

    beforeEach(async () => {
        vaccinationSlotInstance = await VaccinationSlot.new();
    });

    it("issuing is only possible by the contract owner", async () => {
        await assertLib.reverts(vaccinationSlotInstance.issueSlot(accounts[2], "testSlot", { from: accounts[1]}));
    });

    it("contract owner can issue slots", async () => {
        const slot = "testSlot";
        await vaccinationSlotInstance.issueSlot(accounts[1], slot);

        const slotOfUser = await vaccinationSlotInstance.getSlot.call({ from: accounts[1] });
        assert.equal(slotOfUser, slot, "Slot was not issued");
    });

    it("contract owner can not issue new slot for user if one is already issued", async () => {
        await vaccinationSlotInstance.issueSlot(accounts[1], "testSlot");
        
        await assertLib.reverts(vaccinationSlotInstance.issueSlot(accounts[1], "newSlot"));
    });
});
