var express = require('express');
var router = express.Router();
var TeemoJS = require('TeemoJS');
var championJSON = require('./champions.json');
var apiImport = require('./APIKEY');
var api = TeemoJS(apiImport.key);


//**********************//
//      VARIABLES       //
//**********************//

//summoner information
 // var summoner = {
 //    "profileIconId": null,
 //    "name": "",
 //    "summonerLevel": null,
 //    "accountId": null,
 //    "id": null,
 //    "revisionDate": null,
 //    "exists": false,
 //    "region": null
//}
var summoner = {};

var summonerAsyncTest = {
    "profileIconId": null,
    "name": "",
    "summonerLevel": null,
    "accountId": null,
    "id": null,
    "revisionDate": null,
    "exists": false,
    "region": null
}
var title = "no";
//champion mastery
var summonerMastery;

//recent game information:
//number of most recent matches to search

//stores information about the last 10 matches
var matches = {
    "number": 10, //number of recent matches to go through
    "ids": [], //ids of the matches
    "lanes": [], //lanes played
    "roles": [], //roles played
    "queues": [], //queue type
    "champions": [], //champions played
    "actualPosition": [], //finding the actual position
    "actualpositionCount": [], //counts actual position occurrences
    "modePosition": "", //most common position
    "modeChampion": "", //most common champion
    "championCount": []
}

//default positions object - stops errors
var defaultPositionObj = {
    "TOP": 0,
    "JUNGLE": 0,
    "MID": 0,
    "ADC": 0,
    "SUPPORT": 0
}

var defaultChampionObj = {

}
var matchData = {
    "kills": "",
    "deaths": "",
    "assists": ""
}

var mastery = {
    championId: "",
    championLevel: "",
    championPoints: "",
    championName: "",
    championTitle: ""
};

var rankedInfo = {
    wins: null,
    losses: null,
    totalGamesRanked: null,
    winRateRanked: null,
    leagueName: null,
    rank: null,
    tier: null,
    leaguePoints: null
};

var rankedReset = {
    wins: null,
    losses: null,
    totalGamesRanked: null,
    winRateRanked: null,
    leagueName: null,
    rank: null,
    tier: null,
    leaguePoints: null
};

//for checking if a summoner exists
var success;
//more test stuff
var testMatch = [];
var partID;
var matchDataList = {
    "match0": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
    "match1": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
    "match2": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
    "match3": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
    "match4": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
    "match5": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
    "match6": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
    "match7": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
    "match8": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
    "match9": {
        "kills": "",
        "deaths": "",
        "assists": ""
    },
}

var testFormIn = "";

let promiseID = function() {
    return new Promise(function(resolve, reject) {
        resolve('promiseID done');
    });
};

let promiseMastery = function() {
    return new Promise(function(resolve, reject) {
        resolve('promiseMastery done');
    });
};

let promiseMatchData = function(){
    return new Promise(function(resolve, reject) {
        setTimeout(function () {
        resolve('promiseMatchData done');
    }, 3000);
    });
};
let promiseRankedData = function() {
    return new Promise(function(resolve, reject) {
        resolve('promiseRankedData done');
    });
};


//**********************//
//      FUNCTIONS       //
//**********************//

async function getSummonerIDAsync(summonerRegion, summonerName) {
    var data = await api.get(summonerRegion, 'summoner.getBySummonerName', summonerName);
    var dataSummoner = {};
    if (data) {
        console.log("data stuff: name: " + data.name + " id: " + data.id + " accountId: " + data.accountId);
        dataSummoner.id = data.id;
        dataSummoner.accountId = data.accountId;
        dataSummoner.name = data.name;
        dataSummoner.profileIconId = data.profileIconId;
        dataSummoner.summonerLevel = data.summonerLevel;
        dataSummoner.exists = true
        console.log("\n\ngetSummonerIDAsync complete and exists\n\n");
    } else {
        dataSummoner.exists = false;
        console.log("summoner does not exist" + dataSummoner.exists);
        console.log("\n\ngetSummonerID complete and doesnt exist\n\n");
    }
    console.log("dataSummoner");
    console.log(dataSummoner);
    return dataSummoner;
}



function getHighestMastery(summonerRegion, summonerID) {
    var dataMastery = {};
    api.get(summonerRegion, 'championMastery.getAllChampionMasteries', summonerID)
        .then((data) => {
            dataMastery.championId = data[0].championId;
            dataMastery.championLevel = data[0].championLevel;
            dataMastery.championPoints = data[0].championPoints;
            for (var i = 0; i < Object.keys(championJSON.data).length; i++)
                if ((dataMastery.championId) === (championJSON.data[Object.keys(championJSON.data)[i]].id)) {
                    dataMastery.championName = championJSON.data[Object.keys(championJSON.data)[i]].name;
                    dataMastery.championTitle = championJSON.data[Object.keys(championJSON.data)[i]].title;
                }
            console.log("\n\ngetHighestMastery complete and valid\n\n");
        })
        .catch(error => console.log(error));
    return dataMastery;
}

function countValuesIn(array, defaultObject) {
    var occurrences = defaultObject || {};
    for (var i = 0, j = array.length; i < j; i++) {
        occurrences[array[i]] = (occurrences[array[i]] || 0) + 1;
    }
    return occurrences;
}

function mostCommon(array) {
    if (array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0],
        maxCount = 1;
    for (var i = 0; i < array.length; i++) {
        var el = array[i];
        if (modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;
        if (modeMap[el] > maxCount) {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}
//gets players recent games
function getRecentGames(summonerRegion, summonerAccID, noOfGames) {
    api.get(summonerRegion, 'match.getRecentMatchlist', summonerAccID)
        .then((data) => {
            for (i = 0; i < noOfGames; i++) {
                matches.ids[i] = data.matches[i].gameId;
                matches.roles[i] = data.matches[i].role;
                matches.lanes[i] = data.matches[i].lane;
                matches.queues[i] = data.matches[i].queue;
                matches.champions[i] = data.matches[i].champion;

            }
            for (i = 0; i < noOfGames; i++) {
                //console.log("role: " + matches.roles[i] + " lane: " + matches.lanes[i]);
                if (matches.roles[i] === "SOLO" || matches.roles[i] === "DUO" || matches.roles[i] === "NONE") {
                    if (matches.lanes[i] === "TOP") {
                        matches.actualPosition[i] = "TOP";
                    } else if (matches.lanes[i] === "MID") {
                        matches.actualPosition[i] = "MID";
                    } else if (matches.lanes[i] === "JUNGLE") {
                        matches.actualPosition[i] = "JUNGLE";
                    }
                } else if (matches.roles[i] === "DUO_CARRY") {
                    matches.actualPosition[i] = "ADC";
                } else if (matches.roles[i] === "DUO_SUPPORT") {
                    matches.actualPosition[i] = "SUPPORT";
                }
                //console.log(matches.actualPosition[i] + " in game " + i);
            }
            matches.modePosition = mostCommon(matches.actualPosition);
            matches.modeChampion = mostCommon(matches.champions);
            matches.actualpositionCount = countValuesIn(matches.actualPosition, defaultPositionObj);
            matches.championCount = countValuesIn(matches.champions, defaultChampionObj);
            //console.log(matches.championCount);
            getMatchData();
            console.log("\n\ngetRecentGames complete and valid\n\n");
        })

        .catch(error => console.log(error));
}

function getMatchData() {
    for (var i = 0; i < matches.number; i++) {
        api.get(summoner.region, 'match.getMatch', matches.ids[i])
            .then((data) => {
                console.log("for match " + data.gameId + "(game number " + i + ") we have the data:");
                for (var j = 0; j < Object.keys(data.participantIdentities).length; j++) {
                    if (data.participantIdentities[j].player.accountId === summoner.accountId) {
                        partID = data.participantIdentities[j].participantId;
                        console.log("partID is: " + partID);
                        console.log("name is " + data.participantIdentities[j].player.summonerName);
                        for (var k = 0; k < Object.keys(data.participants).length; k++) {
                            if (data.participants[k].participantId === partID) {
                                console.log("KILLS: " + data.participants[k].stats.kills);
                                console.log("DEATHS: " + data.participants[k].stats.deaths);
                                console.log("ASSISTS: " + data.participants[k].stats.assists);
                            }
                        }
                    }
                }

            })
    }
    console.log("\n\ngetMatchData complete and valid\n\n");
    console.log(matchDataList);
}

function getRankedInfo() {
    api.get(summoner.region, 'league.getAllLeaguePositionsForSummoner', summoner.id)
        .then((data) => {
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].queueType === "RANKED_SOLO_5x5") {
                        rankedInfo.wins = data[i].wins;
                        rankedInfo.losses = data[i].losses;
                        rankedInfo.leagueName = data[i].leagueName;
                        rankedInfo.rank = data[i].rank;
                        rankedInfo.tier = data[i].tier;
                        rankedInfo.leaguePoints = data[i].leaguePoints;
                        rankedInfo.totalGamesRanked = rankedInfo.wins + rankedInfo.losses;
                        rankedInfo.winRateRanked = ((rankedInfo.wins / rankedInfo.totalGamesRanked) * 100).toFixed(2);
                        //console.log(data[i].queueType);
                    } else {
                        rankedInfo = rankedReset;
                    }
                }
            }
            if (data.length === 0) {
                rankedInfo = rankedReset;
            }
        })
    console.log("\n\ngetRankedInfo complete and valid\n\n");
}


//**********************//
//       ROUTING        //
//**********************//

//HOMEPAGEs
router.get('/', function(req, res, next) {
    res.render('index', {
        title: "LOLSTATS.GG"
    });
});

//GET DATA FROM FORM AND REDIRECT
router.post('/summoner/submit', async function(req, res, next) {
    summoner.region = req.body.summRegion;
    summoner.name = req.body.summName;
    summoner = await getSummonerIDAsync(summoner.region, summoner.name);
    console.log("summoner is");
    console.log(summoner);
    if (summoner.name) {
        title = summoner.name + " on " + summoner.region + " - LOLSTATS.GG";
    }
    Promise.all([promiseID(), promiseMastery(), promiseMatchData(), promiseRankedData()]).then(function() {
        console.log("all done!");
        res.redirect('/summoner/lookup');
    });
});


//DATA DISPLAY PAGE
router.get('/summoner/lookup', function(req, res, next) {
    res.render('summoner', {
        summoner: summoner,
        title,
        mastery: mastery,
        rankedInfo: rankedInfo,
        matches: matches
    });
});

router.get('/summoner/', function(req, res, next) {
    res.redirect('/');
});

router.post('/test/submit', function(req, res, next) {
    testFormIn = req.body.testIn;
    res.redirect('/test/letsgo');
});

router.get('/test/letsgo', function(req, res, next) {
    res.render('test', {
        title: "test title",
        testFormIn
    });
});

module.exports = router;
