import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApi } from '../helpers/ApiClient';

export default function useApi() {
	const navigate = useNavigate();
	return useMemo(() => createApi(navigate), [navigate]);
}
