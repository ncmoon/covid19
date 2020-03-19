
console.log('dummy.js - covid creating dummy records');

const
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
  msPerDay = 24 * 60 * 60 * 1000;

function addToDay(day, mS) {
  //console.group();console.log(day, mS);
  var result = new Date(day.valueOf() + mS);
  //console.log(result);console.groupEnd();
  return result;
} //addToDay


/*
  TODO  - convert so can use LOAD DATA 

  PhoneID LocID     X0                    X1                    Y0                Y1                T0                  T1                  T2                  T3                  Hard Soft
  217362	18262000	-0.18107886650958882	-0.18087886650958884	51.63926925192524	51.63946925192525	2020-01-01 00:00:00	2020-01-01 01:57:59	2020-01-01 06:16:12	2020-01-01 06:39:20	\N	\N

  const
    TAB = '\t',
    CRLF = '\r\n';
    data = [[pID, lID, x0, x1, y0, y1, t0, t1, t2, t3, '\N', '\N'], ...];

    data = data.map(function(row) {
      return row.join(TAB);
    });
    return data.join('\r\n');
  


SELECT * FROM PhoneLocations LIMIT 1 INTO OUTFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/test.txt';





*/





function insertPhone(i, from, to) {
  var
    homeX = -0.5 + Math.random(), 
    homeY = 51.25 + Math.random()/2,
    workX = -0.5 + Math.random(),
    workY = 51.25 + Math.random()/2,
    d;

  function makeDay(day) {
    //TODO, starting around 1am add home, then add random events from around 3 - 10am --> 5-11pm involving work and selected other locations
    var
      result = '',
      values = '',
      index = Math.floor(day/msPerDay)*1000; //this makes an artifical limit of 1000 events|phoneLocations per day

    function makeValues(index, x0, x1, y0, y1, t0, t1, t2, t3) {
      return `(@ph, {loc}, {x0}, {x1}, {y0}, {y1}, '{t0}', '{t1}', '{t2}', '{t3}')`.replace('{loc}', index)
        .replace('{x0}', x0).replace('{x1}',  x1).replace('{y0}', y0).replace('{y1}', y1)
        .replace('{t0}', t0).replace('{t1}', t1).replace('{t2}', t2).replace('{t3}', t3);
    } //makeValues 


    var day2 = addToDay(day, 22*60*60*1000);
    //console.log(day, day2);
    while (day.valueOf() < day2.valueOf()) {
      let
        x = -0.5 + Math.random(),
        y = 51.25 + Math.random()/2;
      if (values) { values += ','; }
      values += makeValues(index, x - 0.0001, x + 0.0001, y - 0.0001 , y + 0.0001, 
          day.toISOString().slice(0, -1), (day = addToDay(day, 2*60*60*1000 * Math.random())).toISOString().slice(0, -1),
          (day = addToDay(day, 10*60*60*1000 * Math.random())).toISOString().slice(0, -1),
          (day = addToDay(day, 2*60*60*1000 * Math.random())).toISOString().slice(0, -1));
      index++;
    }
    //values += ',' + makeValues(index, x0, x1, y0, y1, t0, t1, t2, t3);

    result += ` 
INSERT INTO PhoneLocations 
  (PhoneID, LocID, X0, X1, Y0, Y1, T0, T1, T2, T3)
VALUES
  {values};`.replace('{values}', values);
    return result;  
  } //makeDay

  var
    result = `
  INSERT INTO Phone
    (PhoneNum, HomeX, HomeY, WorkX, WorkY)
  VALUES
    (CONCAT('0700 ', {i}), -0.5 + RAND(), 51.25 + RAND()/2, -0.5 + RAND(), 51.25 + RAND()/2);
  SET @ph = LAST_INSERT_ID();  
  `.replace('{i}', 100000 + i).replace('{homeX}', homeX).replace('{homeY}', homeY).replace('{workX}', workX).replace('{workY}', workY);
  
  d = from;
  while (d <= to) {
    result += makeDay(d);
    d = addToDay(d, msPerDay);
  }
  return result;
} //insertPhone


function parallel(x, cb) {
  var
    ref = x.length;
  x.forEach(function(y, i, x) {
    if (typeof y == 'function') {
      y = y();
    }
    pool.query(y, function (error, results, fields) {
      if (error) {
        ref = 0; 
      }
      else {
        ref--;
      }
      if (ref <= 0) {
        cb(results); 
      }
    });
  });
} //parallel

function series(x, cb) {
  console.assert(Array.isArray(x));
  //console.group('series()');console.log(x);
  var 
    i = 0;
  
  function step(y) {
    //console.group('AsyncExec.series step');
   
    if (typeof y == 'function') {
      y = y();
    }
    pool.query(y, function (error, results, fields) {
      if (error) {
        i = x.length; 
      }
      else {
        i++;
      }
      if (i < x.length) {
        step(x[i]);
      }
      else {
        cb(error, results, fields, i); 
      }
      //console.log(error, results, fields);
    });
    //console.groupEnd();
  } //step
  
  step(x[i]);
  //console.groupEnd();
} //series     



function makeFew(a, b) {
  return function() {
    var result = '';
    for (i = a; i < b; i++) {
      result += insertPhone(i, new Date('2020-01-01'), new Date('2020-03-15'));
    }
    return result;
  };
} //makeFew

function makeMany(a, b) {
  var result = [];
  while (a < b) {
    result.push(makeFew(a, a + 10));
    a += 10;
  }
  return result;
} //makeMany


var x = [].concat(
  makeMany(0, 1000), 
  `SELECT COUNT(*) AS N FROM Phone;SELECT COUNT(*) AS N FROM PhoneLocations`
);

series(x, function(error, results, fields, index) {
  if (error) {
    //console.log(error, results, fields, index);
    console.log(error);
  }
  else {
    console.log('records created: ', results[0][0].N, results[1][0].N);
  }  
  pool.end(function (err) {
    console.log('dummy.js end.');
  });
});
console.log('dummy.js end script.');
