var express = require('express');
var router = express.Router();
var TeemoJS = require('TeemoJS');
var championJSON = require('./champions.json');
var apiImport = require('./APIKEY');
var api = TeemoJS(apiImport.key);

//summoner information
var summoner = {
    "profileIconId": null,
    "name": "",
    "summonerLevel": null,
    "accountId": null,
    "id": null,
    "revisionDate": null,
    "exists": false,
    "region": null
}

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

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: "LOLSTATS.GG"
    });
});

router.get('/summoner/lookup', function(req, res, next) {
    res.render('summoner', {
        summoner: summoner,
        title: summoner.name + " on " + summoner.region + " - LOLSTATS.GG",
        mastery: mastery,
        rankedInfo: rankedInfo,
        matches: matches
    });
});

function getsummonerID() {
    api.get(summoner.region, 'summoner.getBySummonerName', summoner.name)
        .then((data) => {
            //verifies that the summoner exists.
            if (data) {
                summoner.id = data.id;
                summoner.accountId = data.accountId;
                summoner.name = data.name;
                summoner.profileIconId = data.profileIconId;
                summoner.summonerLevel = data.summonerLevel;
                summoner.exists = true;
                //console.log(summoner.name + " has an id of " + summoner.accountId + ", a level of " + summoner.summonerLevel);
                getRecentGames();
                getHighestMastery();
                getRankedInfo();
            } else {
                summoner.exists = false;
                console.log("summoner does not exist" + summoner.exists);
            }
        })
        .then(console.log(".then test in getsummonerID"))
        .catch(error => console.log(error));
}

function getHighestMastery() {
    api.get(summoner.region, 'championMastery.getAllChampionMasteries', summoner.id)
        .then((data) => {
            mastery.championId = data[0].championId;
            mastery.championLevel = data[0].championLevel;
            mastery.championPoints = data[0].championPoints;
            for (var i = 0; i < Object.keys(championJSON.data).length; i++)
                if ((mastery.championId) === (championJSON.data[Object.keys(championJSON.data)[i]].id)) {
                    mastery.championName = championJSON.data[Object.keys(championJSON.data)[i]].name;
                    mastery.championTitle = championJSON.data[Object.keys(championJSON.data)[i]].title;
                }
        })
        .then(console.log(".then test in getHighestMastery"))
        .catch(error => console.log(error));
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
function getRecentGames() {
    api.get(summoner.region, 'match.getRecentMatchlist', summoner.accountId)
        .then((data) => {
            for (i = 0; i < matches.number; i++) {
                matches.ids[i] = data.matches[i].gameId;
                matches.roles[i] = data.matches[i].role;
                matches.lanes[i] = data.matches[i].lane;
                matches.queues[i] = data.matches[i].queue;
                matches.champions[i] = data.matches[i].champion;

            }
            // console.log("recent matches are \n" + matches.ids);
            // console.log("recent roles are \n" + matches.roles);
            // console.log("recent lanes are \n" + matches.lanes);
            // console.log("recent queue type are \n" + matches.queues);
            // console.log("recent champions played are \n" + matches.champions);
            for (i = 0; i < matches.number; i++) {
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
        })

        .catch(error => console.log(error));
}

function getMatchData() {
    for (var z = 0; z < matches.number; z++) {
        api.get(summoner.region, 'match.getMatch', matches.ids[z])
            .then((data) => {
                console.log("for match " + data.gameId + "(game number " + z + ") we have the data:");
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
}

router.post('/summoner/submit', function(req, res, next) {
    summoner.region = req.body.summRegion;
    summoner.name = req.body.summName;
    getsummonerID();
    res.redirect('/summoner/lookup');
});
//easyrıder
module.exports = router;
