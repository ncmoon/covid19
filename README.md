# Tracking the spread of coronavirus COVID-19 using mobile phone metadata/GPS




## Privacy issues

Yes there are some!!


## Source data

For the purposes of this document I am assuming that access can be obtained to the entire mobile phone metadata/GPS records of an entire country. The UK, for example, has somewhat more mobile phones than people around 80 million phones for around 66 million people. 

TODO: 1:1 relationship between phones and people - however in many 3rd world countries may not be true.


Several organisations, potentially, hold such information. The phone companies keep metadata. The government's security services also collect and use this sort of information. The phone operating system owners (Apple/iOS and Google/Android) collect such data. Social networks (like facebook) are likely to be collecting this information. Other possible sources, might include fitness apps, or satnav applications.

To make this work, one would need data running over at least the last few weeks and preferably back to the time of the start of the outbreak. This might be considered to vary from country to country.

In addition, to mobile phone data, any software implementation would also need a list of phones belonging to anyone confirmed as having the virus. It would also be useful to have a list of anyone definitely cleared of the virus (the negative result is potentially useful as a way of ruling out some possibilities when trying to set probabilities of infection).


## Data format

I am going to assume that the source data might consist of a set of data records for each phone. Each record would be a single observation - with a time/date stamp and an approximate location.

TODO FIGURE 1 - draw as a directed single route of nodes/edges - over time and distance


![Fig 1]: (images/fig1.svg)




```
//data in JSON like format

rawPhoneData = {
  id: [
    {
      timestamp: '2020-01-01T00:00:01', long: 0.111, lat: 53.1234, //or other possible location data - mast, grid ref.
    },
    // ... more observations
  ],
  // ... more phones
}
```

Given say 50m phones, and maybe 100 samples per day, and say 100bytes per observation; the dataset would be about 50 * 100 * 100 MB, i.e 500GB per daya as plain text - say 45 TeraBytes for 3 months of data. If stored slightly more efficiently as 4 doubles (32bytes) , then around 14TB.

Stored in an SQL server would be 5 billion records per day or 450 billion for 90 days of data.

```
# SQL to pull out one phone's observation records
SELECT id, timestamp, lat, long FROM RawPhoneData WHERE id = 'phoneID' ORDER BY timestamp; 
```



## Pre-processing of data

The first step in processing data would probably be to aggregate together different sources, using the phone number, user email/google account or the phone's internal serial number (EMEI?).For the purposes of this discussion I am assuming this has already been done.

A first step in handling the data would be to convert from a list of observations at different points in time (and location) to a list with each entry having an approximate start and end at the same location. This would reduce the number of data-points but each entry would be slightly more complex.

TODO FIGURE 2 - convert FIG 1 to this format.

```
// in JSON like format
phoneData = {
  id: [
    {
      start: dt, end: dt, long: 0.111, lat: 53.123
    },
    // more observations
  ],
  //... more phones  
}
```

This dataset would, likely, be significantly smaller than the first. People (and their phones) spend many long hours in the same place, at home, at work, at school. For many/most? people there would be, perhaps two main locations for each data, and then a small number of other places in between: shops, restaurants, pubs, etc. So data entries might come down to somwhere like 2 to a dozen entries per day.

If we assume an average of 6 places per person/phone per day. Then this dataset comes down to (50m * 40 * 8 * 90) 1.4TB. Not too extreme.

#### Implementation

Basically read in 50m sets of records and then output. 

```
// in pseudo-code

function processRawPhone(phone) {
  var result = [];
  //work through data from oldest to newest
  //track first-last timestamp, for as long as the location stays the same.
  //push each location to the result, don't forget to also push the last one :-)

  return result;
}

var phoneData = rawPhoneData.map(processRawPhone);
```

TODO: refactor as an existing database, and then incrementally update from new raw data. 


## Finding close encounters

This can be done independently of other calculations 












