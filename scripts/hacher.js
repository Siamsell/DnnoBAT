const bcrypt = require('bcryptjs');
const plainPassword = "2001";
bcrypt.hash(plainPassword, 10).then(hash => {
    console.log('Hash à copier:', hash);
});