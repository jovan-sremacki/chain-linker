const { ethers } = require('ethers')
const axios = require('axios')

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const wallet = new ethers.Wallet('7ec785a48649a256276e98779f0b59c2e6cb963d8ddd5961340aadb3034afd3f', provider);

async function getQuoteFromOdos() {
    const endpoint = "https://api.odos.xyz/sor/quote/v2"
    // const payload = {
    //     "chainId": 8453,
    //     "inputTokens": [
    //         {
    //             "amount": "50000",
    //             "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    //         }
    //     ],
    //     "outputTokens": [
    //         {
    //             "proportion": 1,
    //             "tokenAddress": "0x4200000000000000000000000000000000000006"
    //         }
    //     ],
    //     "userAddr": wallet.address
    // }
    const payload = {
        "chainId": 8453,
        "inputTokens": [
            {
                "amount": "1",
                "tokenAddress": "0x4200000000000000000000000000000000000006"
            }
        ],
        "outputTokens": [
            {
                "proportion": 1,
                "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
            }
        ],
        "userAddr": wallet.address
    }

    try {
        const response = await axios.post(endpoint, payload)
        return response.data
    } catch (error) {
        console.error(`Error fetching quote from ODOS: ${error.message}`)
        return null
    }
}

async function assembleTransaction(pathId) {
    const endpoint = "https://api.odos.xyz/sor/assemble"

    const payload = {
        "userAddr": wallet.address,
        "pathId": pathId,
        "simulate": false
    }

    try {
        const response = await axios.post(endpoint, payload)
        return response.data
    } catch (error) {
        console.error(`Error fetching quote from ODOS: ${error.message}`)
        return null
    }
}


async function executeOdosTransaction() {
    const quote = await getQuoteFromOdos()
    const assembleTx = await assembleTransaction(quote.pathId)

    const tokenContract = new ethers.Contract('0x4200000000000000000000000000000000000006', [
        'function approve(address spender, uint256 amount) returns (bool)'
    ], wallet)

    try {
        const approvalResult = await tokenContract.approve(assembleTx.transaction.to, '10')
        await approvalResult.wait();
        console.log('Approved successfully');
    } catch (error) {
        console.error(`Error approving transaction: ${error.message}`)
    }

    try {
        const currentNonce = await wallet.getNonce();

        const txResponse = await wallet.sendTransaction({
            ...assembleTx.transaction,
            nonce: currentNonce
        });
        console.log("Transaction sent! Hash:", txResponse.hash);

        const receipt = await txResponse.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
    } catch (error) {
        console.error(`Error sending transaction: ${error.message}`)
    }
}

executeOdosTransaction()
