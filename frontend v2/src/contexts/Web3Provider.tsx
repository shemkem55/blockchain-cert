import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { Web3Context, Web3State } from './Web3Context';

const NETWORK_NAMES: Record<number, string> = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
    56: 'BSC Mainnet',
    97: 'BSC Testnet',
    42161: 'Arbitrum One',
    10: 'Optimism',
};

export const Web3Provider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<Web3State>({
        provider: null,
        signer: null,
        address: null,
        chainId: null,
        isConnecting: false,
        isConnected: false,
        error: null,
    });

    const getNetworkName = useCallback(() => {
        if (!state.chainId) return 'Unknown Network';
        return NETWORK_NAMES[state.chainId] || `Chain ID: ${state.chainId}`;
    }, [state.chainId]);

    const connect = useCallback(async () => {
        if (typeof window.ethereum === 'undefined') {
            setState(prev => ({ ...prev, error: 'MetaMask is not installed' }));
            return '';
        }

        setState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            setState({
                provider,
                signer,
                address,
                chainId: Number(network.chainId),
                isConnecting: false,
                isConnected: true,
                error: null,
            });
            return address;
        } catch (error: unknown) {
            setState(prev => ({
                ...prev,
                isConnecting: false,
                error: error instanceof Error ? error.message : 'Failed to connect wallet',
            }));
            throw error;
        }
    }, []);

    const disconnect = useCallback(() => {
        setState({
            provider: null,
            signer: null,
            address: null,
            chainId: null,
            isConnecting: false,
            isConnected: false,
            error: null,
        });
    }, []);

    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else if (state.isConnected) {
                    connect();
                }
            };

            const handleChainChanged = () => {
                if (state.isConnected) {
                    connect();
                }
            };

            const ethereum = window.ethereum;
            ethereum.on('accountsChanged', handleAccountsChanged as (accounts: unknown) => void);
            ethereum.on('chainChanged', handleChainChanged as (chain: unknown) => void);

            return () => {
                ethereum.removeListener('accountsChanged', handleAccountsChanged as (accounts: unknown) => void);
                ethereum.removeListener('chainChanged', handleChainChanged as (chain: unknown) => void);
            };
        }
    }, [connect, disconnect, state.isConnected]);

    return (
        <Web3Context.Provider value={{ ...state, connect, disconnect, getNetworkName }}>
            {children}
        </Web3Context.Provider>
    );
};
