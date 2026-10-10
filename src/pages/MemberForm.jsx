import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FiCamera, FiUser, FiPlus, FiDownload, FiPrinter, FiLink, FiShare2, FiCheckCircle, FiCreditCard, FiAlertCircle, FiCrop, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import CardPreview from '../components/CardPreview';
import PhotoCropper from '../components/PhotoCropper';
import DobPicker from '../components/DobPicker';
import {
  POSITIONS, BLOOD_GROUPS, generateMemberId, memberUrl, isLocalLink, canShareFiles, runCardAction, normalizePhone
} from '../utils/memberCard';

const FIELDS = ['name', 'phone', 'dob', 'bloodGroup', 'diocese', 'region', 'church', 'place', 'position', 'photo'];
const EMPTY = { name: '', phone: '', dob: '', bloodGroup: '', diocese: 'Bathery', region: 'Edakkara', church: '', place: '', position: 'Member', photo: '' };

const today = () => new Date().toISOString().slice(0, 10);

const validate = (f) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter the member’s full name';
  if (!/^[6-9]\d{9}$/.test(normalizePhone(f.phone))) e.phone = 'Enter a valid 10-digit mobile number';
  if (f.dob && f.dob > today()) e.dob = 'Date of birth can’t be in the future';
  if (!f.church.trim()) e.church = 'Church / parish is required';
  if (!f.place.trim()) e.place = 'Place is required';
  if (!f.diocese.trim()) e.diocese = 'Diocese is required';
  return e;
};

const pickFields = (obj) => Object.fromEntries(FIELDS.map(k => [k, obj[k] ?? '']));
const sameFields = (a, b) => FIELDS.every(k => (a[k] ?? '') === (b[k] ?? ''));

function Field({ id, label, required, error, full, children }) {
  return (
    <div className={`field ${full ? 'idc-full' : ''}`}>
      <label htmlFor={`idc-${id}`}>{label}{required && <span className="idc-req" aria-hidden="true">*</span>}</label>
      {children}
      {error && <span className="idc-error" id={`idc-${id}-error`}><FiAlertCircle /> {error}</span>}
    </div>
  );
}

// Create / edit screen: form on the left, live card preview and sharing on the right
function MemberForm({ initial, toast, onSave, onBack }) {
  const [form, setForm] = useState(() => (initial ? pickFields(initial) : EMPTY));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(initial || null);
  const [saving, setSaving] = useState(false);
  const [side, setSide] = useState('front');
  const [busy, setBusy] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [original, setOriginal] = useState(null);

  const formRef = useRef(null);
  const previewRef = useRef(null);
  const fileRef = useRef(null);
  const canShare = useMemo(() => canShareFiles(), []);

  const dirty = saved ? !sameFields({ ...form, phone: normalizePhone(form.phone) }, saved) : false;
  const ready = saved && !dirty;
  const status = !saved ? 'draft' : dirty ? 'dirty' : 'issued';

  const previewMember = useMemo(
    () => ({ ...form, phone: normalizePhone(form.phone), id: saved?.id, issuedAt: saved?.issuedAt }),
    [form, saved]
  );

  const inputProps = (k) => ({
    id: `idc-${k}`,
    value: form[k],
    onChange: (e) => {
      const v = e.target.value;
      setForm(f => ({ ...f, [k]: v }));
      if (errors[k]) setErrors(er => ({ ...er, [k]: undefined }));
    },
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `idc-${k}-error` : undefined
  });

  // The uncropped source of the current photo, kept in memory so the crop can be re-adjusted
  const originalRef = useRef(null);
  useEffect(() => { originalRef.current = original; }, [original]);
  useEffect(() => () => {
    const url = originalRef.current?.url;
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }, []);

  const isFreshBlob = (url) => url?.startsWith('blob:') && url !== original?.url;

  const handlePhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file.');
    if (file.size > 25 * 1024 * 1024) return toast.error('That image is too large (max 25 MB).');
    setCropSrc(URL.createObjectURL(file));
  };

  const adjustPhoto = () => setCropSrc(original?.photo === form.photo ? original.url : form.photo);

  const cancelCrop = () => {
    if (isFreshBlob(cropSrc)) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const applyCrop = (photo, sourceUrl) => {
    if (isFreshBlob(cropSrc) && cropSrc !== sourceUrl) URL.revokeObjectURL(cropSrc);
    if (original?.url?.startsWith('blob:') && original.url !== sourceUrl) URL.revokeObjectURL(original.url);
    setOriginal({ url: sourceUrl, photo });
    setForm(f => ({ ...f, photo }));
    setCropSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    const first = FIELDS.find(k => errs[k]);
    if (first) {
      setErrors(errs);
      document.getElementById(`idc-${first}`)?.focus();
      return;
    }

    setSaving(true);
    const now = Date.now();
    const clean = Object.fromEntries(FIELDS.map(k => [k, k === 'photo' ? form.photo : String(form[k]).trim()]));
    const record = {
      ...clean,
      phone: normalizePhone(form.phone),
      id: saved?.id || generateMemberId(),
      issuedAt: saved?.issuedAt || now,
      updatedAt: now
    };

    try {
      await onSave(record);
      toast.success(saved ? 'Card updated.' : `Card issued for ${record.name}.`);
      setSaved(record);
      setForm(pickFields(record));
      if (window.matchMedia('(max-width: 1100px)').matches) {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error('Error saving member:', err);
      toast.error('Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Keeps the parish details so the president can issue cards for a whole unit quickly
  const startNew = (keepParish) => {
    setSaved(null);
    setForm(f => keepParish ? { ...EMPTY, diocese: f.diocese, region: f.region, church: f.church, place: f.place } : EMPTY);
    setErrors({});
    setSide('front');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('idc-name')?.focus({ preventScroll: true }), 300);
  };

  const run = async (action) => {
    setBusy(action);
    await runCardAction(action, saved, toast);
    setBusy('');
  };

  return (
    <section className="idc-page">
      <button type="button" className="idc-back" onClick={onBack}>
        <FiArrowLeft /> All members
      </button>
      <div className="idc-layout">
        {/* ── Form ─────────────────────────────── */}
        <form className="card idc-form" onSubmit={handleSubmit} noValidate ref={formRef}>
          <div className="idc-head">
            <div>
              <h2>{saved ? 'Edit member' : 'New member card'}</h2>
              <p>{saved ? <>Editing <b>{saved.id}</b></> : 'Fields marked * are required. The card updates as you type.'}</p>
            </div>
            {saved && (
              <button type="button" className="ld-ghost-btn" onClick={() => startNew(false)}>
                <FiPlus /> New card
              </button>
            )}
          </div>

          <div
            className={`idc-photo ${dragOver ? 'is-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handlePhoto(e.dataTransfer.files[0]); }}
          >
            <button type="button" className="idc-photo-thumb" onClick={() => (form.photo ? adjustPhoto() : fileRef.current?.click())} aria-label={form.photo ? 'Adjust photo crop' : 'Upload photo'}>
              {form.photo ? <img src={form.photo} alt="" /> : <FiUser />}
            </button>
            <div className="idc-photo-body">
              <b>Member photo</b>
              <span>Any photo works — you can crop to the face after choosing it. Drop an image here or upload one.</span>
              <div className="idc-photo-actions">
                <button type="button" className="ld-ghost-btn" onClick={() => fileRef.current?.click()}>
                  <FiCamera /> {form.photo ? 'Change' : 'Upload photo'}
                </button>
                {form.photo && (
                  <>
                    <button type="button" className="ld-ghost-btn" onClick={adjustPhoto}>
                      <FiCrop /> Adjust
                    </button>
                    <button type="button" className="ld-ghost-btn" onClick={() => setForm(f => ({ ...f, photo: '' }))}>Remove</button>
                  </>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { handlePhoto(e.target.files[0]); e.target.value = ''; }} />
          </div>

          <fieldset className="idc-section">
            <legend>Personal</legend>
            <div className="idc-grid">
              <Field id="name" label="Full name" required error={errors.name} full>
                <input {...inputProps('name')} placeholder="e.g. Anu Mathew" autoComplete="off" maxLength={60} />
              </Field>
              <Field id="phone" label="Mobile number" required error={errors.phone}>
                <div className="input-wrap">
                  <span className="prefix">+91</span>
                  <input {...inputProps('phone')} type="tel" inputMode="numeric" placeholder="98765 43210" autoComplete="off" maxLength={14} style={{ paddingLeft: 54 }} />
                </div>
              </Field>
              <Field id="dob" label="Date of birth" error={errors.dob}>
                <DobPicker
                  id="idc-dob"
                  value={form.dob}
                  error={errors.dob}
                  onChange={(dob) => {
                    setForm(f => ({ ...f, dob }));
                    if (errors.dob) setErrors(er => ({ ...er, dob: undefined }));
                  }}
                />
              </Field>
              <Field id="bloodGroup" label="Blood group">
                <select {...inputProps('bloodGroup')}>
                  <option value="">Not specified</option>
                  {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field id="position" label="Position">
                <select {...inputProps('position')}>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>
          </fieldset>

          <fieldset className="idc-section">
            <legend>Parish</legend>
            <div className="idc-grid">
              <Field id="church" label="Church / parish" required error={errors.church} full>
                <input {...inputProps('church')} placeholder="e.g. St. Mary’s Malankara Catholic Church" maxLength={70} />
              </Field>
              <Field id="place" label="Place" required error={errors.place}>
                <input {...inputProps('place')} placeholder="e.g. Edakkara" maxLength={40} />
              </Field>
              <Field id="diocese" label="Diocese" required error={errors.diocese}>
                <input {...inputProps('diocese')} placeholder="e.g. Bathery" maxLength={40} />
              </Field>
              <Field id="region" label="Region" full>
                <input {...inputProps('region')} placeholder="e.g. Edakkara" maxLength={40} />
              </Field>
            </div>
          </fieldset>

          <div className="idc-form-actions">
            <button type="submit" className={`btn primary ${ready ? 'is-done' : ''}`} disabled={saving || ready}>
              {saving ? 'Saving…'
                : ready ? <><FiCheckCircle /> Card is up to date</>
                  : saved ? 'Save changes'
                    : <><FiCreditCard /> Generate card</>}
            </button>
            {ready && (
              <button type="button" className="btn secondary" onClick={() => startNew(true)}>
                <FiPlus /> Next member, same parish
              </button>
            )}
          </div>
        </form>

        {/* ── Preview ──────────────────────────── */}
        <aside className="card idc-preview" ref={previewRef} aria-label="Card preview">
          <div className="idc-head">
            <div>
              <h2>Card preview</h2>
              <p>Click the card to flip it.</p>
            </div>
            <span className={`idc-status is-${status}`}>
              <i aria-hidden="true" />
              {status === 'draft' ? 'Draft' : status === 'dirty' ? 'Unsaved changes' : 'Issued'}
            </span>
          </div>

          <div className="idc-stage">
            <CardPreview member={previewMember} side={side} onFlip={() => setSide(s => (s === 'front' ? 'back' : 'front'))} />
          </div>

          <div className="idc-seg" role="group" aria-label="Card side">
            <button type="button" aria-pressed={side === 'front'} onClick={() => setSide('front')}>Front</button>
            <button type="button" aria-pressed={side === 'back'} onClick={() => setSide('back')}>Back</button>
          </div>

          <div className="idc-actions">
            {isLocalLink && (
              <div className="idc-warn" role="note">
                <FiAlertTriangle />
                <span>
                  Card links and QR codes currently point to <b>{new URL(memberUrl('x')).host}</b>, which won’t open on members’ phones.
                  Issue cards from the live website, or set <code>VITE_PUBLIC_URL</code> to its address.
                </span>
              </div>
            )}
            <button type="button" className="idc-wa" disabled={!ready || !!busy} onClick={() => run('whatsapp')}>
              <FaWhatsapp size={20} /> Send to member on WhatsApp
            </button>
            <div className={`idc-actions-row ${canShare ? 'has-share' : ''}`}>
              <button type="button" className="ld-ghost-btn" disabled={!ready || !!busy} onClick={() => run('download')}>
                <FiDownload /> {busy === 'download' ? 'Preparing…' : 'Download'}
              </button>
              <button type="button" className="ld-ghost-btn" disabled={!ready || !!busy} onClick={() => run('print')}>
                <FiPrinter /> Print
              </button>
              <button type="button" className="ld-ghost-btn" disabled={!ready || !!busy} onClick={() => run('copy')}>
                <FiLink /> Copy link
              </button>
              {canShare && (
                <button type="button" className="ld-ghost-btn" disabled={!ready || !!busy} onClick={() => run('share')}>
                  <FiShare2 /> Share
                </button>
              )}
            </div>
            <p className="idc-hint">
              {!saved ? 'Generate the card to unlock WhatsApp, download, print and link sharing.'
                : dirty ? 'Save your changes to share the updated card.'
                  : <>The member can open their digital card any time from <a href={memberUrl(saved.id)} target="_blank" rel="noreferrer">this link</a> and save it to their phone.</>}
            </p>
          </div>
        </aside>
      </div>

      {cropSrc && <PhotoCropper src={cropSrc} onCancel={cancelCrop} onApply={applyCrop} />}

    </section>
  );
}

export default MemberForm;
