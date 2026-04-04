import http from 'http';

http.get('http://localhost:3000/api/location/start', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('GET response:', res.statusCode));
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/location/start',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('POST response:', res.statusCode, data.slice(0, 100)));
});
req.write('{}');
req.end();
