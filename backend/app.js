import fs from 'fs';
import path from 'path';

process.on('uncaughtException', (err) => {
  fs.writeFileSync(path.resolve('crash.log'), String(err.stack || err) + '\n');
});

process.on('unhandledRejection', (err) => {
  fs.writeFileSync(path.resolve('crash.log'), String(err.stack || err) + '\n');
});

try {
  import('./dist/index.js').catch(err => {
    fs.writeFileSync(path.resolve('crash-import.log'), String(err.stack || err) + '\n');
  });
} catch (err) {
  fs.writeFileSync(path.resolve('crash-sync.log'), String(err.stack || err) + '\n');
}

