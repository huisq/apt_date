import {
  Aptos,
  AptosConfig,
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

export const getAddrAmount = async (address: string): Promise<number> => {
  try {
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: address,
    });
    return balance;
  } catch (error) {
    console.error("Error fetching account balance:", error);
    toast({
      title: "Error",
      description: "Failed to fetch account balance. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};
