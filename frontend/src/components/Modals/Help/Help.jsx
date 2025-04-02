import styles from './Help.module.css';
import Button from '../../Button/Button';

export function Help() {
	const GoToTelegram = () => {
		window.open('https://t.me/avtomedikBot', '_blank');
	};

	return (
		<div className={styles['help']}>
			<div className={styles['content']}>
				<p>
				Если у Вас:
				</p>
				<ol>
					<li>Возникли вопросы по работе сервиса;</li>
					<li>Хотите оставить заявку по автоматизации</li>
				</ol>
				<p>
					Обратитесь к нам через наш тегерамм-бот. Там мы оперативно ответим на все вопросы.
				</p>
			</div>
			<div className={styles['button']}>
				<Button className={styles['telegramButton']} onClick={GoToTelegram}>
					<img className={styles['icon']} src="/icons/telegram-icon.svg" alt="Telegram" />
					<span className={styles['text']}>Перейти в Бот</span>
				</Button>
			</div>
		</div>
	);
}