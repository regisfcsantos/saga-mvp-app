// client/src/pages/ContactPage.js
import React from 'react';

const ContactPage = () => {
    const containerStyle = {
        padding: '40px 20px',
        maxWidth: '800px',
        margin: '30px auto',
        backgroundColor: '#fff',
        borderRadius: '8px',
        textAlign: 'center'
    };

    return (
        <div style={containerStyle}>
            <h1>Fale Conosco</h1>
            <p style={{fontSize: '1.1em', color: '#555'}}>
                Se sua solicitação para se tornar um Box foi recusada ou se você tem outras dúvidas,
                entre em contato com nossa equipe de administração.
            </p>
            <div style={{marginTop: '30px', fontSize: '1.2em'}}>
                <p><strong>Email para Contato:</strong> <a href="mailto:contato@saga.com">contato@saga.com</a></p>
                {/* Você pode adicionar outros meios de contato aqui, como um formulário ou número de WhatsApp */}
            </div>
        </div>
    );
};

export default ContactPage;