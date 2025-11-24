import React, { useState } from 'react';
import styles from './Personals.module.css';
import Button from '../../../components/Button/Button';
import PersonalTemplates from './PersonalTemplates/PersonalTemplates';
import PersonalUsers from './PersonalUsers/PersonalUsers';

export function Personals() {
	const [selectedTemplate, setSelectedTemplate] = useState('');
	const [placeholders, setPlaceholders] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);

	const handleGenerate = async () => {
		if (!selectedTemplate || selectedUsers.length === 0) return;

		const payload = {
			template: selectedTemplate,
			users_uuid_list: selectedUsers,
			placeholders: placeholders.map((p) => ({ key: p.key, value: p.value }))
		};

		await fetch('/api/v1/documents/personal_generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage.getItem('jwt')}`
			},
			body: JSON.stringify(payload)
		});
	};

	return (
		<div className={styles.container}>
			<div className={styles.topRow}>
				<PersonalTemplates
					selectedTemplate={selectedTemplate}
					setSelectedTemplate={setSelectedTemplate}
					placeholders={placeholders}
					setPlaceholders={setPlaceholders}
				/>
				<PersonalUsers
					selectedUsers={selectedUsers}
					setSelectedUsers={setSelectedUsers}
				/>
			</div>
			<div className={styles.bottomRow}>
				<Button onClick={handleGenerate}>Сформировать</Button>
			</div>
		</div>
	);
}