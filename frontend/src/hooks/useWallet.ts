import { useCurrentAccount, useSignTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useCallback } from "react";
import { notifications } from "@mantine/notifications";

export interface WalletState {
  account: any;
  isConnected: boolean;
  address?: string;
  signAndExecuteTransaction: (transaction: Transaction) => Promise<any>;
  signTransaction: (transaction: Transaction) => Promise<string>;
}

export const useWallet = (): WalletState => {
  const account = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const isConnected = !!account;
  const address = account?.address;

  const signAndExecuteTransaction = useCallback(
    async (transaction: Transaction) => {
      if (!account) {
        throw new Error("Wallet not connected");
      }

      try {
        const result = await signTransaction({
          transaction,
          account,
        });

        notifications.show({
          title: "Transaction Successful",
          message: "Your transaction has been completed successfully",
          color: "green",
        });

        return result;
      } catch (error) {
        notifications.show({
          title: "Transaction Failed",
          message: `Transaction failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          color: "red",
        });
        throw error;
      }
    },
    [account, signTransaction]
  );

  const signTransactionOnly = useCallback(
    async (transaction: Transaction): Promise<string> => {
      if (!account) {
        throw new Error("Wallet not connected");
      }

      try {
        const result = await signTransaction({
          transaction,
          account,
        });

        return result.signature;
      } catch (error) {
        console.error("Sign transaction error:", error);
        throw error;
      }
    },
    [account, signTransaction]
  );

  return {
    account,
    isConnected,
    address,
    signAndExecuteTransaction,
    signTransaction: signTransactionOnly,
  };
};
