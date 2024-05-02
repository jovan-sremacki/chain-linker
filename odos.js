const { ethers } = require('ethers')
const axios = require('axios')

async function getQuoteFromOdos() {
    const endpoint = "https://api.odos.xyz/sor/quote/v2"
    const payload = {
        "chainId": 8453,
        "inputTokens": [
            {
                "amount": "50000",
                "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
            }
        ],
        "outputTokens": [
            {
                "proportion": 1,
                "tokenAddress": "0xA61BeB4A3d02decb01039e378237032B351125B4"
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
        "receiver": wallet.address,
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

    try {
        const txResponse = await wallet.sendTransaction(assembleTx.transaction);
        console.log("Transaction sent! Hash:", txResponse.hash);

        const receipt = await txResponse.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
    } catch (error) {
        console.error(`Error sending transaction: ${error.message}`)
    }
}

executeOdosTransaction()
