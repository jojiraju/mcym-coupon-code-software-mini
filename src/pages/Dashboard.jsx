import React, { useMemo } from 'react';
import { FiTrendingUp, FiPieChart, FiClock, FiZap, FiAward } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#941c34', '#dca84a', '#176448', '#e2773c', '#46514c'];
const RATE = 20;

function Dashboard({ coupons }) {
  const uniqueParticipants = useMemo(() => new Set(coupons.map(c => c.name.trim().toLowerCase())).size, [coupons]);
  
  const statsData = useMemo(() => {
    const byUnit = {};
    const byPerson = {};
    coupons.forEach(c => {
      const u = c.unit || 'Unknown';
      byUnit[u] = (byUnit[u] || 0) + 1;
      const p = c.name;
      byPerson[p] = (byPerson[p] || 0) + 1;
    });

    const unitChart = Object.keys(byUnit).map(k => ({ name: k, value: byUnit[k] })).sort((a, b) => b.value - a.value).slice(0, 5);
    const personChart = Object.keys(byPerson).map(k => ({ name: k, count: byPerson[k] })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    const byPersonCount = Object.keys(byPerson).length;
    const avgCoupons = byPersonCount ? (coupons.length / byPersonCount).toFixed(1) : 0;
    const largestBatch = byPersonCount ? Math.max(...Object.values(byPerson)) : 0;
    const topPersonName = byPersonCount ? Object.keys(byPerson).reduce((a, b) => byPerson[a] > byPerson[b] ? a : b) : '-';

    const recent = [];
    const seen = new Set();
    for (let i = coupons.length - 1; i >= 0 && recent.length < 5; i--) {
      if (!seen.has(coupons[i].name)) {
        seen.add(coupons[i].name);
        recent.push({ name: coupons[i].name, unit: coupons[i].unit, count: byPerson[coupons[i].name] });
      }
    }

    return { unitChart, personChart, avgCoupons, largestBatch, topPersonName, recent };
  }, [coupons]);

  return (
    <>
      <section className="stats" style={{ marginBottom: '24px' }}>
        <div className="stat"><div className="stat-icon">🎟️</div><div><small>Coupons</small><b>{coupons.length.toLocaleString('en-IN')}</b></div></div>
        <div className="stat"><div className="stat-icon">₹</div><div><small>Collected</small><b>₹{(coupons.length * RATE).toLocaleString('en-IN')}</b></div></div>
        <div className="stat"><div className="stat-icon">👥</div><div><small>People</small><b>{uniqueParticipants.toLocaleString('en-IN')}</b></div></div>
      </section>
      
      <div className="dashboard-grid">
      <div className="chart-card">
        <h3><FiTrendingUp style={{ marginRight: '8px', color: 'var(--gold)', verticalAlign: 'middle' }}/> Top Participants</h3>
        {statsData.personChart.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={statsData.personChart} margin={{ left: -20, right: 10, top: 10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--bg)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow)' }}/>
                <Bar dataKey="count" fill="var(--red)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty"><span>No data available yet.</span></div>
        )}
      </div>

      <div className="chart-card">
        <h3><FiPieChart style={{ marginRight: '8px', color: 'var(--green)', verticalAlign: 'middle' }}/> Coupons by Unit</h3>
        {statsData.unitChart.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statsData.unitChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {statsData.unitChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow)' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty"><span>No data available yet.</span></div>
        )}
      </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div className="chart-card">
          <h3><FiClock style={{ marginRight: '8px', color: 'var(--red)', verticalAlign: 'middle' }}/> Recent Registrations</h3>
          {statsData.recent.length > 0 ? (
            <div style={{ marginTop: '16px' }}>
              {statsData.recent.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === statsData.recent.length - 1 ? 'none' : '1px solid var(--line)' }}>
                  <div>
                    <strong style={{ display: 'block', color: 'var(--text)', fontSize: '14px' }}>{r.name}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{r.unit || 'No unit specified'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ display: 'block', color: 'var(--red)', fontSize: '14px' }}>{r.count} coupons</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>₹{(r.count * RATE).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty"><span>No recent activity.</span></div>
          )}
        </div>

        <div className="chart-card">
          <h3><FiZap style={{ marginRight: '8px', color: '#f59e0b', verticalAlign: 'middle' }}/> Quick Insights</h3>
          
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--soft-red)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <FiPieChart />
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Average per person</span>
                <strong style={{ display: 'block', color: 'var(--text)', fontSize: '24px' }}>{statsData.avgCoupons} <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>coupons</span></strong>
              </div>
            </div>

            <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--soft-gold)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <FiAward />
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Largest Single Batch</span>
                <strong style={{ display: 'block', color: 'var(--text)', fontSize: '20px' }}>{statsData.largestBatch} <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>by {statsData.topPersonName}</span></strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
