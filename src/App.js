import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation, updateNote as updateNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [editModel, setEditModel] = useState(false);
  const [updateData, setUpdateData] = useState(0);



  useEffect(() => {
    fetchNotes();
  }, []);
  async function onUpdate (data){
    setFormData ({...formData,  name: data.name, description: data.description})
    setUpdateData (data)
    setEditModel(true)
  }
  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }
  async function updateNote() {
    const tempData = formData;
    tempData.id = updateData.id;
    await API.graphql({ query: updateNoteMutation, variables: { input: tempData  }});
    setEditModel(false)
    fetchNotes([...notes]);
    setFormData(initialFormState);
    
  }

  return (
    <div className="App">
      <h1>My Notes App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
      />
      {editModel?
      
      <>
      <button className="btnSuccess"
       onClick={updateNote}>Edit</button>
       <button className="btnDanger" onClick={()=>{
        setEditModel(false)
      }}>Cancel</button></>:
      <button className="btnPrimary"
      onClick={createNote}>Create</button>}
      
      <div style={{marginBottom: 30}}>
        
          <table>
          <thead>
       <tr>
       <th> Note Name</th>
       <th> Descripton </th>
       <th>Actions</th>
       </tr>
       </thead>
       {
          notes.map(note => (
            <tbody>
             <tr>
              <td>{note.name}</td>
              <td>{note.description}</td>
              <td><button onClick={() => deleteNote(note)} className="btnDanger">Delete note</button>
              <button  onClick={() => onUpdate (note)} className="btnSuccess">Update note</button></td>
              </tr>
              </tbody>
             ))
        }
         </table>
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);