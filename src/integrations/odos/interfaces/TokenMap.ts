interface TokenDetails {
    name: string;
    symbol: string;
    decimals: number;
    assetId: string;
    assetType: string;
    protocolId: string;
    isRebasing: boolean;
}

interface TokenMap {
    [address: string]: TokenDetails;
}

export default TokenMap;