import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.DOODLE_PAYMENT_ADDRESS!;
  const testTokenAddress = process.env.TEST_TOKEN_ADDRESS!;
  const provider = ethers.provider;

  // Create a wallet instance from the private key and connect it to the provider
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  console.log("Making payment with the account:", wallet.address);

  const requiredAmountETH = ethers.parseEther("0.001");

  // Get the contract instance connected to your wallet
  const contract = await ethers.getContractAt(
    "DoodlePayment",
    contractAddress,
    wallet
  );

  // const txpay = await contract.setPaymentAmount(
  //   ethers.ZeroAddress,
  //   requiredAmountETH
  // );

  // await txpay.wait();

  // // Fetch the required ETH payment amount for address(0)
  // const requiredAmount = await contract.requiredPaymentAmounts(
  //   ethers.ZeroAddress
  // );
  // console.log(
  //   "Required ETH amount:",
  //   ethers.formatEther(requiredAmount),
  //   "ETH"
  // );

  // // Pay in ETH
  // console.log("Sending payment transaction...");
  // const tx = await contract.payInETH({ value: requiredAmount });
  // console.log("Transaction submitted. Hash:", tx.hash);

  // // Wait for the transaction to be confirmed
  // const receipt = await tx.wait();
  // console.log("Transaction mined at block:", receipt?.blockNumber);

  // // You might want to fetch and display the newly assigned GUIDs after payment
  // const guids = await contract.getUserGUIDs(wallet.address);
  // console.log("GUIDs for this user:", guids);

  /**
   * WITH TEST TOKEN
   */
  const requiredTokenAmountTestToken = ethers.parseUnits("100", 18);
  const txpay2 = await contract.setPaymentAmount(
    testTokenAddress,
    requiredTokenAmountTestToken
  );

  await txpay2.wait();

  const testTokenContract = await ethers.getContractAt(
    "DoodTestToken",
    testTokenAddress,
    wallet
  );

  const mintTxt = await testTokenContract.mint(
    wallet.address,
    requiredTokenAmountTestToken
  );
  await mintTxt.wait();
  console.log("Minted test tokens for payment");

  const approveTx = await testTokenContract.approve(
    contractAddress,
    requiredTokenAmountTestToken
  );
  await approveTx.wait();
  console.log("Approved payment contract to spend tokens");

  const payTx = await contract.payInToken(testTokenAddress);
  const payReceipt = await payTx.wait();
  console.log("Token payment successful, receipt:", payReceipt);
}

// Handle errors in async function
main().catch((error) => {
  console.error("Error during execution:", error);
  process.exit(1);
});
