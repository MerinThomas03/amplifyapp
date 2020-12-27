import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation,  updateNote as updateNoteMutation  } from './graphql/mutations';
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

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }
  async function updateNote({ id }) {
    const formData = notes.filter(note => note.id !== id);
    setNotes([ ...notes, formData ]);
    await API.graphql({ query: updateNoteMutation, variables: { input: { id,name:"hello",description:"hai" } }});
    setNotes([  formData ]);
  }


  return (
    <div className="App">
      <h1>My Notes App</h1>
      <div>
      <input className="form-control"
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
      />
      </div>
      <div>
      <input className="form-control"
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
      />
       </div>
      <div>
      <input className="form-control"
        type="file"
        onChange={onChange}
      />
       </div>
      <button onClick={createNote} className="btnPrimary">Create Note</button>
      <div style={{marginBottom: 30}}>
      {
  notes.map(note => (
    <div key={note.id || note.name}>
        <div className="commentWrapper">
        <div className="commentText">
      <h2>{note.name}</h2>
      <p>{note.description}</p>
      
      {
        note.image && <img src={note.image} style={{width: 400}} />
      }
     <div className="commentBtns">
      <button onClick={() => deleteNote(note)} className="btnDanger">Delete note</button>
      <button onClick={() => updateNote(note)} className="btnSuccess">Update note</button></div>
      </div>
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