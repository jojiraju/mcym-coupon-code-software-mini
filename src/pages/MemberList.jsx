import React, { useState, useMemo } from 'react';
import { BiSearch } from 'react-icons/bi';
import { FiDownload, FiTrash2, FiPlus, FiFileText, FiDownloadCloud, FiEdit2, FiEye } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import MemberViewModal from '../components/MemberViewModal';
import { initials, formatPhone, formatDate, cardImageFile, runCardAction } from '../utils/memberCard';

const PER_PAGE = 10;

const customStyles = {
  headCells: {
    style: {
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#9ba4a0',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      padding: '16px',
      borderBottom: '1px solid #ebe5dd',
      background: 'transparent'
    }
  },
  cells: {
    style: { padding: '12px 16px', color: 'var(--text)', fontSize: '14px' }
  },
  rows: {
    style: {
      borderBottom: '1px solid #ebe5dd',
      '&:not(:last-of-type)': { borderBottomStyle: 'solid', borderBottomWidth: '1px', borderBottomColor: '#ebe5dd' },
      background: 'transparent',
      minHeight: '68px'
    },
    highlightOnHoverStyle: { backgroundColor: '#faf8f5', borderBottomColor: '#ebe5dd', outline: '1px solid #ebe5dd' }
  },
  pagination: {
    style: { borderTop: 'none', background: 'transparent', padding: '16px 0 0' }
  }
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function Avatar({ member }) {
  return <span className="idc-avatar">{member.photo ? <img src={member.photo} alt="" /> : initials(member.name)}</span>;
}

function EmptyState({ filtered }) {
  return (
    <div className="empty" style={{ margin: '30px 0' }}>
      <div className="emoji">🪪</div>
      <b>{filtered ? 'No matching members' : 'No member cards yet'}</b>
      <span>{filtered ? 'Try a different name, phone number, parish or ID.' : 'Click “Add new” to issue the first member card.'}</span>
    </div>
  );
}

function MemberList({ members, loading, toast, onAdd, onOpen, onDelete }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [zipping, setZipping] = useState(false);
  const [busy, setBusy] = useState('');
  const [viewing, setViewing] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m => [m.name, m.phone, m.church, m.place, m.id].some(v => (v || '').toLowerCase().includes(q)));
  }, [members, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const run = async (action, m) => {
    setBusy(`${action}:${m.id}`);
    await runCardAction(action, m, toast);
    setBusy('');
  };

  const handleExport = () => {
    if (!members.length) return toast.error('There are no members to export.');
    const header = ['Member ID', 'Name', 'Phone', 'Date of Birth', 'Blood Group', 'Position', 'Church / Parish', 'Place', 'Diocese', 'Region', 'Issued On'];
    const rows = members.map(m => [m.id, m.name, m.phone, m.dob, m.bloodGroup, m.position, m.church, m.place, m.diocese, m.region, formatDate(m.issuedAt)].map(csvCell).join(','));
    const blob = new Blob(['﻿' + [header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'MCYM_Members.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast.success('CSV file is ready.');
  };

  const handleDownloadAll = async () => {
    if (!members.length) return toast.error('There are no member cards to download.');
    setZipping(true);
    const toastId = toast.loading(`Preparing ${members.length} cards…`);
    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = (await import('file-saver')).default;
      const zip = new JSZip();
      for (const m of members) {
        const file = await cardImageFile(m);
        zip.file(`${m.id}-${file.name}`, file);
      }
      saveAs(await zip.generateAsync({ type: 'blob' }), 'MCYM_Member_Cards.zip');
      toast.success('Zip file downloaded.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Could not create the zip file.', { id: toastId });
    } finally {
      setZipping(false);
    }
  };

  const actions = (m) => (
    <div className="idc-row-actions">
      <button type="button" className="idc-icon is-view" onClick={() => setViewing(m)} aria-label={`View ${m.name}'s card`} title="View card"><FiEye /></button>
      <button type="button" className="idc-icon" onClick={() => onOpen(m)} aria-label={`Edit ${m.name}'s card`} title="Edit"><FiEdit2 /></button>
      <button type="button" className="idc-icon is-wa" onClick={() => run('whatsapp', m)} aria-label={`Send ${m.name}'s card on WhatsApp`} title="Send on WhatsApp"><FaWhatsapp /></button>
      <button type="button" className="idc-icon is-dl" onClick={() => run('download', m)} disabled={busy === `download:${m.id}`} aria-label={`Download ${m.name}'s card`} title="Download card"><FiDownload /></button>
      <button type="button" className="idc-icon is-danger" onClick={() => onDelete(m)} aria-label={`Delete ${m.name}'s card`} title="Delete"><FiTrash2 /></button>
    </div>
  );

  const columns = [
    {
      name: 'Member',
      selector: row => row.name,
      sortable: true,
      grow: 2,
      cell: row => (
        <div className="idc-cell-member">
          <Avatar member={row} />
          <div><strong>{row.name}</strong><small>{row.id}</small></div>
        </div>
      )
    },
    {
      name: 'Church / Parish',
      selector: row => row.church,
      sortable: true,
      grow: 2,
      cell: row => <div className="idc-cell-stack"><span>{row.church}</span><small>{row.place}</small></div>
    },
    {
      name: 'Phone',
      selector: row => row.phone,
      cell: row => <div className="idc-cell-muted">{formatPhone(row.phone) || '—'}</div>,
      width: '160px'
    },
    {
      name: 'Position',
      selector: row => row.position,
      sortable: true,
      cell: row => <span className={`idc-role ${row.position && row.position !== 'Member' ? 'is-office' : ''}`}>{row.position || 'Member'}</span>,
      width: '160px'
    },
    {
      name: 'Issued',
      selector: row => row.issuedAt || 0,
      sortable: true,
      cell: row => <div className="idc-cell-muted">{formatDate(row.issuedAt)}</div>,
      width: '130px'
    },
    {
      name: 'Actions',
      cell: actions,
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '232px'
    }
  ];

  return (
    <section className="layout" style={{ gridTemplateColumns: '1fr' }}>
      <div className="card">
        <div className="card-title">
          <div><h2>Member register</h2><p>Search by name, phone, parish or member ID.</p></div>
          <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn action-btn header-btn" onClick={handleExport} title="Export CSV">
              <FiFileText size={16} style={{ color: '#10b981' }} /> Export CSV
            </button>
            <button className="btn action-btn header-btn" onClick={handleDownloadAll} disabled={zipping} title="Download all cards">
              <FiDownloadCloud size={16} style={{ color: '#3b82f6' }} /> {zipping ? 'Zipping…' : 'Download Cards'}
            </button>
            <button className="btn primary header-btn" onClick={onAdd} style={{ width: 'auto' }}>
              <FiPlus size={16} /> Add new
            </button>
          </div>
        </div>

        <div className="search">
          <div className="search-box">
            <span className="search-icon" aria-hidden="true"><BiSearch size={18} /></span>
            <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search name, phone, parish or member ID…" aria-label="Search members" />
          </div>
          <button className="btn secondary" onClick={() => handleSearch('')}>Reset</button>
        </div>

        <div className="table-box">
          <DataTable
            columns={columns}
            data={filtered}
            keyField="id"
            pagination
            paginationPerPage={PER_PAGE}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            customStyles={customStyles}
            highlightOnHover
            pointerOnHover
            onRowClicked={setViewing}
            progressPending={loading}
            progressComponent={<div className="idc-skeleton" style={{ width: '100%', padding: '8px 0' }} aria-hidden="true">{[0, 1, 2, 3].map(i => <div key={i} />)}</div>}
            noDataComponent={<EmptyState filtered={!!search.trim()} />}
          />
        </div>

        <div className="mobile-cards">
          {loading && <div className="idc-skeleton" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} />)}</div>}
          {!loading && pageItems.map(m => (
            <div key={m.id} className="mobile-card">
              <button type="button" className="idc-mc-head" onClick={() => setViewing(m)}>
                <Avatar member={m} />
                <div><strong>{m.name}</strong><small>{m.id}</small></div>
                <span className={`idc-role ${m.position && m.position !== 'Member' ? 'is-office' : ''}`}>{m.position || 'Member'}</span>
              </button>
              <div className="mc-body">
                <div className="mc-info"><strong>Parish:</strong> {m.church}{m.place ? `, ${m.place}` : ''}</div>
                {m.phone && <div className="mc-info"><strong>Phone:</strong> {formatPhone(m.phone)}</div>}
              </div>
              <div className="mc-actions">{actions(m)}</div>
            </div>
          ))}
          {!loading && filtered.length === 0 && <EmptyState filtered={!!search.trim()} />}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '4px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <button className="btn secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0 14px', height: '36px', fontSize: '13px' }}>Prev</button>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Page {page} of {totalPages}</span>
              <button className="btn secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '0 14px', height: '36px', fontSize: '13px' }}>Next</button>
            </div>
          )}
        </div>
      </div>
      {viewing && (
        <MemberViewModal
          member={viewing}
          toast={toast}
          onClose={() => setViewing(null)}
          onEdit={() => { setViewing(null); onOpen(viewing); }}
        />
      )}
    </section>
  );
}

export default MemberList;
