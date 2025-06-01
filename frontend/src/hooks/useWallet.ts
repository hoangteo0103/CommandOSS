import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useCallback } from "react";

export interface WalletState {
  account: any;
  isConnected: boolean;
  address?: string;
  signAndExecuteTransaction: (transaction: Transaction) => Promise<any>;
}

export const useWallet = (): WalletState => {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const isConnected = !!account;
  const address = account?.address;

  const signAndExecuteTransactionWrapper = useCallback(
    async (transaction: Transaction) => {
      if (!account) {
        throw new Error("Wallet not connected");
      }

      try {
        const result = await signAndExecuteTransaction({
          transaction,
          account,
        });

        console.log("✅ Transaction executed successfully:", result);

        // Don't show notification here since the purchase hook handles it
        return result;
      } catch (error) {
        console.error("❌ Transaction execution failed:", error);
        throw error;
      }
    },
    [account, signAndExecuteTransaction]
  );

  return {
    account,
    isConnected,
    address,
    signAndExecuteTransaction: signAndExecuteTransactionWrapper,
  };
};
