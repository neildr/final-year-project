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

var testMatches = {
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

var testMastery = {
    championId: "",
    championLevel: "",
    championPoints: "",
    championName: "",
    championTitle: ""
};

var testMastery2 = {
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


let promiseTest;

//**********************//
//      FUNCTIONS       //
//**********************//


function getSummonerID(summonerRegion, summonerName) {
    return new Promise((resolve, reject) => {
        var dataSummoner = {};
        api.get(summonerRegion, 'summoner.getBySummonerName', summonerName)
            .then((data) => {
                if (data) {
                    //console.log("data stuff: name: " + data.name + " id: " + data.id + " accountId: " + data.accountId);
                    dataSummoner.id = data.id;
                    dataSummoner.accountId = data.accountId;
                    dataSummoner.name = data.name;
                    dataSummoner.profileIconId = data.profileIconId;
                    dataSummoner.summonerLevel = data.summonerLevel;
                    dataSummoner.exists = true;
                    dataSummoner.region = summonerRegion;
                    console.log("\ngetSummonerID complete and exists\n");
                } else {
                    dataSummoner.exists = false;
                    console.log("\ngetSummonerID complete and doesnt exist\n");
                }
                resolve(dataSummoner);
            })
            .catch(error => console.log(error));
    })

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
        })
        .catch(error => console.log(error));
    console.log("\ngetHighestMastery complete\n");
    return dataMastery;
}


//gets players recent games
function getRecentGames(summonerRegion, summonerAccID, noOfGames) {
    var recentGamesData = {
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
    };
    console.log("getRecentGames called with : " + summonerRegion + " " + summonerAccID + " " + noOfGames);
    api.get(summonerRegion, 'match.getRecentMatchlist', summonerAccID)
        .then((data) => {
            for (i = 0; i < noOfGames; i++) {
                recentGamesData.ids[i] = data.matches[i].gameId;
                recentGamesData.roles[i] = data.matches[i].role;
                recentGamesData.lanes[i] = data.matches[i].lane;
                recentGamesData.queues[i] = data.matches[i].queue;
                recentGamesData.champions[i] = data.matches[i].champion;

            }
            for (i = 0; i < noOfGames; i++) {
                if (recentGamesData.roles[i] === "SOLO" || recentGamesData.roles[i] === "DUO" || recentGamesData.roles[i] === "NONE") {
                    if (recentGamesData.lanes[i] === "TOP") {
                        recentGamesData.actualPosition[i] = "TOP";
                    } else if (recentGamesData.lanes[i] === "MID") {
                        recentGamesData.actualPosition[i] = "MID";
                    } else if (recentGamesData.lanes[i] === "JUNGLE") {
                        recentGamesData.actualPosition[i] = "JUNGLE";
                    }
                } else if (recentGamesData.roles[i] === "DUO_CARRY") {
                    recentGamesData.actualPosition[i] = "ADC";
                } else if (recentGamesData.roles[i] === "DUO_SUPPORT") {
                    recentGamesData.actualPosition[i] = "SUPPORT";
                }
                //console.log(recentGamesData.actualPosition[i] + " in game " + i);
            }
            recentGamesData.modePosition = mostCommon(recentGamesData.actualPosition);
            recentGamesData.modeChampion = mostCommon(recentGamesData.champions);
            recentGamesData.actualpositionCount = countValuesIn(recentGamesData.actualPosition, defaultPositionObj);
            recentGamesData.championCount = countValuesIn(recentGamesData.champions, defaultChampionObj);
            //console.log(recentGamesData);
            getMatchData(summonerRegion, recentGamesData.ids, noOfGames);
            console.log("\ngetRecentGames complete\n");

        })
        .catch(error => console.log(error));
    return recentGamesData;
}

function getMatchData(summonerRegion, matchIDs, noOfGames) {
    for (var i = 0; i < noOfGames; i++) {
        api.get(summonerRegion, 'match.getMatch', matchIDs[i])
            .then((data) => {
                for (var j = 0; j < Object.keys(data.participantIdentities).length; j++) {
                    if (data.participantIdentities[j].player.accountId === summoner.accountId) {
                        partID = data.participantIdentities[j].participantId;
                        for (var k = 0; k < Object.keys(data.participants).length; k++) {
                            if (data.participants[k].participantId === partID) {
                                console.log("KILLS: " + data.participants[k].stats.kills + "DEATHS: " + data.participants[k].stats.deaths + "ASSISTS: " + data.participants[k].stats.assists);
                            }
                        }
                    }
                }

            })
    }
    console.log("\ngetMatchData complete\n");
}

function getRankedInfo(summonerRegion, summonerID) {
    var dataRanked = {};
    api.get(summonerRegion, 'league.getAllLeaguePositionsForSummoner', summonerID)
        .then((data) => {
            for (var i = 0; i < data.length; i++) {
                if (data[i].queueType === "RANKED_SOLO_5x5") {
                    dataRanked.wins = data[i].wins;
                    dataRanked.losses = data[i].losses;
                    dataRanked.leagueName = data[i].leagueName;
                    dataRanked.rank = data[i].rank;
                    dataRanked.tier = data[i].tier;
                    dataRanked.leaguePoints = data[i].leaguePoints;
                    dataRanked.totalGamesRanked = dataRanked.wins + dataRanked.losses;
                    dataRanked.winRateRanked = ((dataRanked.wins / dataRanked.totalGamesRanked) * 100).toFixed(2);
                    console.log("\n\ngetRankedInfo complete and valid\n\n");
                    console.log(dataRanked);
                }
            }
            if (data.length === 0) {
                rankedInfo = rankedReset;
            }
        })
        .catch(error => console.log(error));
    console.log("\ngetRankedInfo complete\n");
    return dataRanked;
}

async function retreiveData(summonerRegion, summonerName) {
    summoner = await getSummonerID(summonerRegion, summonerName);
    summoner.name = summonerName;
    summoner.region = summonerRegion;
    console.log("summoner");
    console.log(summoner);
    if (summoner.exists) {
        mastery = await getHighestMastery(summonerRegion, summoner.id);
        console.log("mastery");
        console.log(mastery);
        matches = await getRecentGames(summonerRegion, summoner.accountId, 10);
        console.log("matches");
        console.log(matches);
        rankedInfo = await getRankedInfo(summonerRegion, summoner.id);
        console.log("rankedInfo");
        console.log(rankedInfo);
        console.log("calls done");
    }
    return "done";
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
router.post('/summoner/submit', function(req, res, next) {
    summoner.region = req.body.summRegion;
    summoner.name = req.body.summName;
    if (summoner.name) {
        title = summoner.name + " on " + summoner.region + " - LOLSTATS.GG";
    }
    var x = retreiveData(summoner.region, summoner.name);
    console.log("x is:");
    console.log(x);
    x.then((testVar) => {
        console.log("test var: " + testVar);
        setTimeout(function() {
            console.log("summoner after 5s");
            console.log(summoner);
            console.log("mastery after 5s");
            console.log(mastery);
            console.log("matches after 5s");
            console.log(matches);
            console.log("rankedInfo after 5s");
            console.log(rankedInfo);
        }, 5000);
        res.redirect('/summoner/lookup');
    })
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
