const http = require('http');

const data = JSON.stringify({
  email: "nishanrajak01@gmail.com",
  password: "password"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => {
  console.error(e);
});
req.write(data);
req.end();
