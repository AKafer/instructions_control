import styles from './AIHelpers.module.css';
import {NoInstructionProfs} from './NoInstructionProfs/NoInstructionProfs';
import {InsGenerator} from './InsGenerator/InsGenerator';

export function AIHelpers() {


	return (
		<div className={styles.helpers_content}>
			<div className={styles.wrapper}>
				<NoInstructionProfs />
			</div>
			<div className={styles.wrapper}>
				<InsGenerator />
			</div>
		</div>
	);
}
