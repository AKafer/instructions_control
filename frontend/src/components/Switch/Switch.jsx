import { Switch, Space } from 'antd';
import styles from './Switch.module.css';


export default function ToggleSwitch({
	checked,
	onChange,
	label,
	size = 'default',
	...rest
}) {
	return (
		<Space align="center">
			<Switch
				checked={checked}
				onChange={onChange}
				size={size}
				className={styles['toggle-switch']}
				{...rest}
			/>
			{label && <span>{label}</span>}
		</Space>
	);
}


