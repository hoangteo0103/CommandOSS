import {
  useCurrentAccount,
  useConnectWallet,
  useDisconnectWallet,
} from "@mysten/dapp-kit";

export const useWallet = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  return {
    account: currentAccount,
    isConnected: !!currentAccount,
    address: currentAccount?.address,
    connect,
    disconnect,
  };
};
