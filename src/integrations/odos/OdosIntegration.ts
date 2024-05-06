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

    async executeOdosTransaction() {
        const quote = await this.getQuoteFromOdos()
        const assembleTx = await this.assembleTransaction(quote.pathId)

        try {
            const currentNonce = await this.wallet.getNonce();
            console.log(`Current nonce: ${currentNonce}`);

            this.service.approveToken(
                assembleTx.inputTokens[0].tokenAddress,
                assembleTx.transaction.to,
                assembleTx.inputTokens[0].amount
            )

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

        const tokenTransfer = await this.service.prepareTokenTransfer(availableTokens.tokenMap, this.fromToken, this.amount);
        if (!tokenTransfer?.success) {
            console.error('Failed to prepare token transfer');
            return null;
        }

        const inputToken = {
            "amount": tokenTransfer.amount,
            "tokenAddress": tokenTransfer.tokenAddress
        };

        return [inputToken];
    }

    private async generateOutputToken(): Promise<Array<object> | null | undefined> {
        const availableTokens = await this.getAvailableTokens();
        if (!availableTokens) {
            console.error('No available tokens');
            return null;
        }

        const tokenAddress = await this.service.getContractAddressBySymbol(availableTokens.tokenMap, this.toToken);
        if (!tokenAddress) {
            console.error(`No address found for the symbol: ${this.fromToken}`);
            return null;
        }

        return [{ "proportion": 1, "tokenAddress": tokenAddress }];
    }
}

export default OdosIntegration;
