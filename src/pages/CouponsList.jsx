import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BiSearch } from 'react-icons/bi';
import { FiDownload, FiTrash2, FiPlus, FiFileText, FiArchive, FiDownloadCloud, FiX, FiAlertCircle } from 'react-icons/fi';
import DataTable from 'react-data-table-component';

const generateCouponDataURL = (c) => {
  const W = 1050, H = 420;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Dark background ──────────────────────────────
  ctx.fillStyle = '#0f1923';
  ctx.fillRect(0, 0, W, H);

  // ── Left accent panel (deep red) ─────────────────
  const panelGrad = ctx.createLinearGradient(0, 0, 0, H);
  panelGrad.addColorStop(0, '#941c34');
  panelGrad.addColorStop(1, '#5a1020');
  ctx.fillStyle = panelGrad;
  ctx.fillRect(0, 0, 280, H);

  // ── Gold top accent bar ───────────────────────────
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, '#dca84a');
  topBar.addColorStop(0.5, '#f0c76b');
  topBar.addColorStop(1, '#dca84a');
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 6);

  // ── Circle cutouts for perforation ───────────────
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(280, 0, 22, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(280, H, 22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── Perforated tear line ──────────────────────────
  ctx.setLineDash([12, 10]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(220,168,74,0.5)';
  ctx.beginPath(); ctx.moveTo(280, 25); ctx.lineTo(280, H - 25); ctx.stroke();
  ctx.setLineDash([]);

  // ── Stub: Organisation text (rotated) ────────────
  ctx.save();
  ctx.translate(58, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '500 14px Inter, sans-serif';
  ctx.fillText('BATHERY DIOCESE', 0, -16);
  ctx.fillStyle = '#f0c76b';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText('MCYM EDAKKARA', 0, 12);
  ctx.restore();

  // ── Stub: Coupon number ───────────────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '600 13px Inter, sans-serif';
  ctx.fillText('COUPON NO.', 175, 195);
  ctx.fillStyle = '#f0c76b';
  ctx.font = 'bold 52px Inter, sans-serif';
  ctx.fillText(c.number, 175, 248);

  // ── Decorative circles (right side) ──────────────
  ctx.beginPath();
  ctx.arc(950, 60, 100, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(148,28,52,0.15)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(990, H - 50, 70, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220,168,74,0.07)';
  ctx.fill();

  // ── Main title ────────────────────────────────────
  ctx.textAlign = 'left';
  const X = 320;

  ctx.fillStyle = '#f0c76b';
  ctx.font = '700 13px Inter, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('✦  CHRISTMAS LUCKY DRAW  ✦', X, 65);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 58px "Playfair Display", serif';
  ctx.fillText('Lucky Draw', X, 135);

  // ── Thin divider ─────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(X, 155);
  ctx.lineTo(1000, 155);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Info: Name ────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillText('PARTICIPANT NAME', X, 195);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.fillText(c.name || '—', X, 238);

  // ── Info: Unit & Phone ────────────────────────────
  const Y2 = 310;
  // Unit pill
  ctx.fillStyle = 'rgba(148,28,52,0.5)';
  roundRect(ctx, X, Y2 - 30, 200, 44, 8);
  ctx.fill();
  ctx.fillStyle = '#f0c76b';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillText('UNIT', X + 14, Y2 - 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText(c.unit || '—', X + 14, Y2 + 8);

  // Phone pill
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  roundRect(ctx, X + 220, Y2 - 30, 240, 44, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillText('PHONE', X + 234, Y2 - 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText(c.phone || '—', X + 234, Y2 + 8);

  // Amount pill
  ctx.fillStyle = 'rgba(220,168,74,0.18)';
  roundRect(ctx, X + 480, Y2 - 30, 180, 44, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillText('AMOUNT', X + 494, Y2 - 12);
  ctx.fillStyle = '#f0c76b';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillText('₹' + (c.amount || 20), X + 494, Y2 + 8);

  // ── Bottom gold bar ───────────────────────────────
  ctx.fillStyle = 'rgba(220,168,74,0.6)';
  ctx.fillRect(0, H - 6, W, 6);

  return canvas.toDataURL('image/png');
};

// Helper: rounded rectangle
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function CouponsList({ coupons, setCoupons, toast, setActiveView }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isZipping, setIsZipping] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRemove = (number) => {
    setDeleteConfirm(number);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    setCoupons(coupons.filter(c => c.number !== deleteConfirm));
    toast.success("Coupon deleted.");
    setDeleteConfirm(null);
  };

  const handleDownload = (number) => {
    const c = coupons.find(x => x.number === number);
    if (!c) return;
    const dataUrl = generateCouponDataURL(c);
    
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = c.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-") || "Participant";
        link.download = `${safeName}-Coupon-${c.number}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error("Download error:", err);
        toast.error("Error downloading coupon.");
      });
  };

  const handleDownloadAllAsZip = async () => {
    if (!coupons.length) return toast.error("There are no coupons to download.");
    setIsZipping(true);
    toast("Generating zip file... Please wait.");

    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = (await import('file-saver')).default;

      const zip = new JSZip();

      for (let i = 0; i < coupons.length; i++) {
        const c = coupons[i];
        const dataUrl = generateCouponDataURL(c);
        const base64Data = dataUrl.split(',')[1];
        const safeName = c.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-") || "Participant";
        zip.file(`${safeName}-Coupon-${c.number}.png`, base64Data, { base64: true });

        if (i % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "MCYM_Coupons.zip");
      toast.success("Zip file downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error generating zip file.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleExport = () => {
    if (!coupons.length) return toast.error("There is no coupon data to export.");
    let csv = "Coupon Number,Participant Name,Unit,Phone,Amount\n";
    coupons.forEach(c => {
      csv += c.number + ',"' + c.name.replace(/"/g, '""') + '","' + (c.unit || '').replace(/"/g, '""') + '","' + (c.phone || '').replace(/"/g, '""') + '",' + c.amount + "\n";
    });
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "MCYM_Christmas_Coupons.csv";
    a.click();
    toast.success("CSV file is ready.");
  };

  const filteredCoupons = coupons.filter(c => String(c.number).includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()));

  const mobileItemsPerPage = 10;
  const mobileIndexOfLastItem = currentPage * mobileItemsPerPage;
  const mobileIndexOfFirstItem = mobileIndexOfLastItem - mobileItemsPerPage;
  const currentMobileCoupons = filteredCoupons.slice(mobileIndexOfFirstItem, mobileIndexOfLastItem);
  const totalMobilePages = Math.ceil(filteredCoupons.length / mobileItemsPerPage);

  const columns = [
    {
      name: 'Coupon',
      selector: row => row.number,
      sortable: true,
      cell: row => <div className="coupon-no" style={{ fontWeight: 'bold', color: 'var(--red)' }}>#{row.number}</div>,
      width: '120px'
    },
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => <div className="person" style={{ fontWeight: '600', color: 'var(--text)' }}>{row.name}</div>
    },
    {
      name: 'Place',
      selector: row => row.unit || '-',
      sortable: true,
      cell: row => <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{row.unit || '-'}</div>
    },
    {
      name: 'Phone',
      selector: row => row.phone || '-',
      sortable: true,
      cell: row => <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{row.phone || '-'}</div>
    },
    {
      name: 'Amount',
      selector: row => row.amount,
      sortable: true,
      cell: row => <div className="money" style={{ fontWeight: '700', color: 'var(--green)' }}>₹{row.amount}</div>,
      width: '120px'
    },
    {
      name: 'Actions',
      cell: row => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn download-btn" title="Download" onClick={() => handleDownload(row.number)} style={{ background: 'var(--soft-green)', color: 'var(--green)', fontSize: '14px', width: '32px', height: '32px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiDownload />
          </button>
          <button className="icon-btn" title="Delete" onClick={() => handleRemove(row.number)} style={{ background: 'var(--soft-red)', color: 'var(--red)', fontSize: '14px', width: '32px', height: '32px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiTrash2 />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '120px'
    }
  ];

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
      },
    },
    cells: {
      style: {
        padding: '16px',
        color: 'var(--text)',
        fontSize: '14px'
      },
    },
    rows: {
      style: {
        borderBottom: '1px solid #ebe5dd',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: '#ebe5dd',
        },
        background: 'transparent',
        minHeight: '60px'
      },
      highlightOnHoverStyle: {
        backgroundColor: '#faf8f5',
        borderBottomColor: '#ebe5dd',
        outline: '1px solid #ebe5dd',
      },
    },
    pagination: {
      style: {
        borderTop: 'none',
        background: 'transparent',
        padding: '16px 0 0'
      }
    }
  };

  return (
    <section className="layout" style={{ gridTemplateColumns: '1fr' }}>
      <div className="card">
        <div className="card-title">
          <div><h2>Coupon register</h2><p>Search by coupon number or participant.</p></div>
          <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn action-btn header-btn" onClick={handleExport} title="Export CSV">
              <FiFileText size={16} style={{ color: '#10b981' }} /> Export CSV
            </button>
            <button className="btn action-btn header-btn" onClick={handleDownloadAllAsZip} disabled={isZipping} title="Download All Images">
              <FiDownloadCloud size={16} style={{ color: '#3b82f6' }} /> {isZipping ? 'Zipping...' : 'Download Coupons'}
            </button>
            <button className="btn primary header-btn" onClick={() => setActiveView('create')} style={{ width: 'auto' }}>
              <FiPlus size={16} /> Register
            </button>
          </div>
        </div>
        <div className="search">
          <div className="search-box">
            <span className="search-icon" aria-hidden="true"><BiSearch size={18} /></span>
            <input value={search} onChange={handleSearch} placeholder="Search coupon number or participant name…" />
          </div>
          <button className="btn secondary" onClick={() => { setSearch(''); setCurrentPage(1); }}>Reset</button>
        </div>
        <div className="table-box">
          <DataTable
            columns={columns}
            data={filteredCoupons}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            customStyles={customStyles}
            highlightOnHover
            noDataComponent={<div className="empty" style={{ margin: '30px 0' }}><div className="emoji">🎟️</div><b>No coupons found</b><span>Registered coupons will appear here.</span></div>}
          />
        </div>
        <div className="mobile-cards">
          {currentMobileCoupons.map(coupon => (
            <div key={coupon.number} className="mobile-card">
              <div className="mc-header">
                <span className="mc-number">#{coupon.number}</span>
                <span className="mc-amount">₹{coupon.amount}</span>
              </div>
              <div className="mc-body">
                <div className="mc-info"><strong>Name:</strong> {coupon.name}</div>
                {coupon.unit && <div className="mc-info"><strong>Unit:</strong> {coupon.unit}</div>}
                {coupon.phone && <div className="mc-info"><strong>Phone:</strong> {coupon.phone}</div>}
              </div>
              <div className="mc-actions">
                <button className="icon-btn" onClick={() => handleDownload(coupon.number)} style={{ background: 'var(--soft-green)', color: 'var(--green)', width: '36px', height: '36px' }}>
                  <FiDownload size={16} />
                </button>
                <button className="icon-btn" onClick={() => handleRemove(coupon.number)} style={{ width: '36px', height: '36px' }}>
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredCoupons.length === 0 && (
             <div className="empty" style={{ margin: '30px 0' }}><div className="emoji">🎟️</div><b>No coupons found</b><span>Registered coupons will appear here.</span></div>
          )}
          {totalMobilePages > 1 && (
            <div className="mobile-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <button 
                className="btn secondary" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '0 16px', height: '36px', fontSize: '13px' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>
                Page {currentPage} of {totalMobilePages}
              </span>
              <button 
                className="btn secondary" 
                onClick={() => setCurrentPage(p => Math.min(totalMobilePages, p + 1))}
                disabled={currentPage === totalMobilePages}
                style={{ padding: '0 16px', height: '36px', fontSize: '13px' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '40px 32px', width: '90%', maxWidth: '420px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', textAlign: 'center', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '50%', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#f1f5f9'} onMouseOut={e => e.target.style.background = 'none'}>
              <FiX size={24} />
            </button>
            
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--soft-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--red)' }}>
              <FiTrash2 size={32} />
            </div>

            <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' }}>Delete Coupon?</h3>
            <p style={{ margin: '0 0 28px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
              You are about to permanently delete coupon <b>#{deleteConfirm}</b>. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px 0', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = '#f1f5f9'} onMouseOut={e => e.target.style.background = '#f8fafc'}>
                Cancel
              </button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '12px 0', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#b91c1c'} onMouseOut={e => e.target.style.background = 'var(--red)'}>
                Yes, Delete it
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

export default CouponsList;
