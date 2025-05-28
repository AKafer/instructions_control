import { Switch, Space } from 'antd';
import styles from './Switch.module.css';
import cn from 'classnames';


export default function ToggleSwitch({
	checked,
	onChange,
	label,
	size = 'default',
	className,
	...rest
}) {
	return (
		<Space align="center">
			<Switch
				checked={checked}
				onChange={onChange}
				size={size}
				className={cn(styles['toggle-switch'], className)}
				{...rest}
			/>
			{label && <span>{label}</span>}
		</Space>
	);
}


