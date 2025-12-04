import React, { useState } from 'react';
import styles from './Organizations.module.css';
import useApi from '../../../hooks/useApi.hook';
import Spinner from '../../Spinner/Spinner';
import PickTemplates from '../components/PickTemplates/PickTemplates';
import PersonalUsers from '../Personals/PersonalUsers/PersonalUsers';
import OrganizationManage from './OrganizationManage/OrganizationManage';

export function Organizations() {
	const api = useApi();
	const [selectedTemplate, setSelectedTemplate] = useState('');
	const [placeholders, setPlaceholders] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [error, setError] = useState(undefined);
	const [loading, setLoading] = useState(false);

	const handleGenerate = async () => {

		const plh = placeholders
			.filter((p) => p.key?.trim() && p.value?.trim())
			.map((p) => ({ key: p.key, value: p.value }));

		if (!selectedTemplate || selectedUsers.length === 0) return;
		setError(undefined);
		setLoading(true);
		try {
			const response = await api.post('/documents/orgnization_generate', {
				template: selectedTemplate,
				users_uuid_list: selectedUsers,
				placeholders: plh
			}, {
				responseType: 'blob'
			});

			const url = window.URL.createObjectURL(response.data);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'personal_docs.zip';
			link.click();
			window.URL.revokeObjectURL(url);

		} catch (e) {
			let msg = 'Ошибка при запросе к серверу';

			if (e.response) {
				const contentType = e.response.headers['content-type'];
				if (contentType?.includes('application/json')) {
					const reader = new FileReader();
					reader.onload = () => {
						try {
							const data = JSON.parse(reader.result);
							setError(data.detail || msg);
						} catch {
							setError(msg);
						}
					};
					reader.readAsText(e.response.data);
				} else {
					setError(msg);
				}
			} else {
				setError(e.message || msg);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.container}>
			{error && (
				<div className={styles.error} onClick={() => setError(undefined)}>
					{error} <span className={styles.errorClose}>✖</span>
				</div>
			)}
			<div className={styles.topRow}>
				<PickTemplates
					groupName="organizations"
					selectedTemplate={selectedTemplate}
					setSelectedTemplate={setSelectedTemplate}
					placeholders={placeholders}
					setPlaceholders={setPlaceholders}
				/>
				<OrganizationManage
					onGenerate={handleGenerate}
					loading={loading}
					selectedTemplate={selectedTemplate}
				/>
			</div>

			{loading && (
				<div className={styles.spinnerOverlay}>
					<Spinner showSeconds={true} />
				</div>
			)}
		</div>
	);
}