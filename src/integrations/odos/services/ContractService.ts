// ContractService.ts
import { ethers, Contract } from "ethers";

export class ContractService {
    constructor(private wallet: ethers.Wallet) { }

    async getContractAddressBySymbol(availableTokens: any, symbol: string): Promise<string | null | undefined> {
        for (const address in availableTokens) {
            if (availableTokens[address].symbol.toLowerCase() === symbol) {
                return address;
            }
        }
        return null;
    }

    async getTokenContract(tokenAddress: string): Promise<Contract | null | undefined> {
        const abi = [
            "function decimals() view returns (uint8)",
            "function approve(address spender, uint256 amount) returns (bool)"
        ];
        return new ethers.Contract(tokenAddress, abi, this.wallet);
    }

    async prepareTokenTransfer(
        availableTokens: Array<object>,
        tokenSymbol: string,
        amount: string
    ) {
        const tokenAddress = await this.getContractAddressBySymbol(availableTokens, tokenSymbol);
        if (!tokenAddress) {
            console.error(`No address found for the symbol: ${tokenSymbol}`);
            return null;
        }

        const isEth = tokenSymbol.toLowerCase() === 'eth';
        const contract = isEth ? null : await this.getTokenContract(tokenAddress);
        const decimals = isEth ? 18 : await contract?.decimals();

        if (!decimals && !isEth) {
            console.error('Failed to fetch decimals for the token');
            return null;
        }

        return {
            success: true,
            amount: ethers.parseUnits(amount, decimals).toString(),
            tokenAddress
        }
    }

    async approveToken(
        tokenAddress: string,
        receipientAddress: string,
        amount: string
    ) {
        try {
            const tokenContract = await this.getTokenContract(tokenAddress);
            const approvalResult = await tokenContract?.approve(receipientAddress, amount)
            await approvalResult.wait();
            console.log('Approved successfully');
        } catch (error: any) {
            console.log(`Error approving transaction: ${error.message}`)
        }
    }

    async parseGasEstimate(gasPrice: string) {
        return ethers.parseEther(gasPrice).toString();
    }
}
