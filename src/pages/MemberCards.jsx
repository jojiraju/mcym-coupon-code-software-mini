import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { FiTrash2, FiX } from 'react-icons/fi';
import { db } from '../firebase';
import MemberList from './MemberList';
import MemberForm from './MemberForm';

const MEMBERS = 'members';

// Member Cards section: the register (list) and the create / edit screen
function MemberCards({ toast }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState({ name: 'list' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getDocs(collection(db, MEMBERS))
      .then(snap => setMembers(snap.docs.map(d => d.data()).sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0))))
      .catch(err => {
        console.error('Error loading members:', err);
        toast.error('Could not load members from Firebase');
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    document.querySelector('.main-content')?.scrollTo({ top: 0 });
  }, [screen]);

  const saveMember = async (record) => {
    await setDoc(doc(db, MEMBERS, record.id), record);
    setMembers(list => [record, ...list.filter(m => m.id !== record.id)]);
  };

  const confirmDelete = async () => {
    const m = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteDoc(doc(db, MEMBERS, m.id));
      setMembers(list => list.filter(x => x.id !== m.id));
      toast.success('Member card deleted.');
    } catch (err) {
      console.error('Error deleting member:', err);
      toast.error('Could not delete. Please try again.');
    }
  };

  return (
    <>
      {screen.name === 'list' ? (
        <MemberList
          members={members}
          loading={loading}
          toast={toast}
          onAdd={() => setScreen({ name: 'form' })}
          onOpen={(member) => setScreen({ name: 'form', member })}
          onDelete={setDeleteTarget}
        />
      ) : (
        <MemberForm
          key={screen.member?.id || 'new'}
          initial={screen.member}
          toast={toast}
          onSave={saveMember}
          onBack={() => setScreen({ name: 'list' })}
        />
      )}

      {deleteTarget && createPortal(
        <div className="ld-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="ld-modal" role="alertdialog" aria-modal="true" aria-labelledby="idc-del-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ld-modal-close" onClick={() => setDeleteTarget(null)} aria-label="Close"><FiX /></button>
            <div className="ld-modal-icon"><FiTrash2 /></div>
            <h3 id="idc-del-title">Delete member card?</h3>
            <p><b>{deleteTarget.name}</b>’s card ({deleteTarget.id}) will be removed, and its link and QR code will stop working.</p>
            <div className="ld-modal-actions">
              <button type="button" className="ld-modal-btn" onClick={() => setDeleteTarget(null)} autoFocus>Cancel</button>
              <button type="button" className="ld-modal-btn danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default MemberCards;
