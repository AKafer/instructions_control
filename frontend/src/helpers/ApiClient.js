import axios from 'axios';
import { PREFIX, JWT_STORAGE_KEY } from './constants';

export function createApi(navigate) {
	const api = axios.create({
		baseURL: `${PREFIX}/api/v1`,
		withCredentials: true
	});

	api.interceptors.request.use((cfg) => {
		 if (!cfg.url.startsWith('auth/jwt/refresh')) {
			const t = localStorage.getItem(JWT_STORAGE_KEY);
			if (t) cfg.headers.Authorization = `Bearer ${t}`;
		}
		return cfg;
	});

	let refreshing = false;
	let queue = [];

	const subscribe = (cb) => queue.push(cb);
	const publish  = (tok, err) => {
		queue.forEach((cb) => cb(tok, err));
		queue = [];
	};

	api.interceptors.response.use(
		(resp) => resp,
		async (err) => {
			const { response, config } = err;
			const original = config;

			if (response?.status === 401 && !original._retry) {
				if (refreshing) {
					return new Promise((res, rej) =>
						subscribe((tok, e) => (e ? rej(e) : res(api({ ...original, headers: { ...original.headers, Authorization: `Bearer ${tok}` } }))))
					);
				}

				original._retry = true;
				refreshing = true;

				try {
					const { data } = await api.post(
						'/auth/jwt/refresh',
						{},
						{ withCredentials: true }
					);

					const newToken = data.access_token;
					localStorage.setItem(JWT_STORAGE_KEY, newToken);
					api.defaults.headers.Authorization = `Bearer ${newToken}`;
					publish(newToken);

					original.headers.Authorization = `Bearer ${newToken}`;
					return api(original);
				} catch (e) {
					publish(null, e);
					localStorage.removeItem(JWT_STORAGE_KEY);
					navigate('/login');
					return Promise.reject(e);
				} finally {
					refreshing = false;
				}
			}

			return Promise.reject(err);
		}
	);

	return api;
}
