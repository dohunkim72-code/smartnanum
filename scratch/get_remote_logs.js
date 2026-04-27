const { Client } = require('ssh2');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('pm2 logs smartnanum-server --lines 20 --nostream', (err, stream) => {
    if (err) throw err;
    let data = '';
    stream.on('data', (chunk) => {
      data += chunk;
    }).on('close', (code, signal) => {
      fs.writeFileSync('scratch/remote_logs.txt', data);
      console.log('Logs saved to scratch/remote_logs.txt');
      conn.end();
    });
  });
}).connect({
  host: '210.114.22.136',
  port: 22,
  username: 'root',
  password: 'Ch070809'
});
