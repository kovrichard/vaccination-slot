const VaccinationSlot = artifacts.require("VaccinationSlot");

module.exports = function (deployer) {
  deployer.deploy(VaccinationSlot);
};
