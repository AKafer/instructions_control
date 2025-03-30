import styles from './style.module.css';
import cn from 'classnames';

const ButtonBox = ({ children, className }) => {
	return <div className={cn(styles.button_box, className)}>
		{children}
	</div>;
};

export default ButtonBox;