import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import '../styles/Instructions.css';
import { apiBaseUrl } from './Home';



const Instructions = () => {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [newIteration, setNewIteration] = useState(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiBaseUrl}/api/v1/instructions/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        setInstructions(response.data);
      } catch (error) {
        console.error('Error fetching instructions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructions();
  }, []);

  const columns = [
    { name: 'ID', selector: row => row.id, sortable: true },
    { name: 'Title', selector: row => row.title, sortable: true },
    { name: 'Number', selector: row => row.number, sortable: true },
    { name: 'Period', selector: row => row.period, sortable: true },
    { name: 'Iteration', selector: row => row.iteration ? 'Yes' : 'No', sortable: true },
  ];

  const handleCreateInstruction = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiBaseUrl}/api/v1/instructions/`, {
        title: newTitle,
        number: newNumber,
        period: parseInt(newPeriod, 10),
        iteration: newIteration,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNewTitle('');
      setNewNumber('');
      setNewPeriod('');
      setNewIteration(false);
      setShowForm(false);
      // Refresh the instructions list
      const response = await axios.get(`${apiBaseUrl}/api/v1/instructions/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      setInstructions(response.data);
    } catch (error) {
      console.error('Error creating instruction:', error);
    }
  };

  return (
    <div className="instructions-container">
      <h2>Instructions</h2>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Create Instruction'}
      </button>
      {showForm && (
        <div className="create-form">
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Number"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
          />
          <input
            type="number"
            placeholder="Period"
            value={newPeriod}
            onChange={(e) => setNewPeriod(e.target.value)}
          />
          <label>
            Iteration:
            <input
              type="checkbox"
              checked={newIteration}
              onChange={(e) => setNewIteration(e.target.checked)}
            />
          </label>
          <button onClick={handleCreateInstruction}>Submit</button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={instructions}
        progressPending={loading}
        pagination
      />
    </div>
  );
};

export default Instructions;
