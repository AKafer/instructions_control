import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/HomePage.css';
import { apiBaseUrl } from '../config';


const Home = () => {
  const [instructions, setInstructions] = useState([]);
  const [selectedInstructionId, setSelectedInstructionId] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiBaseUrl}/api/v1/instructions/get_my_instructions/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        setInstructions(response.data);
      } catch (error) {
        console.error('Error fetching instructions:', error);
        if (error.response && error.response.status === 401) {
          window.location.href = '/login';
        }
      }
    };

    fetchInstructions();
  }, []);

  const handleFileChange = (e) => {
    setSignatureFile(e.target.files[0]);
  };

  const handleSubmitSignature = async (instructionId) => {
    if (!signatureFile) {
      alert('Please select a file');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('file', signatureFile);

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${apiBaseUrl}/api/v1/journals/update_journal/${instructionId}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      // Clear the file and close the form
      setSignatureFile(null);
      setSelectedInstructionId(null);
      setIsSubmitting(false);

      // Refresh the instructions list
      const response = await axios.get(`${apiBaseUrl}/api/v1/instructions/get_my_instructions/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      setInstructions(response.data);

    } catch (error) {
      console.error('Error submitting signature:', error);
      alert('Failed to submit signature');
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="home-container">
      {/* Logout button */}
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
      {/* Instructions list */}
      <div className="instructions-container">
        {instructions.map(instruction => (
          <div key={instruction.id} className="instruction-item">
            <div className="instruction-details">
              <h3>{instruction.title}</h3>
              <p><strong>Номер:</strong> {instruction.number}</p>
              <p><strong>Период:</strong> {instruction.period} дней</p>
              <p><strong>Повторяемость:</strong> {instruction.iteration ? 'Да' : 'Нет'}</p>
              <p><strong>Ссылка на файл:</strong> <a href={instruction.link} target="_blank" rel="noopener noreferrer">Смотреть файл</a></p>

              {/* Journal Details */}
              <div className="journal-details">
                {instruction.journal.last_date_read ? (
                    <>
                      <p><strong>Ссылка на подпись:</strong> <a href={instruction.journal.link} target="_blank"
                                                                rel="noopener noreferrer">Смотреть подпись</a></p>
                      <p><strong>Дата
                        ознакомления:</strong> {instruction.journal.last_date_read ? new Date(instruction.journal.last_date_read).toLocaleString() : 'Новая инструкция. Нет ознакомлений.'}
                      </p>
                      <p><strong>Ознакомлен:</strong> {instruction.journal.valid ? 'Да' : 'Нужно ознакомиться'}
                      </p>
                      <p><strong>Ознакомиться повторно через:</strong> {instruction.journal.remain_days} дней</p>
                    </>
                ) : (
                    <p>Новая инструкция. Нет ознакомлений.</p>
                )}
              </div>
            </div>

            {/* "Acknowledge" button */}
            <button
              className="acknowledge-button"
              onClick={() => setSelectedInstructionId(instruction.id)}
            >
              Acknowledge
            </button>

            {/* Signature submission form */}
            {selectedInstructionId === instruction.id && (
              <div className="signature-form">
                <input type="file" onChange={handleFileChange} />
                <button
                  onClick={() => handleSubmitSignature(instruction.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Signature'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
