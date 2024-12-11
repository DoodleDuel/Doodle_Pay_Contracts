import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// PullOracle address on Eth Sepolia network
const PullOracleAddress = process.env.NGL_PULL_ORACLE_ADDRESS!;

const MultiCurrencyPaymentModule = buildModule(
  "MultiCurrencyPaymentModule",
  (m) => {
    const consumer = m.contract("MultiCurrencyPayment", [PullOracleAddress]);

    return { consumer };
  }
);

export default MultiCurrencyPaymentModule;
