import { isAxiosError } from 'axios';
import { USE_MOCK_DATA } from '../constants/config';
import documentsMock from '../data/mocks/documents-juridiques.json';
import api from './api';

export type TypeDocumentJuridique = 'cgu' | 'confidentialite' | 'mentions_legales';

export const TYPES_DOCUMENTS_JURIDIQUES: TypeDocumentJuridique[] = ['cgu', 'confidentialite', 'mentions_legales'];

export type DocumentJuridique = {
  type: TypeDocumentJuridique;
  titre: string;
  contenu: string;
  version: string;
  mis_a_jour_le: string;
};

/**
 * Renvoie le document, ou `null` s'il n'est pas encore rédigé dans le backoffice
 * (l'API répond alors 404). Les autres erreurs (réseau…) sont propagées.
 */
export const getDocumentJuridique = async (type: TypeDocumentJuridique): Promise<DocumentJuridique | null> => {
  if (USE_MOCK_DATA) {
    return documentsMock[type] as DocumentJuridique;
  }

  try {
    const response = await api.get<DocumentJuridique>(`/documents-juridiques/${type}`);
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
