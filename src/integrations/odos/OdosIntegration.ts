import BaseIntegration from "../BaseIntegration";
import { ethers, Contract } from "ethers";
import { ContractService } from "./services/ContractService";
const keys = require('../../../wallet-info.json');

class OdosIntegration extends BaseIntegration {
    private service: ContractService;

    constructor(
        walletAddress: string,
        private fromToken: string,
        private toToken: string,
        private amount: string
    ) {
        super({
            baseUrl: process.env.ODOS_BASE_URL as string,
            chainId: Number(process.env.CHAIN_ID),
            providerUrl: process.env.PROVIDER_URL as string,
            privateKey: keys[walletAddress].private_key
        });
        this.service = new ContractService(this.wallet);
    }

    async getQuoteFromOdos(): Promise<any> {
        const payload = {
            "chainId": process.env.CHAIN_ID,
            "inputTokens": await this.generateInputToken(),
            "outputTokens": await this.generateOutputToken(),
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
            "simulate": false,
            "pathId": pathId
        }

        try {
            const data = await this.post('/sor/assemble', payload);
            return data;
        } catch (error: any) {
            console.error(`Error fetching quote from ODOS: ${error.message}`);
            return null;
        }
    }

    async approveToken(recipientAddress: string) {
        const tokenContract = new ethers.Contract('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', [
            'function approve(address spender, uint256 amount) returns (bool)'
        ], this.wallet);

        try {
            const approvalResult = await tokenContract.approve(recipientAddress, '50000')
            await approvalResult.wait();
            console.log('Approved successfully');
        } catch (error: any) {
            console.log(`Error approving transaction: ${error.message}`)
        }
    }

    async executeOdosTransaction() {
        const quote = await this.getQuoteFromOdos()
        const assembleTx = await this.assembleTransaction(quote.pathId)

        try {
            await this.approveToken(assembleTx.transaction.to);
            const currentNonce = await this.wallet.getNonce();

            const txResponse = await this.wallet.sendTransaction({
                ...assembleTx.transaction,
                nonce: currentNonce
            });
            console.log("Transaction sent! Hash:", txResponse.hash);

            const receipt = await txResponse.wait();
            if (receipt) {
                console.log("Transaction confirmed in block:", receipt.blockNumber);
            }
        } catch (error: any) {
            return Promise.reject(error);
        }
    }

    private async getAvailableTokens(): Promise<any> {
        try {
            const data = await this.get(`/info/tokens/${process.env.CHAIN_ID}`);
            return data;
        } catch (error: any) {
            console.error('Failed to fetch available tokens', error.message);
            return null;
        }
    }

    private async generateInputToken(): Promise<Array<object> | null | undefined> {
        const availableTokens = await this.getAvailableTokens();
        if (!availableTokens) {
            console.error('No available tokens');
            return null;
        }

        const fromTokenAddress = await this.service.getContractAddressBySymbol(availableTokens.tokenMap, this.fromToken);
        if (!fromTokenAddress) {
            console.error(`No address found for the symbol: ${this.fromToken}`);
            return null;
        }

        const isEth = this.fromToken.toLowerCase() === 'eth';
        const contractIn = isEth ? null : await this.service.getTokenContract(fromTokenAddress);
        const decimals = isEth ? 18 : await contractIn?.decimals();

        if (!decimals && !isEth) {
            console.error('Failed to fetch decimals for the token');
            return null;
        }

        const amount = ethers.parseUnits(this.amount, decimals).toString();
        const inputToken = {
            amount,
            "tokenAddress": fromTokenAddress
        };

        return [inputToken];
    }

    private async generateOutputToken(): Promise<Array<object> | null | undefined> {
        const availableTokens = await this.getAvailableTokens();
        if (!availableTokens) {
            console.error('No available tokens');
            return null;
        }

        const fromTokenAddress = await this.service.getContractAddressBySymbol(availableTokens.tokenMap, this.toToken);
        if (!fromTokenAddress) {
            console.error(`No address found for the symbol: ${this.fromToken}`);
            return null;
        }

        return [{ "proportion": 1, "tokenAddress": fromTokenAddress }];
    }
}

export default OdosIntegration;
