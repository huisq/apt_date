import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULE_ADDRESS } from "@/constants";

export type MintProfileArguments = {
  name: string,
  age: number,
  gender: boolean,
  seeking: number,
  description: string,
  tg: string,
  photo: string
};

export const mintProfile = (args: MintProfileArguments): InputTransactionData => {
  const { name, age, gender, seeking, description, tg, photo } = args;
  return {
    data: {
      function: `${MODULE_ADDRESS}::date::mint_profile`,
      functionArguments: [name, age, gender, seeking, description, tg, photo],
    },
  };
};
