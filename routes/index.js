var express = require('express');
var router = express.Router();
var TeemoJS = require('TeemoJS');
var championJSON = require('./champions.json');
var apiImport = require('./APIKEY');
var api = TeemoJS(apiImport.key);


//**********************//
//      VARIABLES       //
//**********************//

var summoner = {};

var title = "Access Denied";


//stores information about the last 10 matches
var matches = {};


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

var mastery = {
    championId: "",
    championLevel: "",
    championPoints: "",
    championName: "",
    championTitle: ""
};

var rankedInfo = {};


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



var testFormIn = "";


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


async function getHighestMastery(summonerRegion, summonerID) {
    var masteryData = {};
    var data = await api.get(summonerRegion, 'championMastery.getAllChampionMasteries', summonerID)
        .then((data) => {
            masteryData.championId = data[0].championId;
            masteryData.championLevel = data[0].championLevel;
            masteryData.championPoints = data[0].championPoints;
            for (var i = 0; i < Object.keys(championJSON.data).length; i++)
                if ((masteryData.championId) === (championJSON.data[Object.keys(championJSON.data)[i]].id)) {
                    masteryData.championName = championJSON.data[Object.keys(championJSON.data)[i]].name;
                    masteryData.championTitle = championJSON.data[Object.keys(championJSON.data)[i]].title;
                }
        })
        .catch(error => console.log(error));
    console.log("\ngetHighestMastery complete\n");
    return masteryData;
}


//gets players recent games
async function getRecentGames(summonerRegion, summonerAccID, noOfGames) {
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
        "championCount": [],
        "matchData": []
    };
    var totalWins = 0;
    console.log("getRecentGames called with : " + summonerRegion + " " + summonerAccID + " " + noOfGames);
    var data = await api.get(summonerRegion, 'match.getRecentMatchlist', summonerAccID)
        .then(async (data) => {
            for (i = 0; i < noOfGames; i++) {
                if (data.matches[i].queue === 400 || data.matches[i].queue === 420 || data.matches[i].queue === 430 || data.matches[i].queue === 440) {
                recentGamesData.ids[i] = data.matches[i].gameId;
                recentGamesData.roles[i] = data.matches[i].role;
                recentGamesData.lanes[i] = data.matches[i].lane;
                recentGamesData.queues[i] = data.matches[i].queue;
                recentGamesData.champions[i] = data.matches[i].champion;
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
                recentGamesData.matchData[i] = await getMatchData(summonerRegion, data.matches[i].gameId)
                if (recentGamesData.matchData[i].outcome === "WIN") {
                    totalWins++;
                }
            }
        }
            recentGamesData.modePosition = mostCommon(recentGamesData.actualPosition);
            recentGamesData.modeChampion = mostCommon(recentGamesData.champions);
            recentGamesData.actualpositionCount = countValuesIn(recentGamesData.actualPosition, defaultPositionObj);
            recentGamesData.championCount = countValuesIn(recentGamesData.champions, defaultChampionObj);
            recentGamesData.winRatio = (totalWins / noOfGames).toFixed(2) * 100;
            console.log("win ratio is " + recentGamesData.winRatio);
            console.log("\ngetRecentGames complete\n");
        })
        .catch(error => console.log(error));
    return recentGamesData;
}

async function getMatchData(summonerRegion, matchID) {
    var participantIDExt;
    var outputString;
    var output = {
        "matchLength": null,
        "kills": null,
        "deaths": null,
        "assists": null,
        "kdaRatio": null,
        "outcome": "",
        "visionScore": null,
        "goldEarned": null,
        "totalDamageDealtToChampions": null,
        "magicDamageDealtToChampions": null,
        "physicalDamageDealtToChampions": null,
        "trueDamageDealtToChampions": null,
        "damageDealtToObjectives": null,
        "damageDealtToTurrets": null,
        "turretKills": null,
        "inhibitorKills": null,
        "totalMinionsKilled": null,
        "neutralMinionsKilled": null,
        "neutralMinionsKilledTeamJungle": null,
        "neutralMinionsKilledEnemyJungle": null,
        "csDiff": null,
        "csPerMin": null,
        "visionWardsBoughtInGame": null,
        "wardsPlaced": null,
        "wardsKilled": null
    };
    console.log("test boi");
    var data = await api.get(summonerRegion, 'match.getMatch', matchID)
        .then((data) => {
            output.matchLength = data.gameDuration;
            for (var i = 0; i < Object.keys(data.participantIdentities).length; i++) {
                if (data.participantIdentities[i].player.accountId === summoner.accountId) {
                    participantIDExt = data.participantIdentities[i].participantId;
                    for (var j = 0; j < Object.keys(data.participants).length; j++) {
                        if (data.participants[j].participantId === participantIDExt) {
                            output.kills = data.participants[j].stats.kills;
                            output.deaths = data.participants[j].stats.deaths;
                            var ratioDeaths = data.participants[j].stats.deaths;
                            output.assists = data.participants[j].stats.assists;
                            if(ratioDeaths === 0){
                                ratioDeaths = 1;
                            }
                            output.kdaRatio = ((data.participants[j].stats.kills + data.participants[j].stats.assists) / ratioDeaths).toFixed(2);
                            if (data.participants[j].stats.win === true) {
                                output.outcome = "WIN";
                            } else {
                                output.outcome = "LOSE";
                            }
                            output.visionScore = data.participants[j].stats.visionScore;
                            output.goldEarned = data.participants[j].stats.goldEarned;
                            output.totalDamageDealtToChampions = data.participants[j].stats.totalDamageDealtToChampions;
                            output.magicDamageDealtToChampions = data.participants[j].stats.magicDamageDealtToChampions;
                            output.physicalDamageDealtToChampions = data.participants[j].stats.physicalDamageDealtToChampions;
                            output.trueDamageDealtToChampions = data.participants[j].stats.trueDamageDealtToChampions;
                            output.damageDealtToObjectives = data.participants[j].stats.damageDealtToObjectives;
                            output.damageDealtToTurrets = data.participants[j].stats.damageDealtToTurrets;
                            output.turretKills = data.participants[j].stats.turretKills;
                            output.inhibitorKills = data.participants[j].stats.inhibitorKills;
                            output.totalMinionsKilled = data.participants[j].stats.totalMinionsKilled;
                            output.neutralMinionsKilled = data.participants[j].stats.neutralMinionsKilled;
                            output.neutralMinionsKilledTeamJungle = data.participants[j].stats.neutralMinionsKilledTeamJungle;
                            output.neutralMinionsKilledEnemyJungle = data.participants[j].stats.neutralMinionsKilledEnemyJungle;
                            if (data.participants[j].timeline.csDiffPerMinDeltas){
                                output.csDiff = (data.participants[j].timeline.csDiffPerMinDeltas["0-10"]).toFixed(2);
                            } else {
                                output.csDiff = (data.participants[j].timeline.creepsPerMinDeltas["0-10"]).toFixed(2);
                            }
                            output.visionWardsBoughtInGame = data.participants[j].stats.visionWardsBoughtInGame;
                            output.wardsPlaced = data.participants[j].stats.wardsPlaced;
                            output.wardsKilled = data.participants[j].stats.wardsKilled;
                            output.csPerMin = ((data.participants[j].stats.totalMinionsKilled / data.gameDuration) * 60).toFixed(2);
                        }
                    }
                }
            }
        })
        .catch(error => console.log(error));
    return output;
    return outputString;
    //console.log("\ngetMatchData complete\n");
}

async function getRankedInfo(summonerRegion, summonerID) {
    var dataRanked = {};
    var data = await api.get(summonerRegion, 'league.getAllLeaguePositionsForSummoner', summonerID)
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
    if (summoner.exists) {
        mastery = await getHighestMastery(summonerRegion, summoner.id);
        matches = await getRecentGames(summonerRegion, summoner.accountId, 10);
        rankedInfo = await getRankedInfo(summonerRegion, summoner.id);
        console.log(matches);
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
router.post('/summoner/submit', async function(req, res, next) {
    summoner.region = req.body.summRegion;
    summoner.name = req.body.summName;
    if (summoner.name) {
        title = summoner.name + " on " + summoner.region + " - LOLSTATS.GG";
    }
    var x = retreiveData(summoner.region, summoner.name);
    x.then((testVar) => {
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
