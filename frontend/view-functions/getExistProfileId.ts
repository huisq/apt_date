import { NODIT_INDEXER_ENDPOINT, NODIT_API_KEY, MODULE_ADDRESS, NODIT_ENDPOINT } from "@/constants";
import axios from 'axios';

export type GetExistProfileArguments = {
  accountAddress: string;
};

export const getExistProfileId = async (args: GetExistProfileArguments): Promise<any> => {
  const { accountAddress } = args
  try {
    const collectionIdResponse = await axios.post(
      `${NODIT_ENDPOINT}/v1/view`,
      {
        function: `${MODULE_ADDRESS}::date::get_collection_address`,
        type_arguments: [],
        arguments: []
      },
      {
        headers: {
          'Accept': 'application/json, application/x-bcs',
          'Content-Type': 'application/json',
          'X-API-KEY': NODIT_API_KEY
        }
      }
    );
    if (collectionIdResponse.status !== 200 || !collectionIdResponse.data[0]) {
      throw new Error('Get Collection Id error');
    }    
    const collectionId = collectionIdResponse.data[0];

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query MyQuery {
            current_token_ownerships_v2(
              limit: 1
              offset: 0
              where: {current_token_data: {collection_id: {_eq: "${collectionId}"}}, owner_address: {_eq: "${accountAddress}"}}
            ) {
              owner_address
              token_data_id
            }
          }
        `,
        operationName: "MyQuery"
      })
    };
    const response = await fetch(NODIT_INDEXER_ENDPOINT, options);
    const res = await response.json();
    return res?.data?.current_token_ownerships_v2[0]?.token_data_id;
  } catch (error) {
    console.error('Get token_data_id error:', error);
    throw error;
  }
};
