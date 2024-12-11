// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    function decimals() external view returns (uint8);
}

interface IPullOracle {
    struct Signature {
        bytes32 r;
        bytes32 s;
        uint8 v;
    }

    function getLastPrice(
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof,
        Signature[] calldata signatures,
        bytes32 dataKey,
        uint256 price,
        uint256 timestamp
    ) external returns (uint256);
}

contract MultiCurrencyPayment {
    address public owner;
    uint256 public fixedPricesUSD = 10;
    IPullOracle public pullOracle;

    mapping(address => uint256) public counters;

    // Events
    event PaymentReceived(
        address indexed payer,
        address indexed receiver,
        uint256 amount,
        address currency
    );

    event PriceUpdated(uint256 newPrice);

    event PriceVerified(bytes32 dataKey, uint256 price, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _pullOracle) {
        pullOracle = IPullOracle(_pullOracle);
        owner = msg.sender;
    }

    function updatePrice(uint256 priceUSD) external onlyOwner {
        fixedPricesUSD = priceUSD;
        emit PriceUpdated(priceUSD);
    }

    function getLastPrice(
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof,
        IPullOracle.Signature[] calldata signatures,
        bytes32 dataKey,
        uint256 updatePrice,
        uint256 updateTimestamp
    ) external returns (uint256) {
        uint256 verifiedPrice = pullOracle.getLastPrice(
            merkleRoot,
            merkleProof,
            signatures,
            dataKey,
            updatePrice,
            updateTimestamp
        );

        emit PriceVerified(dataKey, verifiedPrice, updateTimestamp);

        return verifiedPrice;
    }

    function pay(
        address currency,
        uint256 amount,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof,
        IPullOracle.Signature[] calldata signatures,
        bytes32 dataKey,
        uint256 updatePrice,
        uint256 updateTimestamp
    ) external payable {
        address receiver = owner;

        uint256 priceUsdOfCurrency = pullOracle.getLastPrice(
            merkleRoot,
            merkleProof,
            signatures,
            dataKey,
            updatePrice,
            updateTimestamp
        );

        emit PriceVerified(dataKey, priceUsdOfCurrency, updateTimestamp);

        require(priceUsdOfCurrency > 0, "Invalid price from oracle");

        uint256 requiredAmount;

        if (currency == address(0)) {
            requiredAmount =
                (fixedPricesUSD * 1e18 + priceUsdOfCurrency - 1) /
                priceUsdOfCurrency;
            require(msg.value >= requiredAmount, "Insufficient ETH sent");

            payable(receiver).transfer(msg.value);
        } else {
            // Adjust for token decimals
            uint256 tokenDecimals = 10 ** IERC20(currency).decimals();

            // Calculate the required token amount plus buffer
            requiredAmount =
                (fixedPricesUSD * tokenDecimals + priceUsdOfCurrency - 1) /
                priceUsdOfCurrency;
            require(amount >= requiredAmount, "Insufficient token amount");

            IERC20(currency).transferFrom(msg.sender, receiver, amount);
        }

        counters[receiver] += 1;

        uint256 paidAmount = (currency == address(0)) ? msg.value : amount;

        emit PaymentReceived(msg.sender, receiver, paidAmount, currency);
    }

    function getCounter() external view returns (uint256) {
        return counters[owner];
    }
}
