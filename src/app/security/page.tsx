import styles from '../legal.module.css';

export default function SecurityPage() {
    return (
        <div className={styles.pageWrapper}>
            <main className={styles.main}>
                <h1 className={styles.title}>Segurança</h1>
                <span className={styles.lastUpdated}>Última atualização: 15 de Abril de 2026</span>
                
                <div className={styles.content}>
                    <p>
                        No ClickPet, a segurança dos seus dados e das transações financeiras é nossa prioridade absoluta. 
                        Utilizamos tecnologias de ponta para garantir um ambiente seguro para você e seu pet.
                    </p>

                    <h2>1. Criptografia de Dados</h2>
                    <p>
                        Toda a comunicação entre o seu navegador e nossos servidores é protegida por criptografia SSL (Secure Socket Layer), 
                        garantindo que seus dados pessoais e de pagamento não sejam interceptados.
                    </p>

                    <h2>2. Pagamentos Seguros</h2>
                    <p>
                        Não armazenamos dados sensíveis de cartões de crédito em nossa base de dados. Todas as transações são processadas por intermediadores 
                        de pagamento certificados (PCI-DSS), que seguem os mais rigorosos padrões de segurança da indústria financeira.
                    </p>

                    <h2>3. Infraestrutura</h2>
                    <p>
                        Nossa plataforma é hospedada em servidores de alta confiabilidade, com monitoramento 24/7 e sistemas de backup automáticos 
                        para prevenir perda de dados e garantir a disponibilidade do serviço.
                    </p>

                    <h2>4. Proteção de Conta</h2>
                    <p>
                        Recomendamos o uso de senhas fortes e únicas. Além disso, monitoramos logins suspeitos e atividades incomuns para 
                        proteger sua conta contra acessos não autorizados.
                    </p>

                    <h2>5. Auditoria de Parceiros</h2>
                    <p>
                        Realizamos uma análise criteriosa de todos os parceiros que ingressam no ClickPet, verificando documentações e 
                        reputação para garantir que você esteja contratando serviços legítimos e seguros.
                    </p>

                    <h2>6. Reporte de Vulnerabilidades</h2>
                    <p>
                        Se você identificar qualquer comportamento suspeito ou potencial vulnerabilidade na plataforma, por favor, 
                        contate nossa equipe de segurança imediatamente através do e-mail: seguranca@clickpet.com.br.
                    </p>
                </div>
            </main>
        </div>
    );
}
