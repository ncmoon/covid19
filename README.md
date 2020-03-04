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


![Fig 1]: (/images/fig1.svg)




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

The first step in processing data would probably be to aggregate together different sources, using the phone number, user email/google account or the phone's internal serial number (EMEI?). For the purposes of this discussion I am assuming this has already been done.

The next step in handling the data would be to convert from a list of observations at different points in time (and location) to a list with each entry having an approximate start and end at the same location. This would reduce the number of data-points but each entry would be slightly more complex.

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

A close encounter is when two phones (and therefore two people) are in close proximity and for an overlapping period of time. It isn't a simple binary flag but is probably a number - in some way relating to the risk of cross-infection. The closer the proximity and the longer the time overlap, the higher the risk.  

Close encounters can be found independently of other calculations. It needs to be done once before
running other possible algorithms. It would only need to be recalculated when new data is added or old
data is changed.

With an estimated 50m phones there are 50m * 50m (divided by 2) tests to run, ie.12.5*10^14 or 1,250,000,000,000,000. That's quite a big number. At 1 million comparisons a second it would take nearly 4 years.

TODO: Find MBR

So, instead, the data should be pre-processed to find candidates that might be worth comparing. Start by selecting a period of time - say 1 day. Then for each phone|person construct a bounding box. This would be from the start of the period of time to the end; from the westernmost point they travelled to the easternmost point; from the southernmost point to the northern most.


The result of this pre-filtering would be up to 50m sets of results, each set would consist of 1 main phone and it's bounding box and then one or more phones that have bounding boxes that overlap this one.

NOTE: As described this would lead to redundant checks as phone A would compared with phone B and then later B would be compared with A. TODO: find a fix for this.

For the primary phone and for each of the others, now compare each data point and see if there is any overlap. If found assign it a value.



NOTE: Looks like a Feynman diagram. Two particles|phones which have time arrows are drawn as interacting, with an exchange particle. The exchange particle doesn't have a time arrow. Which in our case, means either person might infect the other.




### Algorithm - Assigning probability of infection to each phone




#### Using negative results

Negative test results are, potentially, a useful source of new data. If someone tests negative, then they haven't got the virus, they didn't have it at any location/close encounter in the past. They hven't passed the virus on to anyone and haven't got the virus from anyone. This means that their phone record can be forcefully zero'ed out for all past locations. This has the effect of creating a barrier in the large graph|net constructed. The negative tests mean at no point has the virus crossed from one phone|person to another via this phone.

NOTE: All of that is based on the assumption that the test doesn't produce a huge number of false
negative results.



### Algorithm - Identifying hidden carriers

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


























