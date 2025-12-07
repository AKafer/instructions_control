export const getFilenameFromContentDisposition = (header) => {
	if (!header) return 'personal_docs.zip';
	const filenameStarMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
	if (filenameStarMatch) {
		try { return decodeURIComponent(filenameStarMatch[1]); } catch { return filenameStarMatch[1]; }
	}
	const filenameMatch = header.match(/filename="?([^";]+)"?/i);
	if (filenameMatch) return filenameMatch[1];
	return 'personal_docs.zip';
};