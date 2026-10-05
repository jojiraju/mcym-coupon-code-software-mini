import React, { useState } from 'react';

const RATE = 20;

function CouponsCreate({ coupons, setCoupons, toast, setActiveView }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [phone, setPhone] = useState('');
  const [startCoupon, setStartCoupon] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState({});

  const clearForm = () => {
    setName('');
    setUnit('');
    setPhone('');
    setStartCoupon('');
    setQuantity('');
    setErrors({});
  };

  const handleAdd = () => {
    const trimmedName = name.trim();
    const start = Number(startCoupon);
    const qty = Number(quantity);
    const trimmedUnit = unit.trim();
    const trimmedPhone = phone.trim();

    const newErrors = {};
    if (!trimmedName) newErrors.name = "Required";
    if (!Number.isInteger(start) || start < 1) newErrors.startCoupon = "Required";
    if (!Number.isInteger(qty) || qty < 1) newErrors.quantity = "Required";

    if (!newErrors.startCoupon && !newErrors.quantity) {
      for (let i = 0; i < qty; i++) {
        const n = start + i;
        if (coupons.some(c => c.number === n)) {
          newErrors.startCoupon = `Coupon #${n} is already registered.`;
          break;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const newCoupons = [];
    for (let i = 0; i < qty; i++) {
      newCoupons.push({ number: start + i, name: trimmedName, unit: trimmedUnit, phone: trimmedPhone, amount: RATE });
    }

    const allCoupons = [...coupons, ...newCoupons].sort((a, b) => a.number - b.number);
    setCoupons(allCoupons);
    clearForm();
    toast.success(`${qty} coupon${qty === 1 ? '' : 's'} added for ${trimmedName}.`);
    setActiveView('coupons');
  };

  return (
    <section className="layout" style={{ gridTemplateColumns: '1fr' }}>
      <div className="card" id="entryCard">
        <div className="card-title">
          <div><h2>Register coupons</h2><p>Add one person's entire batch at once.</p></div>
          <span className="pill">FAST ENTRY</span>
        </div>

        <div className="field">
          <label>Participant name <span style={{ color: '#fb2c36' }}>*</span></label>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: null })); }}
            autoComplete="name"
            placeholder="Enter participant name"
            style={errors.name ? { borderColor: '#fb2c36' } : {}}
          />
          {errors.name && <div style={{ color: '#fb2c36', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.name}</div>}
        </div>

        <div className="two">
          <div className="field">
            <label>Unit</label>
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. Dubai" />
          </div>
          <div className="field">
            <label>Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="e.g. 7560857801" />
          </div>
        </div>

        <div className="two">
          <div className="field">
            <label>Starting coupon number <span style={{ color: '#fb2c36' }}>*</span></label>
            <div className="input-wrap">
              <span className="prefix">#</span>
              <input
                value={startCoupon}
                onChange={e => { setStartCoupon(e.target.value); setErrors(p => ({ ...p, startCoupon: null })); }}
                onWheel={e => e.target.blur()}
                inputMode="numeric"
                type="number"
                min="1"
                placeholder="e.g. 10001"
                style={errors.startCoupon ? { borderColor: '#fb2c36' } : {}}
              />
            </div>
            {errors.startCoupon && <div style={{ color: '#fb2c36', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.startCoupon}</div>}
          </div>
          <div className="field">
            <label>Quantity <span style={{ color: '#fb2c36' }}>*</span></label>
            <input
              value={quantity}
              onChange={e => { setQuantity(e.target.value); setErrors(p => ({ ...p, quantity: null })); }}
              onWheel={e => e.target.blur()}
              inputMode="numeric"
              type="number"
              min="1"
              placeholder="e.g. 50"
              style={errors.quantity ? { borderColor: '#fb2c36' } : {}}
            />
            {errors.quantity && <div style={{ color: '#fb2c36', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.quantity}</div>}
          </div>
        </div>

        <div className="total"><span>Batch total</span><b>₹{(Number(quantity) * RATE || 0).toLocaleString('en-IN')}</b></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <button className="btn secondary" onClick={() => setActiveView('coupons')} style={{ margin: 0, padding: '0 24px', width: 'fit-content', flex: 'none' }}>Cancel</button>
          <button className="btn primary" onClick={handleAdd} style={{ margin: 0, padding: '0 24px', width: 'fit-content', flex: 'none' }}>Submit</button>
        </div>
        <div className="helper">Example: starting coupon 10001 + quantity 50 automatically registers 10001 through 10050.</div>
      </div>
    </section>
  );
}

export default CouponsCreate;
