import { useState } from 'react';
import styles from './Documents.module.css';
import {AIHelper} from '../../../components/DocumentTabs/DocumentTab1/AIHelper';
import {DocumentsTab2} from '../../../components/DocumentTabs/DocumentsTab2';
import {DocumentsTab3} from '../../../components/DocumentTabs/DocumentsTab3';


export function Documents() {
	const [activeTab, setActiveTab] = useState('tab1');

	const tabs = [
		{ id: 'tab1', label: 'AI помощник', component: <AIHelper /> },
		{ id: 'tab2', label: 'Персональные', component: <DocumentsTab2 /> },
		{ id: 'tab3', label: 'Для организации', component: <DocumentsTab3 /> }
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
