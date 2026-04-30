import https from 'https';

const names = [
  'Tri Ponco','Dewi Nur Widayati','Ardina Sita','Supeno Edy',
  'Rini Lestyowati','Murniati','Mohamad Syaiful','Maya Fransika',
  'Susana','Vera Septiani','Nanin Wirasita','Ersta Widyaningrum',
  'Sigit Rasyid','Hesi Dayani','Ahmad Ashif','Ahmad Rifqi',
  'Aprilia Nurhayati','Danu Ari Wibowo','Euis Sumaiyah','Hidayat Harsoyo',
  'Ikrom Mujo','Nur Aini','Rika Ardhiana','Herlina Tria','Nugraheni Sri'
];

const conditions = names.map(n => `name ILIKE '%${n}%'`).join(' OR ');
const query = `SELECT id, nip, name, position_name, department FROM employees WHERE department ILIKE '%Semarang%' AND (${conditions}) ORDER BY name`;

const data = JSON.stringify({ query });

const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/mauyygrbdopmpdpnwzra/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sbp_3e4ce55f5e201376fe3ac4fc67523d91b6f5e4ed',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const rows = JSON.parse(body);
    if (rows.message) { console.error('Error:', rows.message); return; }
    console.log(`Found: ${rows.length} pegawai\n`);
    rows.forEach(r => console.log(`${r.nip} | ${r.name} | ${r.position_name}`));
  });
});
req.on('error', e => console.error(e));
req.write(data);
req.end();
