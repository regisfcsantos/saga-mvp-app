// client/src/pages/CreditsPage.js
import React from 'react';
import { Link } from 'react-router-dom';

const CreditsPage = () => {
    // Estilos para manter a página organizada
    const pageStyle = {
        padding: '40px 20px',
        maxWidth: '800px',
        margin: '30px auto',
        backgroundColor: '#fff',
        borderRadius: '8px',
        lineHeight: '1.7'
    };

    const attributionStyle = {
        marginBottom: '16px',
        fontSize: '16px',
        color: '#333'
    };

    // Estilos para os links para torná-los mais visíveis
    const linkStyle = {
        color: '#007bff',
        fontWeight: '500',
        textDecoration: 'none'
    };

    return (
        <div style={pageStyle}>
            <h1>Créditos e Atribuições</h1>
            <p style={{margin: '20px 0', fontSize: '1.1em', color: '#555'}}>
                O SAGA MVP é construído com o apoio de ferramentas e recursos criados por designers e desenvolvedores talentosos. Somos imensamente gratos por suas contribuições para a comunidade.
            </p>

            <h2 style={{marginTop: '40px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px'}}>Ícones</h2>

            {/* Lista de atribuições formatada a partir dos links que você forneceu */}

            <p style={attributionStyle}>
                Ícone "bumper plates" por Eucalyp, do <a href="https://thenounproject.com/browse/icons/term/bumper-plates/" target="_blank" rel="noopener noreferrer" title="bumper plates Icons" style={linkStyle}>Noun Project</a> (CC BY 3.0)
            </p>

            <p style={attributionStyle}>
                Ícone "weightlifter" por Vectors Point, do <a href="https://thenounproject.com/browse/icons/term/weightlifter/" target="_blank" rel="noopener noreferrer" title="weightlifter Icons" style={linkStyle}>Noun Project</a> (CC BY 3.0)
            </p>

            <p style={attributionStyle}>
                Ícone "swing rings" por Azam Ishaq, do <a href="https://thenounproject.com/browse/icons/term/swing-rings/" target="_blank" rel="noopener noreferrer" title="swing rings Icons" style={linkStyle}>Noun Project</a> (CC BY 3.0)
            </p>

            <p style={attributionStyle}>
                Ícone "outdoor workout" por rendicon, do <a href="https://thenounproject.com/browse/icons/term/outdoor-workout/" target="_blank" rel="noopener noreferrer" title="outdoor workout Icons" style={linkStyle}>Noun Project</a> (CC BY 3.0)
            </p>

            <p style={attributionStyle}>
                Ícone "weightlifting" por Izwar Muis, do <a href="https://thenounproject.com/browse/icons/term/weightlifting/" target="_blank" rel="noopener noreferrer" title="weightlifting Icons" style={linkStyle}>Noun Project</a> (CC BY 3.0)
            </p>

            <p style={attributionStyle}>
                Ícone "gymnastic rings" por Design Circle, do <a href="https://thenounproject.com/browse/icons/term/gymnastic-rings/" target="_blank" rel="noopener noreferrer" title="gymnastic rings Icons" style={linkStyle}>Noun Project</a> (CC BY 3.0)
            </p>

            <p style={attributionStyle}>
                Ícone "Running" por Salman Azzumardi, do <a href="https://thenounproject.com/browse/icons/term/running/" target="_blank" rel="noopener noreferrer" title="Running Icons" style={linkStyle}>Noun Project</a> (CC BY 3.0)
            </p>
            
            {/* Adicione mais atribuições aqui conforme usar mais ícones */}

            <div style={{marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px'}}>
                <Link to="/" style={linkStyle}>Voltar para a Home</Link>
            </div>
        </div>
    );
};

export default CreditsPage;