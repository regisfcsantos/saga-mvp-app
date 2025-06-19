// client/src/components/VideoSubmissionForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VideoSubmissionForm = ({ userInscription }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [athleteComments, setAthleteComments] = useState('');
    const [submissionError, setSubmissionError] = useState('');

    useEffect(() => {
        if (userInscription && userInscription.submission_id) {
            setVideoUrl(userInscription.video_url || '');
            setAthleteComments(userInscription.athlete_comments || '');
        }
    }, [userInscription]);

    const handleSubmitOrUpdate = async (e) => {
        e.preventDefault();
        setSubmissionError('');
        if (!videoUrl) {
            setSubmissionError('O link do vídeo é obrigatório.');
            return;
        }

        const submissionData = { video_url: videoUrl, athlete_comments: athleteComments };
        
        try {
            if (userInscription.submission_id) {
                await axios.put(`/api/submissions/${userInscription.submission_id}`, submissionData);
                alert("Prova atualizada com sucesso!");
            } else {
                submissionData.inscription_id = userInscription.id;
                await axios.post('/api/submissions/', submissionData);
                alert("Prova enviada com sucesso!");
            }
            window.location.reload(); // Recarrega para refletir as mudanças
        } catch (err) {
            setSubmissionError(err.response?.data?.message || 'Falha ao processar sua prova.');
        }
    };

    return (
        <form onSubmit={handleSubmitOrUpdate} className="submission-form">
            <p>{userInscription.submission_id ? 'Edite sua prova abaixo:' : 'Envie o link do seu vídeo. Boa sorte!'}</p>
            <div className="form-group-comp">
                <label htmlFor="videoUrl">Link do Vídeo (YouTube):</label>
                <input
                    type="url" id="videoUrl" className="form-input-comp"
                    value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/seu-video" required
                />
            </div>
            <div className="form-group-comp">
                <label htmlFor="athleteComments">Comentários (Opcional):</label>
                <textarea
                    id="athleteComments" className="form-textarea-comp" rows="3"
                    value={athleteComments} onChange={(e) => setAthleteComments(e.target.value)}
                ></textarea>
            </div>
            <button type="submit" className="inscription-button">
                {userInscription.submission_id ? 'Atualizar Envio' : 'Enviar Prova'}
            </button>
            {submissionError && <p className="form-error-message">{submissionError}</p>}
        </form>
    );
};

export default VideoSubmissionForm;