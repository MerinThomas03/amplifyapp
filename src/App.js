import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation, updateNote as updateNoteMutation } from './graphql/mutations';
import {  Storage } from 'aws-amplify';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }
  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }
  async function updateNote() {
    await API.graphql({ query: updateNoteMutation, variables: { input: {name:formData.name,description:formData.description } } });
    //if (formData.image) {
    //  const image = await Storage.put(formData.image);
     // formData.image = image;
    //}
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      <h1>My Notes App</h1>
     <div>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
      />
      </div>
      <div>
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
      />
      </div>
      <div>
       <input
        type="file"
        onChange={onChange}
      />
      </div>
      <button className="btn-btn-primary" onClick={createNote}>Create Note</button>
      <div style={{marginBottom: 30}}>
      {
  notes.map(note => (
    <div class="card">
    <div key={note.id || note.name}>
      <div class="img">
    {
        note.image && <img src={note.image} style={{width: 400}} />
      }
      </div>
      <h2>{note.name}</h2>
      <p>{note.description}</p>
      <button  onClick={() => deleteNote(note)} className="btn-btn-primary">Delete note</button>
      <button  onClick={()=>updateNote(note)} className="btn-btn-primary">Update note</button>
      
    </div>
    </div>
  ))
}
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);