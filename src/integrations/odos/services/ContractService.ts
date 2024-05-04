// ContractService.ts
import { ethers, Contract } from "ethers";

export class ContractService {
    constructor(private wallet: ethers.Wallet) { }

    async getContractAddressBySymbol(tokenMap: any, symbol: string): Promise<string | null | undefined> {
        for (const address in tokenMap) {
            if (tokenMap[address].symbol.toLowerCase() === symbol) {
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
}
