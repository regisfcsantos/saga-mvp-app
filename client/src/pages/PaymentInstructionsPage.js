// client/src/pages/PaymentInstructionsPage.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentInstructionsPage = () => {
    const location = useLocation();
    // CORREÇÃO: Pega o objeto 'competition' inteiro que foi passado no state
    const competition = location.state?.competition;

    const containerStyle = { padding: '20px', maxWidth: '700px', margin: '30px auto', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center' };

    // Se, por algum motivo, o objeto competition não for passado, mostre uma mensagem de erro
    if (!competition) {
        return (
            <div style={containerStyle}>
                <h1>Erro</h1>
                <p>Não foi possível carregar os detalhes da competição. Por favor, volte e tente se inscrever novamente.</p>
                <Link to="/" style={{display: 'inline-block', marginTop: '20px'}}>Voltar para a Home</Link>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <h1>Quase lá!</h1>
            {/* Agora usa as propriedades do objeto 'competition' */}
            <p style={{fontSize: '1.2em', margin: '20px 0'}}>Sua pré-inscrição para a competição <strong>"{competition.name}"</strong> foi registrada.</p>

            <div style={{border: '1px solid #ddd', padding: '20px', borderRadius: '5px', backgroundColor: '#f9f9f9', textAlign: 'left', lineHeight: '1.6'}}>
                <h2>Instruções para Pagamento</h2>

                {competition.payment_method_name && <p><strong>Método de Pagamento:</strong> {competition.payment_method_name}</p>}

                {competition.payment_details && (
                    <p>
                        {/* Mostra um título dinâmico para os detalhes */}
                        <strong>{competition.payment_method_name?.toUpperCase() === 'PIX' ? 'Chave PIX' : 'Dados da Conta/Detalhes'}:</strong>
                        <br/>
                        {/* A tag <pre> ajuda a manter a formatação do texto (quebras de linha, etc.) */}
                        <pre style={{fontFamily: 'inherit', margin: '5px 0', whiteSpace: 'pre-wrap', background: '#e9ecef', padding: '10px', borderRadius: '4px'}}>{competition.payment_details}</pre>
                    </p>
                )}

                {competition.proof_of_payment_contact && (
                    <p>
                        <strong>Enviar Comprovante via {competition.proof_of_payment_recipient || 'o método indicado'}:</strong>
                        <br/>
                        {competition.proof_of_payment_contact}
                    </p>
                )}

                {competition.payment_instructions_detailed && (
                    <>
                        <h3 style={{marginTop: '20px'}}>Instruções Adicionais:</h3>
                        <p style={{whiteSpace: 'pre-wrap'}}>{competition.payment_instructions_detailed}</p>
                    </>
                )}

                <br/>
                <p>Sua inscrição será confirmada pelo organizador após a validação do pagamento.</p>
            </div>
            <Link to="/" style={{display: 'inline-block', marginTop: '30px', textDecoration: 'none', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', borderRadius: '5px'}}>Voltar para a Home</Link>
        </div>
    );
};

export default PaymentInstructionsPage;