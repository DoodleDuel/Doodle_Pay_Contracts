// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract DoodlePayment {
    // Mapping from token address to required payment amount
    // Use address(0) to represent ETH
    mapping(address => uint256) public requiredPaymentAmounts;

    // Mapping from user to their array of GUIDs
    mapping(address => bytes32[]) public userGUIDs;

    // A simple counter to generate pseudo GUIDs
    uint256 private guidCounter;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Set the required payment amount for a given currency (token).
     * @param token The token address. Use address(0) for ETH.
     * @param amount The required amount to pay.
     */
    function setPaymentAmount(
        address token,
        uint256 amount
    ) external onlyOwner {
        requiredPaymentAmounts[token] = amount;
    }

    /**
     * @dev Pay using ETH. The caller must send the exact required amount of ETH.
     * If successful, the user receives a GUID.
     */
    function payInETH() external payable {
        uint256 requiredAmount = requiredPaymentAmounts[address(0)];
        require(requiredAmount > 0, "Payment in ETH not set");
        require(msg.value == requiredAmount, "Incorrect ETH amount sent");

        _assignGUID(msg.sender);
    }

    /**
     * @dev Pay using an ERC20 token. The caller must have approved this contract to spend the required amount beforehand.
     * @param token The token address.
     */
    function payInToken(address token) external {
        require(token != address(0), "Use payInETH for ETH");
        uint256 requiredAmount = requiredPaymentAmounts[token];
        require(requiredAmount > 0, "Payment not set for this token");

        // Transfer the tokens from the caller to this contract
        bool success = IERC20(token).transferFrom(
            msg.sender,
            address(this),
            requiredAmount
        );
        require(success, "Token transfer failed");

        _assignGUID(msg.sender);
    }

    /**
     * @dev Internal function to generate and assign a GUID to a user.
     * GUID is a pseudo-random generated value here for demonstration.
     */
    function _assignGUID(address user) internal {
        guidCounter++;
        // A simple GUID can be generated from a hash of the current block and a counter
        bytes32 newGUID = keccak256(
            abi.encodePacked(block.timestamp, user, guidCounter)
        );
        userGUIDs[user].push(newGUID);
    }

    /**
     * @dev Get all GUIDs assigned to a user.
     */
    function getUserGUIDs(
        address user
    ) external view returns (bytes32[] memory) {
        return userGUIDs[user];
    }

    /**
     * @dev Withdraw collected tokens or ETH by the owner.
     */
    function withdraw(address token) external onlyOwner {
        if (token == address(0)) {
            // Withdraw ETH
            payable(owner).transfer(address(this).balance);
        } else {
            // Withdraw ERC20 tokens
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance > 0, "No balance to withdraw");
            IERC20(token).transferFrom(address(this), owner, balance);
        }
    }
}
