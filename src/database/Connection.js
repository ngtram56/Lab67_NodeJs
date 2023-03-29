const mysql = require('mysql')

// set up connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lab67'
})

// check connection
connection.connect(function(err) {
    if (err) throw err;
    console.log("SQL Connected!!!")
});

module.exports = connection;