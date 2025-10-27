describe('Главная страница', () => {
	beforeEach(() => {
		cy.visit('/');
	});

	it('Проверка работы Cypress', () => {
		cy.contains('Ваш надежный партнер в управлении учетными данными');
	});

	it('Переходит на страницу логина при клике на кнопку "Начать работу"', () => {
		cy.contains('Начать работу').click();
		cy.url().should('include', '/login');
		cy.contains('Ваш email').should('exist');
		cy.contains('Ваш пароль').should('exist');
		cy.contains('Вход').should('exist');
	});

});