const restore = require('./restore');
const argv = require('minimist')(process.argv.slice(2));

const uri = argv.db;

if (!argv.dump) {
  return console.log("Run 'node tasks/seed --dump dump_folder'");
}

restore({
  uri: uri ? uri : 'mongodb://localhost:27017/webph2_dev',
  root: argv.dump,
  drop: true,
  metadata: true,
  callback: function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log('Importing completed!');
    }
  }
});
