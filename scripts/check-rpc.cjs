// Independent native fetch RPC tester for Sepolia JSON-RPC endpoints
const rpcs = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://1rpc.io/sepolia'
];

async function jsonRpc(url, method, params = []) {
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    }),
    signal: AbortSignal.timeout(8000)
  });
  const elapsed = Date.now() - start;
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  return { result: data.result, latency: elapsed };
}

async function run() {
  console.log('=== Sepolia RPC Live Verification ===');
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  for (const url of rpcs) {
    console.log(`\nTesting: ${url}`);
    try {
      const chainIdRes = await jsonRpc(url, 'eth_chainId');
      const chainIdDecimal = parseInt(chainIdRes.result, 16);
      
      const blockRes = await jsonRpc(url, 'eth_blockNumber');
      const blockDecimal = parseInt(blockRes.result, 16);
      
      const codeRes = await jsonRpc(url, 'eth_getCode', [contractAddress, 'latest']);
      const hasCode = codeRes.result && codeRes.result !== '0x' && codeRes.result !== '0x0';

      console.log(`  Status: ONLINE (${chainIdRes.latency}ms)`);
      console.log(`  Chain ID: ${chainIdDecimal} (${chainIdRes.result}) [${chainIdDecimal === 11155111 ? 'MATCHES SEPOLIA' : 'MISMATCH'}]`);
      console.log(`  Block Height: ${blockDecimal}`);
      console.log(`  eth_getCode(${contractAddress}): "${codeRes.result}" -> ${hasCode ? 'CONTRACT PRESENT' : 'NO CONTRACT ON SEPOLIA (Expected for Hardhat local addr)'}`);
    } catch (err) {
      console.log(`  Status: FAILED / BLOCKED`);
      console.log(`  Reason: ${err.message}`);
    }
  }
}

run();
