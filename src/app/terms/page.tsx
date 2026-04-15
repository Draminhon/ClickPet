import styles from '../legal.module.css';

export default function TermsPage() {
    return (
        <div className={styles.pageWrapper}>
            <main className={styles.main}>
                <h1 className={styles.title}>Termos de Uso</h1>
                <span className={styles.lastUpdated}>Última atualização: 15 de Abril de 2026</span>
                
                <div className={styles.content}>
                    <p>
                        Bem-vindo ao ClickPet. Ao acessar ou usar nossa plataforma, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                        Por favor, leia-os com atenção antes de utilizar nossos serviços.
                    </p>

                    <h2>1. Aceitação dos Termos</h2>
                    <p>
                        Ao utilizar o ClickPet, você declara ser maior de idade e ter capacidade legal para contratar. 
                        O uso continuado da plataforma após qualquer alteração nestes termos constitui sua aceitação das mudanças.
                    </p>

                    <h2>2. Cadastro e Conta</h2>
                    <p>
                        Para utilizar certos recursos, você deve criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais 
                        e por todas as atividades que ocorrem em sua conta. Informações falsas ou incompletas podem resultar na suspensão do acesso.
                    </p>

                    <h2>3. Serviços e Parcerias</h2>
                    <p>
                        O ClickPet atua como um marketplace que conecta tutores de pets a estabelecimentos parceiros (petshops, clínicas, etc.). 
                        Embora façamos a curadoria de nossos parceiros, a execução final do serviço ou a qualidade do produto é de responsabilidade do estabelecimento contratado.
                    </p>

                    <h2>4. Propriedade Intelectual</h2>
                    <p>
                        Todo o conteúdo presente no ClickPet, incluindo logos, textos, gráficos e software, é de propriedade exclusiva da ClickPet ou de seus licenciadores, 
                        sendo protegido pelas leis de propriedade intelectual.
                    </p>

                    <h2>5. Limitação de Responsabilidade</h2>
                    <p>
                        O ClickPet não se responsabiliza por danos indiretos, incidentais ou punitivos decorrentes do uso da plataforma ou de serviços prestados por terceiros. 
                        Nossa responsabilidade total é limitada ao valor pago pelo serviço em questão através da plataforma.
                    </p>

                    <h2>6. Lei Aplicável</h2>
                    <p>
                        Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede da empresa para dirimir quaisquer controvérsias.
                    </p>
                </div>
            </main>
        </div>
    );
}
