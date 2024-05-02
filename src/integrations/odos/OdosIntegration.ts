import BaseIntegration from "../BaseIntegration";
import { ethers, Contract } from "ethers";

class OdosIntegration extends BaseIntegration {
    private usdcContract: Contract;

    constructor() {
        super({
            baseUrl: process.env.ODOS_BASE_URL as string,
            chainId: 8453, // Default chainId for Base,
            providerUrl: 'https://mainnet.base.org',
            privateKey: ''
        });
        const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
        this.usdcContract = new ethers.Contract(usdcAddress, [
            "function balanceOf(address account) external view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
            "function decimals() external view returns (uint8)",
            "function symbol() external view returns (string)"
        ], this.provider);
    }

    async getQuoteFromOdos(): Promise<any> {
        const payload = {
            "chainId": 8453,
            "inputTokens": [
                {
                    "amount": "500000",
                    "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
                }
            ],
            "outputTokens": [
                {
                    "proportion": 1,
                    "tokenAddress": "0x4200000000000000000000000000000000000006"
                }
            ],
            "userAddr": this.wallet.address
        }

        try {
            const data = await this.post('/sor/quote/v2', payload)
            return data;
        } catch (error: any) {
            console.error(`Error fetching quote from ODOS: ${error.message}`);
            return null;
        }
    }

    async assembleTransaction(pathId: string): Promise<any> {
        const payload = {
            "userAddr": this.wallet.address,
            "receiver": this.wallet.address,
            "simulate": false,
            "pathId": pathId
        }

        try {
            const data = await this.post('/sor/assemble', payload)
            return data
        } catch (error: any) {
            console.error(`Error fetching quote from ODOS: ${error.message}`)
            return null
        }
    }

    async approveToken() {
        const tx = await this.usdcContract.approve(
            this.wallet.address,
            ethers.parseUnits("500000", 6)
        );

        const receipt = await tx.wait();
        console.log("Token approved:", receipt.transactionHash);
    }

    async executeOdosTransaction() {
        // this.approveToken();


        // const quote = await this.getQuoteFromOdos()
        // const assembleTx = await this.assembleTransaction(quote.pathId)

        // try {
        //     const txResponse = await this.wallet.sendTransaction(assembleTx.transaction);
        //     console.log("Transaction sent! Hash:", txResponse.hash);

        //     const receipt = await txResponse.wait();

        //     if (receipt) {
        //         console.log("Transaction confirmed in block:", receipt.blockNumber);
        //     }
        // } catch (error: any) {
        //     return Promise.reject(error);
        // }
    }
}

export default OdosIntegration;
