import axios from 'axios';
import { NODIT_INDEXER_ENDPOINT } from '@/constants';

export const getProfile = async (tokenDataId: string): Promise<any> => {
  try {
    const query = `
      query MyQuery {
        current_token_datas_v2(
          limit: 5
          offset: 0
          where: {
            token_data_id: {
              _eq: "${tokenDataId}"
            }
          }
        ) {
          token_data_id
          token_name
          token_properties
          token_standard
          token_uri
          collection_id
        }
      }
    `;

    const response = await axios.post(NODIT_INDEXER_ENDPOINT, {
      query,
      operationName: "MyQuery"
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data) {      
      return response.data.data.current_token_datas_v2[0];
    } else {
      throw new Error('No profile data found');
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};
