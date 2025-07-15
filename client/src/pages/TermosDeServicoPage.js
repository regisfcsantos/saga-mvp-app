// client/src/pages/TermosDeServicoPage.js
import React from 'react';
import './StaticPage.css'; // Usaremos um CSS genérico para páginas de texto

const TermosDeServicoPage = () => {
    // Rola a página para o topo ao carregar
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="static-page-container">
            <h1>Termos de Serviço</h1>
            <p className="last-updated">Última atualização: 15 de julho de 2025</p>

            <h3>1. Aceitação dos Termos</h3>
            <p>Ao acessar ou usar a plataforma SAGA, você concorda em cumprir estes Termos de Serviço e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.</p>

            <h3>2. Descrição do Serviço</h3>
            <p>O SAGA é uma plataforma que permite aos usuários ("Organizadores") criar e gerenciar competições e desafios online, e a outros usuários ("Participantes") se inscreverem e participarem desses eventos.</p>

            <h3>3. Contas de Usuário</h3>
            <p>Para acessar certas funcionalidades, você deve se registrar. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades que ocorram em sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.</p>

            <h3>4. Conduta do Usuário e Conteúdo</h3>
            <p>Você concorda em não usar a plataforma para qualquer finalidade ilegal ou proibida. Os Organizadores são os únicos responsáveis pela legalidade, regras e lisura de suas competições. O SAGA não se responsabiliza pelo conteúdo gerado pelo usuário, mas se reserva o direito de remover qualquer conteúdo que viole nossos termos.</p>
            
            <h3>5. Limitação de Responsabilidade</h3>
            <p>A plataforma é fornecida "como está". Não nos responsabilizamos por perdas financeiras, lesões físicas ou quaisquer danos diretos ou indiretos decorrentes da participação em competições organizadas através do SAGA. A participação é por sua conta e risco.</p>

            <h3>6. Modificações nos Termos</h3>
            <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Aconselhamos que você revise esta página periodicamente. Alterações significativas serão notificadas aos usuários.</p>

            <p><strong>Atenção:</strong> Este é um documento modelo. É crucial consultar um profissional jurídico para garantir que seus Termos de Serviço estejam completos e em conformidade com a legislação local (como a LGPD).</p>
        </div>
    );
};

export default TermosDeServicoPage;