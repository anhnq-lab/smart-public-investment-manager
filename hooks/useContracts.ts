// Custom hook for Contracts data fetching
import { useState, useEffect, useCallback } from 'react';
import { ContractService } from '../services/ContractService';
import { Contract, ContractStatus } from '../types';
import type { QueryParams } from '../types/api';

interface UseContractsResult {
    contracts: Contract[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    search: (query: string) => Promise<void>;
    create: (data: Partial<Contract>) => Promise<Contract>;
    update: (id: string, data: Partial<Contract>) => Promise<Contract>;
    remove: (id: string) => Promise<void>;
}

/**
 * Hook to fetch and manage contracts list
 */
export const useContracts = (packageId?: string): UseContractsResult => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [params, setParams] = useState<QueryParams>({
        filters: packageId ? { packageId } : undefined,
    });

    const fetchContracts = useCallback(async (queryParams?: QueryParams) => {
        setLoading(true);
        setError(null);
        try {
            const data = await ContractService.getAll(queryParams || params);
            setContracts(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [params]);

    const refetch = useCallback(async () => {
        await fetchContracts();
    }, [fetchContracts]);

    const search = useCallback(async (query: string) => {
        const newParams = { ...params, search: query };
        setParams(newParams);
        await fetchContracts(newParams);
    }, [params, fetchContracts]);

    const create = useCallback(async (data: Partial<Contract>): Promise<Contract> => {
        const newContract = await ContractService.create(data);
        setContracts(prev => [newContract, ...prev]);
        return newContract;
    }, []);

    const update = useCallback(async (id: string, data: Partial<Contract>): Promise<Contract> => {
        const updated = await ContractService.update(id, data);
        setContracts(prev => prev.map(c => c.ContractID === id ? updated : c));
        return updated;
    }, []);

    const remove = useCallback(async (id: string): Promise<void> => {
        await ContractService.delete(id);
        setContracts(prev => prev.filter(c => c.ContractID !== id));
    }, []);

    useEffect(() => {
        fetchContracts();
    }, [packageId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { contracts, loading, error, refetch, search, create, update, remove };
};

interface UseContractResult {
    contract: Contract | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    update: (data: Partial<Contract>) => Promise<void>;
}

/**
 * Hook to fetch and manage a single contract
 */
export const useContract = (id: string | undefined): UseContractResult => {
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchContract = useCallback(async () => {
        if (!id) {
            setContract(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await ContractService.getById(id);
            setContract(data || null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const refetch = useCallback(async () => {
        await fetchContract();
    }, [fetchContract]);

    const update = useCallback(async (data: Partial<Contract>) => {
        if (!id || !contract) return;
        try {
            const updated = await ContractService.update(id, data);
            setContract(updated);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [id, contract]);

    useEffect(() => {
        fetchContract();
    }, [fetchContract]);

    return { contract, loading, error, refetch, update };
};

/**
 * Hook for contract statistics
 */
export const useContractStatistics = () => {
    const [stats, setStats] = useState<{
        total: number;
        totalValue: number;
        byStatus: Record<ContractStatus, number>;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await ContractService.getStatistics();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch contract statistics', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading };
};
