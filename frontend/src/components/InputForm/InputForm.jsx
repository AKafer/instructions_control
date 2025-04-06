import styles from './InputForm.module.css';
import cn from 'classnames';
import {forwardRef} from 'react';

const InputForm = forwardRef(function Input({isValid = true, className, ...props}, ref) {
	return (
		<input {...props} ref={ref} className={cn(styles['input'], className, {
			[styles['invalid']]: !isValid
		})}/>
	);
});

export default InputForm;