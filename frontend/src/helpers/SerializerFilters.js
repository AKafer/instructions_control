export function serializeFilters(filters) {
	const params = [];
	Object.entries(filters || {}).forEach(([key, value]) => {
		if (value === undefined || value === null) return;

		if (Array.isArray(value)) {
			value.forEach(v => {
				if (v === undefined || v === null || v === '') return;
				params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
			});
		} else {
			if (value === '') return;
			params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
		}
	});

	return params.join('&');
}
