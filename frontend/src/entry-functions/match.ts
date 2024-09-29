import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULE_ADDRESS } from "@/constants";

export type MatchArguments = {
  profile: string
};

export const match = (args: MatchArguments): InputTransactionData => {
  const { profile } = args;
  return {
    data: {
      function: `${MODULE_ADDRESS}::date::match`,
      functionArguments: [profile],
    },
  };
};
