# Tracking the spread of coronavirus COVID-19 using mobile phone metadata/GPS

The current coronavirus epidemic has brought into focus the difficulties of contact tracing when the number of cases becomes large.

In nerd-speak it doesn't scale well.

This document explores how one might automate contact tracing and also scale it up; perhaps to the entire population of the UK or the entire planet; probably, mainly, using data from mobile phone records. In this article, I have used numbers for the UK - population a little over 60 million. For the entire planet, 7 billion people with about half now having mobile phones, you'd need to multiply by between 50 to 100.  


## Data sources - Big Brothers

There are a number of big organisations that might just have the required data. These include:

* Mobile Phone Operators
* Government Security Services
* Phone OS suppliers (Google & Apple)
* Social/Mobile/App platforms (Microsoft, Facebook, Twitter)
* Other Apps or device provides (e.g. fitness trackers/apps)

This document refers to these as 'Big Brothers'. It is way out of the scope of this document to even begin to imagine how any of these Big Brothers might be persuaded to part with or share this information.

This does, of course, also raise a few privacy issues (No kidding!).


## Privacy issues

I am not going to spend time discussing privacy issues; mainly because it's not a technical issue. So let's just say it's somebody else's problem.

Possibly might expand this section if there are any obvious ways in which a software solution could limit the privacy issues.


## Source data

For the purposes of this document I am assuming that access can be obtained to the entire mobile phone metadata/GPS records of an entire country. The UK, for example, has somewhat more mobile phones than people around 80 million phones for around 66 million people. 

TODO: 1:1 relationship between phones and people - however in many 3rd world countries may not be true.


Several organisations, potentially, hold such information. The phone companies keep metadata. The government's security services also collect and use this sort of information. The phone operating system owners (Apple/iOS and Google/Android) collect such data. Social networks (like facebook) are likely to be collecting this information. Other possible sources, might include fitness apps, or satnav applications.

To make this work, one would need data running over at least the last few weeks and preferably back to the time of the start of the outbreak. This might be considered to vary from country to country.

In addition, to mobile phone data, any software implementation would also need a list of phones belonging to anyone confirmed as having the virus. It would also be useful to have a list of anyone definitely cleared of the virus (the negative result is potentially useful as a way of ruling out some possibilities when trying to set probabilities of infection).


## Data format

I am going to assume that the source data might consist of a set of data records for each phone. Each record would be a single observation - with a time/date stamp and an approximate location.

![Fig 1](images/fig1.svg)

*FIG 1 A raw phone record is assumed to be a sequence of timestamped events, each one will also include some position information.*






```
//data in JSON like format

rawPhoneData = {
  phoneID: [
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

The first step in processing data would probably be to aggregate together different sources, using the phone number, user email/google account or the phone's internal serial number (EMEI?). For the purposes of this discussion I am assuming this has already been done.

The next step in handling the data would be to convert from a list of observations at different points in time (and location) to a list with each entry having an approximate start and end at the same location. This would reduce the number of data-points but each entry would be slightly more complex.

![Fig 2](images/fig2.svg)

*FIG 2 Shows the same data as in FIG 1 but converted to a sequence of
locations. Each location now has a time period, here indicated by 
the blue line.*

In fact, the diagram above is not ideal. It was created by simply dividing the time between two event in different places in half. A better approach might be to calculate a sequence of time. The first possible time t0, that the phone could be at the location. The first moment in time, t1, when the phone was definitely at the location and, t2, the last time the phone was definitely at that location, and finally t3 the last moment the phone might have been at that location.

TODO: produce a chart with this

When doing calculations later, probabilities can be adjusted when looking at the overlap time between two phones. 




```
// in JSON like format
phoneData = {
  phoneID: [
    {
      x0: r, x1: r,  // bounding box of location derived from position 
      y0: r, y1: r,  // and some error estimate
      t0: ts, t1: ts, t2: ts, t3: ts 

    },
    // more observations
  ],
  //... more phones  
}
```

This dataset would, likely, be significantly smaller than the first. People (and their phones) spend many long hours in the same place, at home, at work, at school. For many/most? people there would be, perhaps two main locations for each day, and then a small number of other places in between: shops, restaurants, pubs, etc. So data entries might come down to somwhere like 2 to a dozen entries per day.

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

A close encounter is when two phones (and therefore two people) are in close proximity and for an overlapping period of time. It isn't a simple binary flag but is probably a number - in some way relating to the risk of cross-infection. The closer the proximity and the longer the time overlap, the higher the risk.  

Graphically, the phone data may be seen as millions of separate threads. Identifying a close encounter joins a node in one phone thread to a node in another. This large graph|net is the structure across which a virus can spread. 

The phone threads have an arrow of time, infection can only travel forwards in time. The encounters between phones do not have a time direction. Infection might go from A to B or from B to A.

NOTE: Looks a bit like a Feynman diagram. Two particles|phones which have time arrows are drawn as interacting, with an exchange particle. The exchange particle doesn't have a time arrow. Which in our case, means either person might infect the other.

Identifying close encounters is probably the largest challenge to be described here. For the
UK you might have 50 million phones and you might want to track back over a few months. That might imply 3 billion phone-days worth of records.









Close encounters can be found independently of other calculations. It needs to be done once before running other possible algorithms. It would only need to be recalculated when new 
data is added or old data is changed.

With an estimated 50m phones there are 50m * 50m (divided by 2) tests to run, ie.12.5*10^14 or 1,250,000,000,000,000. That's quite a big number. At 1 million comparisons a second it would take nearly 4 years.

TODO: Find MBR

So, instead, the data should be pre-processed to find candidates that might be worth comparing. Start by selecting a period of time - say 1 day. Then for each phone|person construct a bounding box. This would be from the start of the period of time to the end; from the westernmost point they travelled to the easternmost point; from the southernmost point to the northern most.


The result of this pre-filtering would be up to 50m sets of results, each set would consist of 1 main phone and it's bounding box and then one or more phones that have bounding boxes that overlap this one.

NOTE: As described this would lead to redundant checks as phone A would compared with phone B and then later B would be compared with A. TODO: find a fix for this.

For the primary phone and for each of the others, now compare each data point and see if there is any overlap. If found assign it a value.

#### Incremental Implementation

Finding 'close encounters' is likely to be computationally intensive and might go up as the square of the number of phone records. This section describes an attempt to implement incrementally, so does not need to be re-run from scratch when new data is added.

If we start with 0 records and we add a single record. As there are no records this is a simple and quick process - just add the record. The second record needs to be compared with all 1 records already in the system. As you add more records the number grows, until each new phone record added, has to be compared with 50 million others.

However, that is perhaps misleading, in most cases adding a new phone would only require comparing the new phone with a few hundred or a few thousand phones that have been in the same areas. The number of phones a phone has come close to in a given period is fairly constant whether you are handling 50 thousand or 50 million. 

The workload stays the same - the difficulty is in filtering out the distant phones and only having to perform the calculation on the potential matches. Fortunately databases with indexes can do this sort of thing in log(n) time. 

So I am going to assume the data is in an SQL database (non SQL might also work). For each phone we have a list of locations. Each location would be in 3 dimensions x, y, t. Lets also assume that we have defined a bounding box that runs from the start time to the end time and from the min-max positions in the x and y directions. This would be be the following data points: x0,y0,t0,x1,y1,t1.

This might exist in a data table 'PhoneLocations', like:

| PhoneID* | LocID* | X0 | X1 | Y0 | Y1 | T0 | T1 | T2 | T3 |
| -------  | ------ | ---| ---| ---| ---| ---| ---| ---| ---|

When adding a new phone, you would run over all the locations for that phone, and for each location, select matching locations in the database.

```
SELECT
  * 
FROM 
  PhoneLocations 
WHERE
  (X0 <= x1 AND X1 >= x0) AND (Y0 <= y1 AND Y1 >= y0) 
  AND (T0 <= t3 AND T3 >= t0)
```

Some databases support geographic coding that might speed this up. 

Each record returned is a CloseEncounter but so,far with no ~~probability~~ ranking attached. It would be quite feasible to insert them with no value (NULL) and then leave another process to figure out the ~~probability~~ ranking.

The 'CloseEncounters' table might look like:

| PhoneID1 | LocID1 | PhoneID2 | LocID2 | Rank |
| -------- | ------ | -------- | ------ |----- |
| 123456   | 1234   | 123457   | 1212   | NULL |
| 234567   | 2345   | 234568   | 2222   | 0.01 |

Calculating the rank might be based on the length of time of overlap, and
the likely closeness of the phones. The spatial values are likely to be
different in this respect to the time measurement. 








## Algorithm - Assigning probability of infection to each phone




#### Using negative results

Negative test results are, potentially, a useful source of new data. If someone tests negative, then they haven't got the virus, they didn't have it at any location/close encounter in the past. They hven't passed the virus on to anyone and haven't got the virus from anyone. This means that their phone record can be forcefully zero'ed out for all past locations. This has the effect of creating a barrier in the large graph|net constructed. The negative tests mean at no point has the virus crossed from one phone|person to another via this phone.

NOTE: All of that is based on the assumption that the test doesn't produce a huge number of false
negative results.



## Algorithm - Identifying hidden carriers

At this point we should have a graph/net made up of 50m separate phone data threads running over an extended period of time (several weeks). These are cross-linked with the 'close encounters' found earlier.

This large graph has now been decorated with, all the known infected cases and all the known negative tests. This is hard data. There is also now a set of probabilities estimating the likelihood of any one individual being infected (and/or having become infected at some location). This might be thought of as soft data - and will change the next time calculations are run. 

Note: that this tree of probabilities runs downstream, going from an event in the past to later events in the now or the future.

This algorithm will atttempt to go in the opposite direction - upstream - building a tree of possible infection sources for an identified infected person. The infected person is used to identify their phone. Each location (location == a set of close encounters) prior to the positive test result, increases the number of possible sources.

The total of all these separate possibilities should add up to 1. (Ignoring the remote option of 
someone being infected twice.) So we take the total probabilitiy of 1 and we smear it across all 
the known close encounters running back over a number of days. With a preference for longer|closer
encounters and with a higher likelihood around 3 or 4 days before the first onset of symptoms.

For each new case, without a known origin, would check that phone, would assign probabilities to say 40+ locations, and maybe 400+ close encounters, made over the last few weeks. The process could then be repeated for each of these contacts, and possibly again.  

Now for each friend and friend of friend and so on, compare the probability of being the source of an infection with the probability of having been infected - from an earlier algorithm.

Where the probability of being infected is a bit higher - this should increase the probability that this is the source. This part of the algorithm might be re-run multiple times, reusing the newer probabilities, until it homes in on a likely result.


























