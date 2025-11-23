import { useState } from 'react';
import styles from './Documents.module.css';
import {AIHelpers} from '../../../components/DocumentTabs/AIHelpers/AIHelpers';
import {Personals} from '../../../components/DocumentTabs/Personals/Personals';
import {DocumentsTab3} from '../../../components/DocumentTabs/Organizations/DocumentsTab3';
import {Templates} from '../../../components/DocumentTabs/Temlates/Templates';


export function Documents() {
	const [activeTab, setActiveTab] = useState('tab1');

	const tabs = [
		{ id: 'tab1', label: 'AI помощник', component: <AIHelpers /> },
		{ id: 'tab2', label: 'Персональные', component: <Personals /> },
		{ id: 'tab3', label: 'Для организации', component: <DocumentsTab3 /> },
		{ id: 'tab4', label: 'Шаблоны', component: <Templates /> }

	];

	const activeComponent = tabs.find(tab => tab.id === activeTab)?.component;

	return (
		<div className={styles.tabsWrapper}>
			<div className={styles.tabsHeader}>
				{tabs.map(tab => (
					<div
						key={tab.id}
						className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
						onClick={() => setActiveTab(tab.id)}
					>
						{tab.label}
					</div>
				))}
			</div>

			<div className={styles.tabContent}>{activeComponent}</div>
		</div>
	);
}
