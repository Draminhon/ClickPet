import styles from '../legal.module.css';

export default function PrivacyPage() {
    return (
        <div className={styles.pageWrapper}>
            <main className={styles.main}>
                <h1 className={styles.title}>Política de Privacidade</h1>
                <span className={styles.lastUpdated}>Última atualização: 15 de Abril de 2026</span>
                
                <div className={styles.content}>
                    <p>
                        A privacidade dos nossos usuários é fundamental para o ClickPet. Esta Política de Privacidade explica como coletamos, 
                        usamos e protegemos suas informações pessoais.
                    </p>

                    <h2>1. Informações que Coletamos</h2>
                    <p>Coletamos informações que você nos fornece diretamente, como:</p>
                    <ul>
                        <li>Nome, e-mail e telefone;</li>
                        <li>Endereço para entrega e serviços;</li>
                        <li>Informações sobre seus pets;</li>
                        <li>Dados de pagamento (processados de forma segura por parceiros).</li>
                    </ul>

                    <h2>2. Uso das Informações</h2>
                    <p>Utilizamos seus dados para:</p>
                    <ul>
                        <li>Processar pedidos e agendamentos;</li>
                        <li>Melhorar nossa plataforma e atendimento;</li>
                        <li>Enviar comunicações sobre seu pedido ou ofertas (se autorizado);</li>
                        <li>Garantir a segurança e prevenir fraudes.</li>
                    </ul>

                    <h2>3. Compartilhamento de Dados</h2>
                    <p>
                        Seus dados são compartilhados com parceiros (petshops e clínicas) apenas na medida do necessário para a execução do serviço contratado. 
                        Não vendemos suas informações pessoais para terceiros.
                    </p>

                    <h2>4. Cookies</h2>
                    <p>
                        Utilizamos cookies para melhorar sua experiência de navegação, lembrar suas preferências e analisar o tráfego da plataforma. 
                        Você pode gerenciar as preferências de cookies nas configurações do seu navegador.
                    </p>

                    <h2>5. Seus Direitos</h2>
                    <p>
                        De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem direito a acessar, corrigir, excluir ou portar seus dados pessoais. 
                        Para exercer esses direitos, entre em contato através do nosso canal de suporte.
                    </p>

                    <h2>6. Segurança</h2>
                    <p>
                        Implementamos medidas técnicas e organizacionais para proteger seus dados, mas lembramos que nenhum método de transmissão pela internet é 100% seguro.
                    </p>
                </div>
            </main>
        </div>
    );
}
