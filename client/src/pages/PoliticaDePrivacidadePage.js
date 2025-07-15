// client/src/pages/PoliticaDePrivacidadePage.js
import React from 'react';
import './StaticPage.css'; // Reutilizando nosso CSS

const PoliticaDePrivacidadePage = () => {
    // Rola a página para o topo ao carregar
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="static-page-container">
            <h1>Política de Privacidade</h1>
            <p className="last-updated">Última atualização: 15 de julho de 2025</p>

            <h3>1. Quais Dados Coletamos</h3>
            <p>Coletamos informações que você nos fornece diretamente (nome, e-mail ao se cadastrar), informações de login social (ID de usuário, e-mail, foto do perfil, conforme sua permissão), e dados de uso (competições que você participa, envios, pontuações, etc.).</p>

            <h3>2. Como Usamos Seus Dados</h3>
            <p>Utilizamos seus dados para operar e manter a plataforma, personalizar sua experiência, processar inscrições, exibir rankings públicos (que podem incluir seu nome de usuário e foto), comunicar atualizações e garantir a segurança.</p>

            <h3>3. Compartilhamento de Informações</h3>
            <p>Não vendemos ou alugamos suas informações pessoais. Podemos compartilhar dados com provedores de serviço que nos ajudam a operar (ex: processadores de pagamento), ou se exigido por lei. Seu nome de usuário, foto de perfil e resultados podem ser visíveis publicamente na plataforma.</p>

            <h3>4. Seus Direitos (LGPD)</h3>
            <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir, anonimizar ou solicitar a exclusão de seus dados pessoais. Para exercer esses direitos, entre em contato conosco através dos canais informados na nossa página de Contato.</p>

            <h3>5. Segurança dos Dados</h3>
            <p>Implementamos medidas de segurança técnica e organizacional para proteger suas informações, mas lembramos que nenhum sistema é 100% seguro.</p>

            <p><strong>Atenção:</strong> Este é um documento modelo. É crucial consultar um profissional jurídico para garantir que sua Política de Privacidade esteja completa e em conformidade com a LGPD.</p>
        </div>
    );
};

export default PoliticaDePrivacidadePage;