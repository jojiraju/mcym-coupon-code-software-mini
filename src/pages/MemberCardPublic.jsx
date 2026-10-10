import React, { useEffect, useState, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { FiDownload, FiShare2, FiCheckCircle, FiAlertTriangle, FiRotateCw } from 'react-icons/fi';
import { db } from '../firebase';
import CardPreview from '../components/CardPreview';
import { downloadCard, shareCard, canShareFiles, validTill } from '../utils/memberCard';

// Public, login-free view opened from the shared link or by scanning the card's QR code
function MemberCardPublic({ id }) {
  const [member, setMember] = useState(null);
  const [state, setState] = useState('loading');
  const [side, setSide] = useState('front');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const canShare = useMemo(() => canShareFiles(), []);

  useEffect(() => {
    getDoc(doc(db, 'members', id))
      .then(snap => {
        if (!snap.exists()) return setState('missing');
        const data = snap.data();
        setMember(data);
        setState('ready');
        document.title = `${data.name} · MCYM Member Card`;
      })
      .catch(err => {
        console.error('Error loading card:', err);
        setState('error');
      });
  }, [id]);

  const run = async (action) => {
    setBusy(action);
    setMessage('');
    try {
      if (action === 'download') {
        await downloadCard(member);
        setMessage('Saved to your downloads.');
      } else {
        await shareCard(member);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') setMessage('Something went wrong. Please try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="idc-public">
      <header className="idc-public-head">
        <span className="idc-public-logo"><img src="/mcym-logo.png" alt="" /></span>
        <div>
          <strong>MCYM</strong>
          <span>Digital member card</span>
        </div>
      </header>

      <main className="idc-public-main">
        {state === 'loading' && (
          <div className="idc-public-state" role="status">
            <div className="idc-public-skeleton" />
            <p>Loading card…</p>
          </div>
        )}

        {(state === 'missing' || state === 'error') && (
          <div className="idc-public-state">
            <div className="idc-public-icon"><FiAlertTriangle /></div>
            <h1>{state === 'missing' ? 'Card not found' : 'Couldn’t load this card'}</h1>
            <p>{state === 'missing'
              ? 'This card link is invalid or the card has been withdrawn. Please contact your MCYM unit president.'
              : 'Check your internet connection and try again.'}</p>
            {state === 'error' && (
              <button type="button" className="idc-public-btn is-ghost" onClick={() => window.location.reload()}>
                <FiRotateCw /> Try again
              </button>
            )}
          </div>
        )}

        {state === 'ready' && (
          <>
            <div className="idc-verified">
              <FiCheckCircle />
              <span>Verified member · valid till {validTill(member.issuedAt)}</span>
            </div>

            <CardPreview member={member} side={side} debounce={0} onFlip={() => setSide(s => (s === 'front' ? 'back' : 'front'))} />

            <p className="idc-public-tip">Tap the card to see the {side === 'front' ? 'back' : 'front'}</p>

            <div className={`idc-public-actions ${canShare ? '' : 'is-single'}`}>
              <button type="button" className="idc-public-btn" onClick={() => run('download')} disabled={!!busy}>
                <FiDownload /> {busy === 'download' ? 'Preparing…' : 'Save to phone'}
              </button>
              {canShare && (
                <button type="button" className="idc-public-btn is-ghost" onClick={() => run('share')} disabled={!!busy}>
                  <FiShare2 /> Share
                </button>
              )}
            </div>
            <p className="idc-public-msg" role="status">{message}</p>

            <p className="idc-public-note">
              Keep this card handy: save the image to your gallery, or bookmark this page / add it to your home screen.
            </p>
          </>
        )}
      </main>

      <footer className="idc-public-foot">
        {member ? `Issued by MCYM ${member.region} Region · ${member.diocese} Diocese` : 'Malankara Catholic Youth Movement'}
      </footer>
    </div>
  );
}

export default MemberCardPublic;
