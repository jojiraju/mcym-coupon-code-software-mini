import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiDownload, FiPrinter, FiLink, FiEdit2, FiShare2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import CardPreview from './CardPreview';
import { formatDate, formatPhone, validTill, canShareFiles, runCardAction } from '../utils/memberCard';

// Read-only view of an issued card with its details and sharing actions
function MemberViewModal({ member, toast, onClose, onEdit }) {
  const [side, setSide] = useState('front');
  const [busy, setBusy] = useState('');
  const canShare = useMemo(() => canShareFiles(), []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const run = async (action) => {
    setBusy(action);
    await runCardAction(action, member, toast);
    setBusy('');
  };

  const details = [
    ['Phone', formatPhone(member.phone)],
    ['Date of birth', member.dob ? formatDate(member.dob) : ''],
    ['Blood group', member.bloodGroup],
    ['Place', member.place],
    ['Church / parish', member.church, true],
    ['Diocese', member.diocese],
    ['Region', member.region],
    ['Issued on', formatDate(member.issuedAt)],
    ['Valid till', validTill(member.issuedAt)]
  ];

  return createPortal(
    <div className="ld-modal-backdrop" onClick={onClose}>
      <div className="idc-view" role="dialog" aria-modal="true" aria-labelledby="idc-view-title" onClick={(e) => e.stopPropagation()}>
        <div className="idc-view-head">
          <div>
            <h3 id="idc-view-title">{member.name}</h3>
            <p>
              <span>{member.id}</span>
              <span className={`idc-role ${member.position && member.position !== 'Member' ? 'is-office' : ''}`}>{member.position || 'Member'}</span>
            </p>
          </div>
          <button type="button" className="ld-modal-close" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>

        <div className="idc-view-body">
          <div className="idc-view-card">
            <div className="idc-stage">
              <CardPreview member={member} side={side} debounce={0} onFlip={() => setSide(s => (s === 'front' ? 'back' : 'front'))} />
            </div>
            <div className="idc-seg" role="group" aria-label="Card side">
              <button type="button" aria-pressed={side === 'front'} onClick={() => setSide('front')}>Front</button>
              <button type="button" aria-pressed={side === 'back'} onClick={() => setSide('back')}>Back</button>
            </div>
          </div>

          <dl className="idc-view-details">
            {details.map(([label, value, full]) => (
              <div key={label} className={full ? 'idc-full' : ''}>
                <dt>{label}</dt>
                <dd>{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="idc-actions">
          <button type="button" className="idc-wa" onClick={() => run('whatsapp')} disabled={!!busy}>
            <FaWhatsapp size={20} /> Send to member on WhatsApp
          </button>
          <div className={`idc-actions-row ${canShare ? 'has-share' : ''}`}>
            <button type="button" className="ld-ghost-btn" onClick={() => run('download')} disabled={!!busy}>
              <FiDownload /> {busy === 'download' ? 'Preparing…' : 'Download'}
            </button>
            <button type="button" className="ld-ghost-btn" onClick={() => run('print')} disabled={!!busy}>
              <FiPrinter /> Print
            </button>
            <button type="button" className="ld-ghost-btn" onClick={() => run('copy')} disabled={!!busy}>
              <FiLink /> Copy link
            </button>
            {canShare && (
              <button type="button" className="ld-ghost-btn" onClick={() => run('share')} disabled={!!busy}>
                <FiShare2 /> Share
              </button>
            )}
            <button type="button" className="ld-ghost-btn" onClick={onEdit}>
              <FiEdit2 /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default MemberViewModal;
