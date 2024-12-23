import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import '../styles/Professions.css';
import { apiBaseUrl } from '../config';

const Professions = () => {
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newProfession, setNewProfession] = useState({ title: '', description: '' });

  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiBaseUrl}/api/v1/professions/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        setProfessions(response.data);
      } catch (error) {
        console.error('Error fetching professions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessions();
  }, []);

  const handleAddProfession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${apiBaseUrl}/api/v1/professions/`, newProfession, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setProfessions([...professions, response.data]);
      setNewProfession({ title: '', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding profession:', error);
    }
  };

  const columns = [
    { name: 'ID', selector: row => row.id, sortable: true },
    { name: 'Title', selector: row => row.title, sortable: true },
    { name: 'Description', selector: row => row.description, sortable: true },
    { name: 'Instructions Count', selector: row => row.instructions.length, sortable: true },
  ];

  return (
    <div className="professions-container">
      <h2>Professions</h2>
      <button
        className="add-profession-button"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancel' : 'Add New Profession'}
      </button>

      {showForm && (
        <div className="form-container">
          <h3>New Profession</h3>
          <input
            type="text"
            placeholder="Title"
            value={newProfession.title}
            onChange={e => setNewProfession({ ...newProfession, title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={newProfession.description}
            onChange={e => setNewProfession({ ...newProfession, description: e.target.value })}
          />
          <button onClick={handleAddProfession}>Add Profession</button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={professions}
        progressPending={loading}
        pagination
      />
    </div>
  );
};

export default Professions;
