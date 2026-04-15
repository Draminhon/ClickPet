import styles from '../legal.module.css';

export default function ConductPage() {
    return (
        <div className={styles.pageWrapper}>
            <main className={styles.main}>
                <h1 className={styles.title}>Código de Conduta</h1>
                <span className={styles.lastUpdated}>Última atualização: 15 de Abril de 2026</span>
                
                <div className={styles.content}>
                    <p>
                        O ClickPet é uma comunidade dedicada ao bem-estar animal e ao respeito mútuo. Nosso Código de Conduta define 
                        as expectativas para todos os usuários, parceiros e colaboradores da plataforma.
                    </p>

                    <h2>1. Respeito e Cortesia</h2>
                    <p>
                        Trate todos os membros da comunidade (tutores e profissionais) com dignidade e respeito. Não toleramos discurso de ódio, 
                        assédio, discriminação ou linguagem ofensiva em nossas interações, avaliações ou chat.
                    </p>

                    <h2>2. Bem-estar Animal</h2>
                    <p>
                        A integridade e o cuidado com os pets são nossa prioridade. Qualquer conduta que sugira maus-tratos, negligência ou 
                        crueldade animal por parte de tutores ou parceiros resultará no banimento imediato e denúncia às autoridades competentes.
                    </p>

                    <h2>3. Transparência e Honestidade</h2>
                    <p>
                        As avaliações de serviços devem ser honestas e baseadas em experiências reais. Parceiros devem descrever seus serviços 
                        e preços de forma clara, sem informações enganosas.
                    </p>

                    <h2>4. Uso Responsável da Plataforma</h2>
                    <p>
                        Não utilize a plataforma para fins fraudulentos, spam, ou para divulgar conteúdo que viole leis locais. 
                        A privacidade dos outros usuários deve ser respeitada em todos os momentos.
                    </p>

                    <h2>5. Resolução de Conflitos</h2>
                    <p>
                        Encorajamos a resolução amigável de divergências. Caso não seja possível, utilize nossos canais oficiais de suporte 
                        para mediação. A agressividade física ou verbal nunca é uma opção.
                    </p>

                    <h2>6. Violações</h2>
                    <p>
                        O não cumprimento deste código pode levar a advertências, suspensão temporária ou exclusão definitiva da conta. 
                        A ClickPet reserva-se o direito de remover qualquer conteúdo ou usuário que viole estes princípios.
                    </p>
                </div>
            </main>
        </div>
    );
}
