import { MODULE_ADDRESS, NODIT_ENDPOINT, NODIT_API_KEY } from "@/constants";
import axios from 'axios';

export type AccountAPTBalanceArguments = {
  accountAddress: string;
};

export const checkProfileExists = async (args: AccountAPTBalanceArguments): Promise<boolean | string> => {
  const { accountAddress } = args;
  
  try {
    const response = await axios.post(
      `${NODIT_ENDPOINT}/v1/view`,
      {
        function: `${MODULE_ADDRESS}::date::check_profile_exists`,
        type_arguments: [],
        arguments: [accountAddress]
      },
      {
        headers: {
          'Accept': 'application/json, application/x-bcs',
          'Content-Type': 'application/json',
          'X-API-KEY': NODIT_API_KEY
        }
      }
    );
    if (response.status === 200) {
      return response.data[0]
    } else {
      return false
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    console.error(error);
    return `error: ${error}`;
  }
};
