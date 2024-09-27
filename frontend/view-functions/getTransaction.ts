import axios from 'axios';
import { NODIT_ENDPOINT, NODIT_API_KEY } from '@/constants';

/**
 * Fetches transaction details by transaction hash.
 * @param {string} txnHash - The transaction hash to fetch details for.
 * @returns {Promise<any>} A promise that resolves to the transaction details.
 */
export const getTransaction = async (txnHash: string): Promise<any> => {
  try {
    const response = await axios.get(`${NODIT_ENDPOINT}/v1/transactions/by_hash/${txnHash}`, {
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': NODIT_API_KEY
      }
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to fetch transaction details');
    }
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw error;
  }
};
