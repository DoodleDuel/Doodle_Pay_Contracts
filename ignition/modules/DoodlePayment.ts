import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DoodlePaymentModule = buildModule("DoodlePaymentModule", (m) => {
  const consumer = m.contract("DoodlePayment");

  return { consumer };
});

export default DoodlePaymentModule;
