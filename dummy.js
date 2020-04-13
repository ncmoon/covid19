
console.log('dummy.js - covid creating dummy records');

const
  fs = require('fs'),
  mysql = require('mysql');


console.log('dummy.js start.');

var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : 'rachel',
  database        : 'covid',
  multipleStatements: true
});

const
  msPerHour = 60 * 60 * 1000,
  msPerDay = 24 * msPerHour,
  
  p0 = 1,                                  //initial PhoneID
  p1 = 1000,                               //last PhoneID
  q0 = (new Date('2020-01-01')).valueOf(), //first day
  q1 = (new Date('2020-03-15')).valueOf(); //last day
var
  p, q,
  dataPhones = [],
  dataLocations = [];

function asISO(v) {
  return (new Date(v)).toISOString().slice(0, -1);
} //asISO

/*
1	1	POINT(-0.5 51.25)	POINT(0 51.35)	2020-01-01 00:53:54	2020-01-01 00:53:54	2020-01-01 00:53:54	2020-01-01 00:53:54	\N	\N
*/

function asPoint(x, y) {
  return 'POINT(' + x + ' ' + y + ')';
} //asPoint


function asPolygon(x0, y0, x1, y1) {
  //NB: this only works properly if x0 < x1 and y0 < y1
  return 'POLYGON((' + x0 + ' ' + y0 + ',' + x0 + ' ' + y1 + ',' + x1 + ' ' + y1 + ',' + x1 + ' ' + y0 + ',' + x0 + ' ' + y0 + '))';
} //asPolygon

function makeDay(data, day) {
  //TODO, starting around 1am add home, then add random events from around 3 - 10am --> 5-11pm involving work and selected other locations
  var
    d = Math.trunc(q/msPerDay), //day as number
    index = d * 1000, //allows up to 1000 events per day 
    day2 = day + (22 * msPerHour);
  //console.log(day, day2);
  while (day < day2) {
    let
      x = -0.5 + Math.random(),
      y = 51.25 + Math.random()/2;

    data.push([
      p, index, asPolygon(x - 0.0001, y - 0.0001, x + 0.0001, y + 0.0001), 
      asISO(day), asISO(day = day + 2*60*60*1000 * Math.random()), 
      asISO(day = day + 10*60*60*1000 * Math.random()), asISO(day = day + 2*60*60*1000 * Math.random()), '\\N', '\\N'
    ]);
    index++;
  }
} //makeDay


function toTxtFile(data, name) {
  const
    TAB = '\t',
    LF = '\n';
  var 
    path = 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/' + name,
    result = '';
  data = data.map(function(row) {
    return row.join(TAB);
  });
  result = data.join(LF);
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
  fs.writeFileSync(path, result);
} //toTxtFile



for (p = p0; p <= p1; p++) {     //each phone
  dataPhones.push([p, '0700 ' + (1000000 + p)]);
  for (q = q0; q <= q1; q += msPerDay) {   //each day
    makeDay(dataLocations, q);
  }
}
toTxtFile(dataPhones, 'dummyPhones.txt');
toTxtFile(dataLocations, 'dummyLocations.txt');

pool.query(
`DELETE FROM PhoneLocations;DELETE FROM Phone;
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/dummyPhones.txt' REPLACE INTO TABLE Phone`, function(err, results, fields) {
  if (!err) {
    pool.query(
  `LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/dummyLocations.txt' 
   REPLACE INTO TABLE PhoneLocations
   (PhoneID, LocID, @b, T0, T1, T2, T3, Hard, Soft)
   SET Box = ST_PolyFromText(@b);`, function(err, results, fields) {
      console.log(err);
      pool.end(function (err) {
        console.log('dummy.js end.');
      });
    });
  }
  else {
    console.log(err);
    pool.end(function (err) {
      console.log('dummy.js end.');
    });
  }
});

console.log('dummy.js end script.');
