import { ethers } from "hardhat";
import { fetchVerifyArgs } from "./utils";

async function main() {
  const contractAddress = process.env.MULTI_PAYMENT_ADDRESS!;
  const contract = await ethers.getContractAt(
    "MultiCurrencyPayment",
    contractAddress
  );

  const provider = ethers.provider;
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  console.log("Making payment with the account:", wallet.address);

  const currencyAddress = ethers.ZeroAddress;
  const amount = 0; //  paying in ETH, we don't need amount here

  const asset = "ETH/USD";
  // Fetch verification arguments from your oracle's proofs
  const { merkleRoot, merkleProof, signatures, price, timestamp, dataKey } =
    await fetchVerifyArgs(asset);

  const tx2 = await contract
    .connect(wallet)
    .getLastPrice(
      merkleRoot,
      merkleProof,
      signatures,
      dataKey,
      price,
      timestamp
    );

  console.log("Transaction sent:", tx2.hash);

  const receipt2 = await tx2.wait();
  return;

  const tx = await contract
    .connect(wallet)
    .pay(
      currencyAddress,
      amount,
      merkleRoot,
      merkleProof,
      signatures,
      dataKey,
      price,
      timestamp,
      {
        value: ethers.parseEther("0.004"),
      }
    );

  console.log("Transaction sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt?.hash);
}

// Handle errors in async function
main().catch((error) => {
  console.error("Error during execution:", error);
  process.exit(1);
});
