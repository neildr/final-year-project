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

var mastery = {};

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
        var summonerData = {};
        api.get(summonerRegion, 'summoner.getBySummonerName', summonerName)
            .then((data) => {
                if (data) {
                    summonerData.id = data.id;
                    summonerData.accountId = data.accountId;
                    summonerData.name = data.name;
                    summonerData.profileIconId = data.profileIconId;
                    summonerData.summonerLevel = data.summonerLevel;
                    summonerData.exists = true;
                    summonerData.region = summonerRegion;
                } else {
                    summonerData.exists = false;
                }
                resolve(summonerData);
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
        "matchData": [],
        "averages": {
            "kills": 0,
            "deaths": 0,
            "assists": 0,
            "kdaRatio": 0,
            "visionScore": 0,
            "goldEarned": 0,
            "totalDamageDealtToChampions": 0,
            "magicDamageDealtToChampions": 0,
            "physicalDamageDealtToChampions": 0,
            "trueDamageDealtToChampions": 0,
            "damageDealtToObjectives": 0,
            "damageDealtToTurrets": 0,
            "turretKills": 0,
            "inhibitorKills": 0,
            "totalMinionsKilled": 0,
            "neutralMinionsKilled": 0,
            "neutralMinionsKilledTeamJungle": 0,
            "neutralMinionsKilledEnemyJungle": 0,
            "csDiff": 0,
            "csPerMin": 0,
            "visionWardsBoughtInGame": 0,
            "wardsPlaced": 0,
            "wardsKilled": 0
        }
    };
    var totalWins = 0;
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
            for (var i = 0; i < noOfGames; i++){
                recentGamesData.averages.kills += ((recentGamesData.matchData[i].kills) / noOfGames);
                recentGamesData.averages.deaths += ((recentGamesData.matchData[i].deaths) / noOfGames);
                recentGamesData.averages.assists += ((recentGamesData.matchData[i].assists) / noOfGames);
                recentGamesData.averages.kdaRatio += ((recentGamesData.matchData[i].kdaRatio) / noOfGames);
                recentGamesData.averages.visionScore += ((recentGamesData.matchData[i].visionScore) / noOfGames);
                recentGamesData.averages.goldEarned += ((recentGamesData.matchData[i].goldEarned) / noOfGames);
                recentGamesData.averages.totalDamageDealtToChampions += ((recentGamesData.matchData[i].totalDamageDealtToChampions) / noOfGames);
                recentGamesData.averages.magicDamageDealtToChampions += ((recentGamesData.matchData[i].magicDamageDealtToChampions) / noOfGames);
                recentGamesData.averages.physicalDamageDealtToChampions += ((recentGamesData.matchData[i].physicalDamageDealtToChampions) / noOfGames);
                recentGamesData.averages.trueDamageDealtToChampions += ((recentGamesData.matchData[i].trueDamageDealtToChampions) / noOfGames);
                recentGamesData.averages.damageDealtToObjectives += ((recentGamesData.matchData[i].damageDealtToObjectives) / noOfGames);
                recentGamesData.averages.damageDealtToTurrets += ((recentGamesData.matchData[i].damageDealtToTurrets) / noOfGames);
                recentGamesData.averages.turretKills += ((recentGamesData.matchData[i].turretKills) / noOfGames);
                recentGamesData.averages.inhibitorKills += ((recentGamesData.matchData[i].inhibitorKills) / noOfGames);
                recentGamesData.averages.totalMinionsKilled += ((recentGamesData.matchData[i].totalMinionsKilled) / noOfGames);
                recentGamesData.averages.neutralMinionsKilled += ((recentGamesData.matchData[i].neutralMinionsKilled) / noOfGames);
                recentGamesData.averages.neutralMinionsKilledTeamJungle += ((recentGamesData.matchData[i].neutralMinionsKilledTeamJungle) / noOfGames);
                recentGamesData.averages.neutralMinionsKilledEnemyJungle += ((recentGamesData.matchData[i].neutralMinionsKilledEnemyJungle) / noOfGames);
                recentGamesData.averages.csDiff += ((recentGamesData.matchData[i].csDiff) / noOfGames);
                recentGamesData.averages.csPerMin += ((recentGamesData.matchData[i].csPerMin) / noOfGames);
                recentGamesData.averages.visionWardsBoughtInGame += ((recentGamesData.matchData[i].visionWardsBoughtInGame) / noOfGames);
                recentGamesData.averages.wardsPlaced += ((recentGamesData.matchData[i].wardsPlaced) / noOfGames);
                recentGamesData.averages.wardsKilled += ((recentGamesData.matchData[i].wardsKilled) / noOfGames);
            }
            recentGamesData.averages.kills = recentGamesData.averages.kills.toFixed(2);
            recentGamesData.averages.deaths = recentGamesData.averages.deaths.toFixed(2);
            recentGamesData.averages.assists = recentGamesData.averages.assists.toFixed(2);
            recentGamesData.averages.kdaRatio = recentGamesData.averages.kdaRatio.toFixed(2);
            recentGamesData.averages.visionScore = recentGamesData.averages.visionScore.toFixed(2);
            recentGamesData.averages.goldEarned = recentGamesData.averages.goldEarned.toFixed(2);
            recentGamesData.averages.totalDamageDealtToChampions = recentGamesData.averages.totalDamageDealtToChampions.toFixed(2);
            recentGamesData.averages.magicDamageDealtToChampions = recentGamesData.averages.magicDamageDealtToChampions.toFixed(2);
            recentGamesData.averages.physicalDamageDealtToChampions = recentGamesData.averages.physicalDamageDealtToChampions.toFixed(2);
            recentGamesData.averages.trueDamageDealtToChampions = recentGamesData.averages.trueDamageDealtToChampions.toFixed(2);
            recentGamesData.averages.damageDealtToObjectives = recentGamesData.averages.damageDealtToObjectives.toFixed(2);
            recentGamesData.averages.damageDealtToTurrets = recentGamesData.averages.damageDealtToTurrets.toFixed(2);
            recentGamesData.averages.turretKills = recentGamesData.averages.turretKills.toFixed(2);
            recentGamesData.averages.inhibitorKills = recentGamesData.averages.inhibitorKills.toFixed(2);
            recentGamesData.averages.totalMinionsKilled = recentGamesData.averages.totalMinionsKilled.toFixed(2);
            recentGamesData.averages.neutralMinionsKilled = recentGamesData.averages.neutralMinionsKilled.toFixed(2);
            recentGamesData.averages.neutralMinionsKilledTeamJungle = recentGamesData.averages.neutralMinionsKilledTeamJungle.toFixed(2);
            recentGamesData.averages.neutralMinionsKilledEnemyJungle = recentGamesData.averages.neutralMinionsKilledEnemyJungle.toFixed(2);
            recentGamesData.averages.csDiff = recentGamesData.averages.csDiff.toFixed(2);
            recentGamesData.averages.csPerMin = recentGamesData.averages.csPerMin.toFixed(2);
            recentGamesData.averages.visionWardsBoughtInGame = recentGamesData.averages.visionWardsBoughtInGame.toFixed(2);
            recentGamesData.averages.wardsPlaced = recentGamesData.averages.wardsPlaced.toFixed(2);
            recentGamesData.averages.wardsKilled = recentGamesData.averages.wardsKilled.toFixed(2);
            console.log((Object.keys(recentGamesData.averages)).length);
            console.log("win ratio is " + recentGamesData.winRatio);
            console.log("\ngetRecentGames complete\n");
        })
        .catch(error => console.log(error));
    return recentGamesData;
}

async function getMatchData(summonerRegion, matchID) {
    var participantIDExt;
    var matchData = {
        "kills": null,
        "deaths": null,
        "assists": null,
        "kdaRatio": null,
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
        "wardsKilled": null,
        "matchLength": null,
        "outcome": ""
    };
    var data = await api.get(summonerRegion, 'match.getMatch', matchID)
        .then((data) => {
            matchData.matchLength = data.gameDuration;
            for (var i = 0; i < Object.keys(data.participantIdentities).length; i++) {
                if (data.participantIdentities[i].player.accountId === summoner.accountId) {
                    participantIDExt = data.participantIdentities[i].participantId;
                    for (var j = 0; j < Object.keys(data.participants).length; j++) {
                        if (data.participants[j].participantId === participantIDExt) {
                            matchData.kills = data.participants[j].stats.kills;
                            matchData.deaths = data.participants[j].stats.deaths;
                            var ratioDeaths = data.participants[j].stats.deaths;
                            matchData.assists = data.participants[j].stats.assists;
                            if(ratioDeaths === 0){
                                ratioDeaths = 1;
                            }
                            matchData.kdaRatio = ((data.participants[j].stats.kills + data.participants[j].stats.assists) / ratioDeaths).toFixed(2);
                            if (data.participants[j].stats.win === true) {
                                matchData.outcome = "WIN";
                            } else {
                                matchData.outcome = "LOSE";
                            }
                            matchData.visionScore = data.participants[j].stats.visionScore;
                            matchData.goldEarned = data.participants[j].stats.goldEarned;
                            matchData.totalDamageDealtToChampions = data.participants[j].stats.totalDamageDealtToChampions;
                            matchData.magicDamageDealtToChampions = data.participants[j].stats.magicDamageDealtToChampions;
                            matchData.physicalDamageDealtToChampions = data.participants[j].stats.physicalDamageDealtToChampions;
                            matchData.trueDamageDealtToChampions = data.participants[j].stats.trueDamageDealtToChampions;
                            matchData.damageDealtToObjectives = data.participants[j].stats.damageDealtToObjectives;
                            matchData.damageDealtToTurrets = data.participants[j].stats.damageDealtToTurrets;
                            matchData.turretKills = data.participants[j].stats.turretKills;
                            matchData.inhibitorKills = data.participants[j].stats.inhibitorKills;
                            matchData.totalMinionsKilled = data.participants[j].stats.totalMinionsKilled;
                            matchData.neutralMinionsKilled = data.participants[j].stats.neutralMinionsKilled;
                            matchData.neutralMinionsKilledTeamJungle = data.participants[j].stats.neutralMinionsKilledTeamJungle;
                            matchData.neutralMinionsKilledEnemyJungle = data.participants[j].stats.neutralMinionsKilledEnemyJungle;
                            if (data.participants[j].timeline.csDiffPerMinDeltas){
                                matchData.csDiff = (data.participants[j].timeline.csDiffPerMinDeltas["0-10"]).toFixed(2);
                            } else {
                                matchData.csDiff = (data.participants[j].timeline.creepsPerMinDeltas["0-10"]).toFixed(2);
                            }
                            matchData.visionWardsBoughtInGame = data.participants[j].stats.visionWardsBoughtInGame;
                            matchData.wardsPlaced = data.participants[j].stats.wardsPlaced;
                            matchData.wardsKilled = data.participants[j].stats.wardsKilled;
                            matchData.csPerMin = ((data.participants[j].stats.totalMinionsKilled / data.gameDuration) * 60).toFixed(2);
                        }
                    }
                }
            }
        })
        .catch(error => console.log(error));
    return matchData;
}

async function getRankedInfo(summonerRegion, summonerID) {
    var rankedData = {};
    var data = await api.get(summonerRegion, 'league.getAllLeaguePositionsForSummoner', summonerID)
        .then((data) => {
            for (var i = 0; i < data.length; i++) {
                if (data[i].queueType === "RANKED_SOLO_5x5") {
                    rankedData.wins = data[i].wins;
                    rankedData.losses = data[i].losses;
                    rankedData.leagueName = data[i].leagueName;
                    rankedData.rank = data[i].rank;
                    rankedData.tier = data[i].tier;
                    rankedData.leaguePoints = data[i].leaguePoints;
                    rankedData.totalGamesRanked = rankedData.wins + rankedData.losses;
                    rankedData.winRateRanked = ((rankedData.wins / rankedData.totalGamesRanked) * 100).toFixed(2);
                    console.log(rankedData);
                }
            }
            if (data.length === 0) {
                rankedInfo = rankedReset;
            }
        })
        .catch(error => console.log(error));
    console.log("\ngetRankedInfo complete\n");
    return rankedData;
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
