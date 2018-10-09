var db    = {};
var mysql = require('promise-mysql');
var pool  = mysql.createPool({
    connectionLimit : 10,
    host : '127.0.0.1',
    user : 'root',
    password : 'root',
    database : 'site'
});

module.exports = pool;