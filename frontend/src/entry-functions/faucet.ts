import {
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";
import { NODIT_NODE_ENDPOINT, NODIT_INDEXER_ENDPOINT } from "@/constants"
import { toast } from "@/components/ui/use-toast";
import { NETWORK } from "@/constants";

const config = new AptosConfig({
  network: NETWORK,
  fullnode: NODIT_NODE_ENDPOINT,
  indexer: NODIT_INDEXER_ENDPOINT,
  faucet: "https://faucet.testnet.aptoslabs.com",
});
const aptos = new Aptos(config);

export const getFaucet = async (address: string) => {
  try {
    const result = await aptos.fundAccount({
      accountAddress: address,
      amount: 100_000_000,
    });
    console.log(result);
    // toast({
    //   title: "Success",
    //   description: "Faucet funds have been successfully transferred.",
    // });
    return result;
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: "Failed to get faucet funds. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};