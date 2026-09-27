import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Glass, Switch, Segmented, Slider, Button, Menu, TabBar, useGlass } from '../../src/react';
import { useRef } from 'react';

function Custom() {
  const ref = useRef<HTMLDivElement>(null);
  useGlass(ref, { variant: 'clear' });
  return <div ref={ref} id="custom" style={{ width: 160, height: 60, borderRadius: 30, display: 'grid', placeItems: 'center' }}>useGlass</div>;
}

function App() {
  const [on, setOn] = useState(true);
  const [period, setPeriod] = useState('Week');
  const [vol, setVol] = useState(40);
  const [picked, setPicked] = useState('');
  return (
    <div style={{ display: 'grid', gap: 20, padding: 30, background: 'linear-gradient(135deg,#ff5e62,#5b8cff)', minHeight: '100vh', alignContent: 'start' }}>
      <Glass variant="regular" params={{ blur: 8 }} style={{ padding: 20, borderRadius: 28, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Switch checked={on} onChange={setOn} />
        <Segmented options={['Day', 'Week', 'Month']} value={period} onChange={setPeriod} />
        <Slider value={vol} onInput={setVol} style={{ width: 200 }} />
      </Glass>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="prominent" onClick={() => setOn(o => !o)}>Toggle</Button>
        <Menu items={[{ label: 'Copy', icon: 'copy' }, { label: 'Delete', icon: 'trash', destructive: true }]} onSelect={setPicked} />
        <Custom />
      </div>
      <TabBar items={[{ label: 'Home', icon: 'house' }, { label: 'Library', icon: 'note' }]} style={{ width: 360 }} />
      <pre id="state" style={{ color: '#fff' }}>{JSON.stringify({ on, period, vol: Math.round(vol), picked })}</pre>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
