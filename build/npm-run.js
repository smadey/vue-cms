const spawn = require('child_process').spawn;
const path = require('path');

const bins = {
  'webpack': path.join(__dirname, '../node_modules/webpack/bin/webpack'),
  'webpack-dev-server': path.join(__dirname, '../node_modules/webpack-dev-server/bin/webpack-dev-server'),
};

module.exports = (script) => {
  const args = script.split(' ').map(arg => bins[arg] || arg);
  const child = spawn('node', args);

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  process.once('SIGINT', () => process.exit(0));
  process.once('exit', () => child.kill());
};
