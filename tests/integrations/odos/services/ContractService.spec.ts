import { ContractService } from '../../../../src/integrations/odos/services/ContractService';
import { ethers } from 'ethers';

describe('ContractService', () => {
    let service: ContractService;
    let mockWallet: ethers.Wallet;

    beforeEach(() => {
        mockWallet = new ethers.Wallet(process.env.PRIVATE_KEY as string);
        service = new ContractService(mockWallet);
    });

    describe('getContractAddressBySymbol', () => {
        const tokenMap = {
            "0x0000000000000000000000000000000000000000": {
                "name": "Ethereum",
                "symbol": "ETH",
                "decimals": 18,
                "assetId": "eth",
                "assetType": "eth",
                "protocolId": "native",
                "isRebasing": false
            },
            "0x4200000000000000000000000000000000000006": {
                "name": "Wrapped Ether",
                "symbol": "WETH",
                "decimals": 18,
                "assetId": "weth",
                "assetType": "eth",
                "protocolId": null,
                "isRebasing": false
            },
            "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA": {
                "name": "USD Base Coin (Bridged)",
                "symbol": "USDbC",
                "decimals": 6,
                "assetId": "usdc",
                "assetType": "usd",
                "protocolId": "circle",
                "isRebasing": false
            }
        };

        it('should return the correct address when the symbol matches', async () => {
            const symbol = 'weth';
            const address = await service.getContractAddressBySymbol(tokenMap, symbol);
            expect(address).toBe('0x4200000000000000000000000000000000000006');
        });

        it('should return null when no symbol matches', async () => {
            const symbol = 'ccc';
            const address = await service.getContractAddressBySymbol(tokenMap, symbol);
            expect(address).toBeNull();
        });
    });

    describe('getTokenContract', () => {
        it('should return a Contract instance with the correct address and ABI', async () => {
            const address = '0x4200000000000000000000000000000000000006';
            const contract = await service.getTokenContract(address);

            expect(contract).toBeInstanceOf(ethers.Contract);
            expect(await contract?.getAddress()).toBe(address);
            expect(contract?.interface.fragments.length).toBeGreaterThan(0); // Checking if ABI is set
        });

        it('should handle errors gracefully', async () => {
            jest.spyOn(ethers, 'Contract').mockImplementation(() => {
                throw new Error('Failed to create contract');
            });
            await expect(service.getTokenContract('0x999')).rejects.toThrow('Failed to create contract');
        });
    });
});
