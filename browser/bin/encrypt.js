const { encrypt } = require("../src/index");

encrypt(puppet.argv[0], puppet.argv[1])
  .then(result => {
    console.log(result);
    puppet.exit(0);
  })
  .catch(error => {
    console.error(error.toString());
    puppet.exit(1);
  });