import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DoodlePaymentModule = buildModule("DoodTestTokenModule", (m) => {
  const consumer = m.contract("DoodTestToken", ["DODDLE TEST TOKEN", "DOOD"]);

  return { consumer };
});

export default DoodlePaymentModule;
