import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { JsonRpcProvider, Wallet, ethers } from "ethers";

interface Config {
    baseUrl: string,
    chainId: number,
    providerUrl: string,
    privateKey: string,
    timeout?: number
}

class BaseIntegration {
    protected client: AxiosInstance;
    protected wallet: Wallet;
    protected chainId: number; // Base chainid
    protected provider: JsonRpcProvider;
    private baseUrl: string;
    private privateKey: string;
    private timeout: number;

    constructor(config: Config) {
        this.baseUrl = config.baseUrl;
        this.chainId = config.chainId;
        this.privateKey = config.privateKey;
        this.timeout = config.timeout || 5000;

        this.provider = new ethers.JsonRpcProvider(config.providerUrl);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout
        });

        this.client.interceptors.response.use(this.handleSuccess, this.handleError);
    }

    protected handleSuccess(response: AxiosResponse): AxiosResponse {
        return response;
    }

    protected handleError(error: AxiosError): Promise<AxiosError> {
        console.error(`Error from ${error.config?.url}`, error.message);

        return Promise.reject(error);
    }

    protected async get(endpoint: string, params: object = {}): Promise<AxiosResponse | null> {
        try {
            const response = await this.client.get(endpoint, { params });
            return response.data;
        } catch (error: any) {
            console.error('API get request failed:', error.message);
            return null;
        }
    }

    protected async post(endpoint: string, payload: object = {}): Promise<AxiosResponse | null> {
        try {
            const response = await this.client.post(endpoint, payload);
            return response.data;
        } catch (error: any) {
            console.error('API post request failed:', error.message);
            return null;
        }
    }
}

export default BaseIntegration;
