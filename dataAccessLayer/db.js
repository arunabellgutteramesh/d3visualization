var mysql = require('mysql');
var chalk = require('chalk');

//create connection
var connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "sql12345",
    database:"DMV_schema"
  });

connection.connect(function(err){
    if(err){
        console.log(chalk.red(err));
    }else{
        console.log(chalk.green("connected to DB..."));
    }
});

module.exports = connection;