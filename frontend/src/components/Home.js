import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/HomePage.css';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || `http://0.0.0.0:8700`;

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
              <p><strong>Number:</strong> {instruction.number}</p>
              <p><strong>Period:</strong> {instruction.period} days</p>
              <p><strong>Iteration:</strong> {instruction.iteration ? 'Yes' : 'No'}</p>
              <p><strong>Instruction Link:</strong> <a href={instruction.link} target="_blank" rel="noopener noreferrer">View File</a></p>

              {/* Journal Details */}
              <div className="journal-details">
                {instruction.journal.valid ? (
                  <>
                    <p><strong>Journal Link:</strong> <a href={instruction.journal.link} target="_blank" rel="noopener noreferrer">View Signature</a></p>
                    <p><strong>Last Date Read:</strong> {instruction.journal.last_date_read ? new Date(instruction.journal.last_date_read).toLocaleString() : 'Not read yet'}</p>
                    <p><strong>Remaining Days:</strong> {instruction.journal.remain_days} days</p>
                  </>
                ) : (
                  <p>Journal not valid or not yet completed</p>
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
