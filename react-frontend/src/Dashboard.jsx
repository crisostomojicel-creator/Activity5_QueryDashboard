import { useCallback, useEffect, useState } from 'react';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/v1/products/queries';
const COLORS = ['#3182CE', '#8B5CF6', '#22C55E', '#F97316', '#EC4899', '#14B8A6', '#EAB308', '#6366F1', '#EF4444', '#06B6D4'];
const money = (v) => `₱${Number(v || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
const list = (v) => Array.isArray(v) ? v : [];
const maxVal = (rows, key) => Math.max(1, ...rows.map((r) => Number(r[key]) || 0));

function Metric({ title, value, icon, note, tone }) {
  return <article className={`metric-card ${tone}`}><div className="metric-icon">{icon}</div><div className="metric-copy"><span>{title}</span><strong>{value ?? '—'}</strong><small>{note}</small></div></article>;
}
function Panel({ number, title, subtitle, children }) {
  return <article className="chart-card"><h2 className="chart-title">{number}. {title}</h2><div className="chart-body">{children}</div><p className="chart-subtitle">{subtitle}</p></article>;
}
function Empty({ text = 'No records available yet' }) { return <div className="chart-empty">{text}</div>; }
function Donut({ rows, valueKey = 'value' }) {
  if (!rows.length || !rows.some(r => Number(r[valueKey]) > 0)) return <Empty />;
  const total = rows.reduce((s, r) => s + Number(r[valueKey] || 0), 0); let offset = 0; const circ = 2 * Math.PI * 66;
  return <div className="donut-layout"><svg viewBox="0 0 180 180"><circle cx="90" cy="90" r="66" fill="none" stroke="#eaf5fb" strokeWidth="25"/>{rows.map((r,i)=>{const d=Number(r[valueKey]||0)/total*circ;const el=<circle key={i} cx="90" cy="90" r="66" fill="none" stroke={COLORS[i%COLORS.length]} strokeWidth="25" strokeDasharray={`${d} ${circ-d}`} strokeDashoffset={-offset} transform="rotate(-90 90 90)"/>;offset+=d;return el;})}<text x="90" y="86" textAnchor="middle" className="donut-total">{total.toLocaleString()}</text><text x="90" y="105" textAnchor="middle" className="donut-caption">Products</text></svg><div className="legend">{rows.map((r,i)=><div key={i}><i style={{background:COLORS[i%COLORS.length]}}/><span>{r.name}</span><b>{Math.round(Number(r[valueKey]||0)/total*100)}%</b></div>)}</div></div>;
}
function Line({ rows, color = '#168fe0', area = false, step = false, yLabel = '' }) {
  if (!rows.length) return <Empty />;
  const vals=rows.map(r=>Number(r.value||0));const max=Math.max(1,...vals)*1.12;const pts=vals.map((v,i)=>[28+i*284/Math.max(1,vals.length-1),132-v/max*105]);
  const path=pts.map((p,i)=>`${i?(step?`H ${p[0]} V ${p[1]}`:`L ${p[0]} ${p[1]}`):`M ${p[0]} ${p[1]}`}`).join(' ');
  return <div className="line-wrap"><svg viewBox="0 0 330 166" className="plot"><g className="grid-lines">{[25,60,95,130].map(y=><line key={y} x1="25" x2="315" y1={y} y2={y}/>)}</g>{area&&<path d={`${path} L 312 132 L 28 132 Z`} fill={color} opacity=".18"/>}<path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>{pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke={color} strokeWidth="2"/>)}<g className="axis-labels">{rows.map((r,i)=><text key={i} x={pts[i][0]} y="153" textAnchor="middle">{r.month}</text>)}</g></svg>{yLabel&&<small className="axis-caption">{yLabel}</small>}</div>;
}
function VBars({ rows, valueKey='value', labels=true, formatter=v=>v, color=true }) {
  if (!rows.length) return <Empty />; const max=maxVal(rows,valueKey);
  return <div className="vbar-chart">{rows.map((r,i)=><div className="vbar-col" key={i}><b>{formatter(r[valueKey])}</b><div className="vbar-track"><i style={{height:`${Math.max(2,Number(r[valueKey]||0)/max*100)}%`,background:color?COLORS[i%COLORS.length]:'#168fe0'}}/></div>{labels&&<span title={r.name||r.month}>{r.name||r.month}</span>}</div>)}</div>;
}
function HBars({ rows, valueKey='value', formatter=v=>v, labelKey='name' }) {
  if (!rows.length) return <Empty />;const max=maxVal(rows,valueKey);
  return <div className="hbar-list">{rows.slice(0,10).map((r,i)=><div className="hbar-row" key={i}><span title={r[labelKey]}>{r[labelKey]}</span><div className="hbar-track"><i style={{width:`${Math.max(2,Number(r[valueKey]||0)/max*100)}%`,background:COLORS[i%COLORS.length]}}/></div><b>{formatter(r[valueKey])}</b></div>)}</div>;
}
function Funnel({ rows }) {
  if (!rows.length) return <Empty />;const max=maxVal(rows,'value');
  return <div className="funnel-list">{rows.slice(0,6).map((r,i)=><div key={i} className="funnel-row" style={{width:`${Math.max(34,Number(r.value||0)/max*100)}%`,background:COLORS[i%COLORS.length]}}><span>{r.name}</span><b>{Number(r.value||0).toLocaleString()}</b></div>)}</div>;
}
function Lollipop({ rows }) {
  if (!rows.length) return <Empty />;const max=maxVal(rows,'value');
  return <div className="lollipop-list">{rows.map((r,i)=><div className="lollipop-row" key={i}><span>{r.month}</span><div><i style={{width:`${Math.max(2,Number(r.value||0)/max*100)}%`,background:COLORS[3]}}/><b>{r.value}</b></div></div>)}</div>;
}
function Waffle({ rows }) {
  const total=rows.reduce((s,r)=>s+Number(r.value||0),0);if(!total)return <Empty />;
  const cells=rows.flatMap((r,i)=>Array.from({length:Math.round(Number(r.value||0)/total*100)},()=>i)).slice(0,100);
  while(cells.length<100)cells.push(0);
  return <div className="waffle-wrap"><div className="waffle-grid">{cells.map((i,n)=><i key={n} style={{background:COLORS[i%COLORS.length]}}/>)}</div><div className="waffle-legend">{rows.map((r,i)=><span key={i}><i style={{background:COLORS[i%COLORS.length]}}/>{r.name}: {r.value}</span>)}</div></div>;
}
function Radar({ rows }) {
  if(!rows.length)return <Empty />;const vals=rows.slice(0,7),max=Math.max(5,...vals.map(r=>Number(r.value)||0)),cx=160,cy=82,rad=59;
  const p=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/vals.length;return [cx+Math.cos(a)*rad*v/max,cy+Math.sin(a)*rad*v/max]};
  return <svg viewBox="0 0 320 165" className="radar-svg">{[.25,.5,.75,1].map((s,i)=><polygon key={i} points={vals.map((_,j)=>{const a=-Math.PI/2+j*2*Math.PI/vals.length;return `${cx+Math.cos(a)*rad*s},${cy+Math.sin(a)*rad*s}`}).join(' ')} fill="none" stroke="#d8eaf5"/>)}<polygon points={vals.map((r,i)=>p(i,Number(r.value)||0).join(',')).join(' ')} fill="#8B5CF6" fillOpacity=".25" stroke="#7C3AED" strokeWidth="2.5"/>{vals.map((r,i)=>{const q=p(i,Number(r.value)||0),a=-Math.PI/2+i*2*Math.PI/vals.length;return <g key={i}><circle cx={q[0]} cy={q[1]} r="3" fill="#7C3AED"/><text x={cx+Math.cos(a)*83} y={cy+Math.sin(a)*83+3} textAnchor="middle" fontSize="9" fill="#55768d">{r.name}</text></g>})}</svg>;
}
function Pie({ rows }) {
  if(!rows.length)return <Empty />;const total=rows.reduce((s,r)=>s+Number(r.value||0),0);if(!total)return <Empty />;let angle=-Math.PI/2;
  const slices=rows.map((r,i)=>{const v=Number(r.value||0),next=angle+v/total*2*Math.PI;const x1=90+70*Math.cos(angle),y1=90+70*Math.sin(angle),x2=90+70*Math.cos(next),y2=90+70*Math.sin(next),large=next-angle>Math.PI;const d=`M 90 90 L ${x1} ${y1} A 70 70 0 ${large?1:0} 1 ${x2} ${y2} Z`;angle=next;return <path key={i} d={d} fill={COLORS[i%COLORS.length]} stroke="#fff" strokeWidth="1.5"/>});
  return <div className="pie-layout"><svg viewBox="0 0 180 180">{slices}</svg><div className="legend">{rows.map((r,i)=><div key={i}><i style={{background:COLORS[i%COLORS.length]}}/><span>{r.name}</span><b>{Math.round(Number(r.value||0)/total*100)}%</b></div>)}</div></div>;
}
function Scatter({ rows }) {
  if(!rows.length)return <Empty />;const mx=Math.max(1,...rows.map(r=>Number(r.price)||0)),my=Math.max(1,...rows.map(r=>Number(r.reviews)||0));
  return <svg viewBox="0 0 330 166" className="plot"><g className="grid-lines">{[25,60,95,130].map(y=><line key={y} x1="25" x2="315" y1={y} y2={y}/>)}</g>{rows.slice(0,100).map((r,i)=><circle key={i} cx={28+Number(r.price||0)/mx*280} cy={132-Number(r.reviews||0)/my*105} r="3.5" fill={COLORS[i%COLORS.length]} opacity=".88"/>)}<text x="170" y="160" textAnchor="middle" className="axis-labels">Product Price (₱)</text></svg>;
}
function Treemap({ rows }) {
  if(!rows.length)return <Empty />;return <div className="treemap">{rows.map((r,i)=><div key={i} style={{flexGrow:Math.max(1,Number(r.value||0)),background:COLORS[i%COLORS.length]}}><b>{r.name}</b><strong>{r.value}</strong></div>)}</div>;
}
function Violin({ rows }) {
  const valid=rows.filter(r=>list(r.values).length);if(!valid.length)return <Empty text="Order values will appear when orders are recorded"/>;
  const all=valid.flatMap(r=>r.values.map(Number)),max=Math.max(1,...all)*1.05;
  return <div className="violin-chart">{valid.slice(0,6).map((r,i)=>{const vals=r.values.map(Number).filter(Number.isFinite);const bins=Array.from({length:18},(_,j)=>{const center=max*(j+.5)/18;return vals.filter(v=>Math.abs(v-center)<max/18*1.3).length});const peak=Math.max(1,...bins);const pts=bins.map((v,j)=>`${23+v/peak*17},${105-j*5.3}`).join(' ');const rev=[...bins].reverse().map((v,j)=>`${23+v/peak*17},${10+j*5.3}`).join(' ');return <div className="violin-item" key={i}><svg viewBox="0 0 46 112"><path d={`M ${pts} L ${rev} Z`} fill={COLORS[i%COLORS.length]} fillOpacity=".28" stroke={COLORS[i%COLORS.length]} strokeWidth="1.8"/><line x1="23" x2="23" y1="24" y2="88" stroke="#245b7d" strokeWidth="1.4"/><rect x="17" y="48" width="12" height="23" fill="#fff" stroke={COLORS[i%COLORS.length]} strokeWidth="1.5"/><line x1="17" x2="29" y1="59" y2="59" stroke="#245b7d" strokeWidth="1.5"/></svg><span>{r.name}</span></div>})}</div>;
}
function Waterfall({ rows }) {
  if(!rows.length)return <Empty />;let total=0;const max=Math.max(1,...rows.reduce((a,r)=>{total+=Number(r.value||0);a.push(total);return a},[]));let run=0;
  return <div className="waterfall">{rows.map((r,i)=>{const start=run;run+=Number(r.value||0);return <div className="waterfall-item" key={i}><b>{money(r.value)}</b><i style={{bottom:`${start/max*100}%`,height:`${Math.max(3,Number(r.value||0)/max*100)}%`,background:COLORS[2]}}/><span>{r.month}</span></div>})}<div className="waterfall-total"><b>{money(run)}</b><span>Total</span></div></div>;
}

export default function Dashboard(){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[period,setPeriod]=useState('all');
  const loadData=useCallback(async()=>{setLoading(true);setError('');try{const response=await fetch(`${API_URL}?period=${period}`,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Laravel API returned ${response.status}`);const json=await response.json();const payload=json.data??json;setData(payload.data??payload)}catch(e){setError(`${e.message}. Make sure Laravel and the database are running.`)}finally{setLoading(false)}},[period]);
  useEffect(()=>{loadData()},[loadData]);
  const dash=data?.dashboard||{},metric=dash.metrics||{};
  const months=list(dash.monthly_revenue),reviews=list(dash.monthly_reviews);
  const charts=[
    {n:1,title:'Products by Category',sub:'Share of products in each category',view:<Donut rows={list(dash.products_by_category).map(r=>({name:r.name,value:r.product_count}))}/>},
    {n:2,title:'Monthly Order Trend',sub:'Number of orders recorded each month',view:<Line rows={list(dash.orders_over_time)} color="#3182CE"/>},
    {n:3,title:'Revenue by Category',sub:'Total sales value by product category',view:<VBars rows={list(dash.revenue_by_category)} valueKey="value" formatter={money}/>},
    {n:4,title:'Orders by Category',sub:'Order counts grouped by product category',view:<Funnel rows={list(dash.orders_by_category)}/>},
    {n:5,title:'Top 10 Best-Selling Products',sub:'Total quantity sold per product',view:<HBars rows={list(dash.top_selling_products).map(r=>({...r,value:r.quantity}))} formatter={v=>v}/>},
    {n:6,title:'Average Price by Category',sub:'Average product price by category',view:<Radar rows={list(dash.average_price_by_category).map(r=>({name:r.name,value:r.value}))}/>},
    {n:7,title:'Reviews Over Time',sub:'Monthly number of customer reviews',view:<Lollipop rows={reviews.map(r=>({month:r.month,value:r.value}))}/>},
    {n:8,title:'User Registration Trend',sub:'New user registrations by month',view:<Line rows={list(dash.user_registration_trend)} color="#16A34A" area/>},
    {n:9,title:'Orders per User',sub:'Distribution of orders placed by each user',view:<Pie rows={list(dash.orders_per_user_distribution)}/>},
    {n:10,title:'Review Rating Distribution',sub:'Share of reviews across five star levels',view:<Waffle rows={list(dash.reviews_by_rating).map(r=>({name:`★ ${r.rating}`,value:r.count}))}/>},
    {n:11,title:'Product Price vs. Reviews',sub:'Relationship between product price and review count',view:<Scatter rows={list(dash.product_price_vs_reviews)}/>},
    {n:12,title:'Revenue Trend (Step Chart)',sub:'Monthly revenue changes in step form',view:<Line rows={months} color="#A855F7" step/>},
    {n:13,title:'Category Contribution to Total Orders',sub:'Category share of ordered quantities',view:<Treemap rows={list(dash.category_order_contribution)}/>},
    {n:14,title:'Order Value Distribution',sub:'Spread of order-line values by category',view:<Violin rows={list(dash.order_value_distribution)}/>},
    {n:15,title:'Cumulative Revenue (Waterfall)',sub:'Monthly revenue contribution and running total',view:<Waterfall rows={months}/>},
  ];
  return <main className="dashboard-shell">
    <header className="hero-header"><div className="brand-icon"><span/><span/><span/></div><div className="hero-title"><h1>Query Board</h1><p>Product, Order, User, and Review Insights <i/> 15 Data Visualizations</p></div><div className="hero-actions"><label className="period-select"><span>▦</span><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">All Time</option><option value="year">This Year</option><option value="30days">Last 30 Days</option></select></label><button className="refresh-button" onClick={loadData} disabled={loading}><span>↻</span> Refresh</button></div></header>
    {error&&<div className="error-banner"><strong>Unable to load dashboard data.</strong> {error}<button onClick={loadData}>Try again</button></div>}{loading&&<div className="loading-line">Loading live database insights…</div>}
    <section className="metrics-grid"><Metric title="Total Products" value={metric.products?.toLocaleString()} icon="◇" note="Products in database" tone="sky"/><Metric title="Total Orders" value={metric.orders?.toLocaleString()} icon="🛒" note="Recorded orders" tone="mint"/><Metric title="Total Users" value={metric.users?.toLocaleString()} icon="♙" note="Registered accounts" tone="blue"/><Metric title="Total Reviews" value={metric.reviews?.toLocaleString()} icon="☆" note="Customer reviews" tone="pale"/></section>
    <section className="charts-grid">{charts.map(c=><Panel key={c.n} number={c.n} title={c.title} subtitle={c.sub}>{c.view}</Panel>)}</section>
    <footer className="dashboard-footer"><span>Query Board · Activity 5 WST</span><span>Live source: Laravel database queries</span></footer>
  </main>;
}
