var db = require('./db.js');

var sql_qry;

exports.getSuicideCausesByAgeGroup = function(req,res){
    var age_group = req.params.age_group;
    sql_qry = "WITH MyRowSet AS "+ 
    "( "+
    "SELECT Years AS years, Cause AS causes, "+ age_group +" AS total_of_age_group, "+
    "ROW_NUMBER() OVER (PARTITION BY Years ORDER BY Years, "+ age_group +" DESC) AS RowNum "+
    "FROM suicide_causes "+
    "where Years BETWEEN 2003 AND 2012 "+
    "AND State_Or_UT = 'TOTAL (ALL INDIA)' "+  
    "AND Cause NOT IN ('Total','Total Illness') "+
    ") "+
    "SELECT * FROM MyRowSet WHERE RowNum <=5; ";
    db.query(sql_qry,function(err, result, fields){
        if(err){
            console.log(JSON.stringify(err));
        }else{
            res.send(JSON.stringify(result));
        }
    });
};  

exports.getDeathSumForAllTheCauses = function(req,res){
    sql_qry = " SELECT SUM(Grand_Total) AS Grand_Total, SUM(Total_Male) AS Total_Male, SUM(Total_Female) AS Total_Female, Cause AS name, false as checked "+
    " FROM suicide_causes "+
    " WHERE Years BETWEEN 2003 AND 2012 "+
    " AND State_Or_UT = 'TOTAL (ALL INDIA)' "+ 
    " AND Cause NOT IN ('Total','Total Illness') "+
    " GROUP BY Cause "+
    " ORDER BY SUM(Grand_Total) DESC; "
    db.query(sql_qry,function(err, result, fields){
        if(err){
            console.log(JSON.stringify(err));
        }else{
            for(var i = 0; i<result.length;i++){
                result[i].checked = result[i].checked == 0 ? false : true;
            }
            res.send(JSON.stringify(result));
        }
    });
}

exports.getSuicideDetailsOfAllTheStates = function(req,res){
    var year = req.params.year;
    sql_qry = " SELECT  Years, State_Or_UT, Grand_Total, Total_Male, Total_Female, '' AS d, '' AS id " +
    " FROM suicide_causes "+
    " WHERE Years = " + year + " " +
    " AND State_Or_UT NOT IN ('TOTAL (ALL INDIA)' ,'TOTAL (STATES)','TOTAL (UTs)' , 'D & N HAVELI', 'DAMAN & DIU', 'LAKSHADWEEP', 'PUDUCHERRY', 'A & N ISLANDS', 'CHANDIGARH') "+
    " AND Cause = 'Total' " +
    " ORDER BY Grand_Total DESC; "
    db.query(sql_qry,function(err, result, fields){
        if(err){
            console.log(JSON.stringify(err));
        }else{
            res.send(JSON.stringify(result));
        }
    });
}