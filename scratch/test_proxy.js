const targetUrl = 'https://webapi.bps.go.id/v1/api/domain?type=prov&key=49b3ee3219c4030633b6fff5e581ddc5';
const encodedUrl = encodeURIComponent(targetUrl);

const proxies = [
  { name: 'codetabs encoded', url: `https://api.codetabs.com/v1/proxy?quest=${encodedUrl}` },
  { name: 'corsproxy.io', url: `https://corsproxy.io/?url=${encodedUrl}` },
  { name: 'allorigins raw', url: `https://api.allorigins.win/raw?url=${encodedUrl}` }
];

async function testProxies() {
  for (const proxy of proxies) {
    console.log(`Testing ${proxy.name}...`);
    try {
      const res = await fetch(proxy.url);
      console.log(`${proxy.name} status:`, res.status);
      if (res.ok) {
        const text = await res.text();
        console.log(`${proxy.name} response sample:`, text.substring(0, 100));
      }
    } catch (e) {
      console.error(`${proxy.name} failed:`, e.message);
    }
  }
}

testProxies();
