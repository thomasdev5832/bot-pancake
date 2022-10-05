require("dotenv").config();
const axios = require("axios");
const { ethers } = require("ethers");

const CAKE_MAINNET = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"; 
const CAKE_TESTNET = "0xf9f93cf501bfadb6494589cb4b4c15de49e85d0e";
const USDT_TESTNET = "0x7ef95a0fee0dd31b22626fa2e10ee6a223f8a684";
const WBNB_TESTNET = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

function getWallet(){
    const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
    return wallet.connect(provider);
}

function approve(wallet, tokenToApprove, value){
    const contract = new ethers.Contract(
        tokenToApprove,
        ["function approve(address _spender, uint256 _value) public returns (bool success)"],
        wallet
    );
    return contract.approve(process.env.ROUTER_CONTRACT, value);
}

async function swapTokens(tokenFrom, quantity, tokenTo){
    const wallet = getWallet();
    console.log("Wallet:" + wallet.toString());
    const contract = new ethers.Contract(
        process.env.ROUTER_CONTRACT,
        ["function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"],
        wallet
    );

    const value = ethers.utils.parseEther(quantity).toHexString();

    await approve(wallet, tokenFrom, value);
    
    const result = await contract.swapExactTokensForTokens(
        value,
        0,
        [tokenFrom, WBNB_TESTNET, tokenTo],
        process.env.WALLET,
        Date.now() + 10000,
        {
            gasPrice: 10000000000,
            gasLimit: 250000
        }
    )
    console.log(result);
}

let isOpened = false;

setInterval( async () => {
   const { data } = await axios.get("https://api.pancakeswap.info/api/v2/tokens/" + CAKE_MAINNET);
   console.log("Cake Price: " + data.data.price);

    const price = parseFloat(data.data.price);
    if(price < 4.7 && !isOpened){
        console.log("Cheap! Time to Buy is now!");
        swapTokens(USDT_TESTNET, "10", CAKE_TESTNET);
        isOpened = true;
    }
    else if(price > 4.8 && isOpened){
        console.log("Expensive! Time to Sell is now!");
        swapTokens(CAKE_TESTNET, "10", USDT_TESTNET);
        isOpened = false;
    }

}, 3000);