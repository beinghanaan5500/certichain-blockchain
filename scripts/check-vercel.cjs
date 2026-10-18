async function check() {
  try {
    const res = await fetch('https://certichain-blockchain-zeta.vercel.app', { cache: 'no-store' });
    const text = await res.text();
    const match = text.match(/src="\/assets\/(index-[^"]+\.js)"/);
    console.log('HTTP Status:', res.status);
    console.log('Live bundle detected on Vercel:', match ? match[1] : 'Unknown');
    
    // Check security headers
    console.log('--- Response Headers ---');
    console.log('Content-Security-Policy:', res.headers.get('content-security-policy') ? 'PRESENT' : 'NOT PRESENT');
    console.log('X-Frame-Options:', res.headers.get('x-frame-options'));
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

check();
