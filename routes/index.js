const express = require('express');
const router = express.Router();
const TeemoJS = require('TeemoJS');
const championJSON = require('./champions.json');
const apiImport = require('./APIKEY');
const api = TeemoJS(apiImport.key);


//**********************//
//      VARIABLES       //
//**********************//

var summoner = {};
var matches = {};
var mastery = {};
var rankedInfo = {};


var summoner1 = {};
var matches1 = {};
var mastery1 = {};
var rankedInfo1 = {};
var summoner2 = {};
var matches2 = {};
var mastery2 = {};
var rankedInfo2 = {};
var title = "Access Denied";



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
//hi
async function getSummonerID(summonerRegion, summonerName){
    var summonerData = {};
    var data = await api.get(summonerRegion, 'summoner.getBySummonerName', summonerName)
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
    })
    .catch(error => console.log(error));
    return summonerData;
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
        "timestamps": [],
        "actualPosition": [], //finding the actual position
        "actualpositionCount": [], //counts actual position occurrences
        "modePosition": { //most common position
            "mode": "",
            "count": null
        },
        "modeChampion": { //most common champion
            "info": {
                "mode": "",
                "count": null,
            },
            "name": "",
            "title": "",
        },
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
            "totalHeal": 0,
            "timeCCingOthers": 0,
            "damageDealtToObjectives": 0,
            "damageDealtToTurrets": 0,
            "turretKills": 0,
            "inhibitorKills": 0,
            "totalMinionsKilled": 0,
            "neutralMinionsKilled": 0,
            "neutralMinionsKilledTeamJungle": 0,
            "neutralMinionsKilledEnemyJungle": 0,
            "creepScore": 0,
            "csDiff": 0,
            "csPerMin": 0,
            "visionWardsBoughtInGame": 0,
            "wardsPlaced": 0,
            "wardsKilled": 0
        }
    };
    var itemsInJSONAverage = ['kills', 'deaths', 'assists', 'kdaRatio', 'visionScore',
        'goldEarned', 'totalDamageDealtToChampions', 'magicDamageDealtToChampions', 'physicalDamageDealtToChampions',
        'trueDamageDealtToChampions', 'totalHeal', 'timeCCingOthers', 'damageDealtToObjectives', 'damageDealtToTurrets', 'turretKills', 'inhibitorKills', 'creepScore', 'neutralMinionsKilled',
        'neutralMinionsKilledTeamJungle', 'neutralMinionsKilledEnemyJungle', 'csDiff', 'csPerMin', 'visionWardsBoughtInGame', 'wardsPlaced', 'wardsKilled'
    ];
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
                    recentGamesData.timestamps[i] = data.matches[i].timestamp;
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
                    recentGamesData.matchData[i] = await getMatchData(summonerRegion, data.matches[i].gameId, summonerAccID);
                    if (recentGamesData.matchData[i].outcome === "WIN") {
                        totalWins++;
                    }
                    itemsInJSONAverage.forEach(function(itemsInJSONAverage) {
                        recentGamesData.averages[itemsInJSONAverage] += parseFloat(((recentGamesData.matchData[i][itemsInJSONAverage]) / noOfGames));
                        recentGamesData.averages[itemsInJSONAverage] = parseFloat((recentGamesData.averages[itemsInJSONAverage]).toFixed(2));
                    })
                }
            }
            recentGamesData.modePosition = mostCommon(recentGamesData.actualPosition);
            recentGamesData.modeChampion.info = mostCommon(recentGamesData.champions);
            for (var i = 0; i < Object.keys(championJSON.data).length; i++)
                if ((recentGamesData.modeChampion.info.mode) === (championJSON.data[Object.keys(championJSON.data)[i]].id)) {
                    recentGamesData.modeChampion.name = championJSON.data[Object.keys(championJSON.data)[i]].name;
                    recentGamesData.modeChampion.title = championJSON.data[Object.keys(championJSON.data)[i]].title;
                }

            recentGamesData.actualpositionCount = countValuesIn(recentGamesData.actualPosition, defaultPositionObj);
            recentGamesData.championCount = countValuesIn(recentGamesData.champions, defaultChampionObj);
            recentGamesData.winRatio = (totalWins / noOfGames).toFixed(2) * 100;
        })
        .catch(error => console.log(error));
    return recentGamesData;
}

async function getMatchData(summonerRegion, matchID, summonerAccID) {
    var participantIDExt;
    var matchData = {
        "kills": null,
        "deaths": null,
        "assists": null,
        "kdaRatio": null,
        "visionScore": null,
        "goldEarned": null,
        "spell1Id": null,
        "spell2Id": null,
        "championId": null,
        "item0": null,
        "item1": null,
        "item2": null,
        "item3": null,
        "item4": null,
        "item5": null,
        "item6": null,
        "perk0": null,
        "perk1": null,
        "perk2": null,
        "perk3": null,
        "perk4": null,
        "perk5": null,
        "totalDamageDealtToChampions": null,
        "magicDamageDealtToChampions": null,
        "physicalDamageDealtToChampions": null,
        "trueDamageDealtToChampions": null,
        "totalHeal": null,
        "timeCCingOthers": null,
        "damageDealtToObjectives": null,
        "damageDealtToTurrets": null,
        "turretKills": null,
        "inhibitorKills": null,
        "totalMinionsKilled": null,
        "neutralMinionsKilled": null,
        "neutralMinionsKilledTeamJungle": null,
        "neutralMinionsKilledEnemyJungle": null,
        "creepScore": null,
        "csDiff": null,
        "csPerMin": null,
        "visionWardsBoughtInGame": null,
        "wardsPlaced": null,
        "wardsKilled": null,
        "matchLengthTotal": null,
        "matchMinutes": null,
        "matchSeconds": null,
        "outcome": ""
    };
    var itemsInJSONMatch = ['kills', 'deaths', 'assists', 'kdaRatio', 'visionScore', 'goldEarned', 'item0', 'item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'perk0', 'perk1', 'perk2', 'perk3', 'perk4', 'perk5',
        'totalDamageDealtToChampions', 'magicDamageDealtToChampions', 'physicalDamageDealtToChampions',
        'trueDamageDealtToChampions', 'totalHeal', 'timeCCingOthers', 'damageDealtToObjectives', 'damageDealtToTurrets', 'turretKills', 'inhibitorKills', 'totalMinionsKilled', 'totalMinionsKilled', 'neutralMinionsKilled',
        'neutralMinionsKilledTeamJungle', 'neutralMinionsKilledEnemyJungle', 'csDiff', 'csPerMin', 'visionWardsBoughtInGame', 'wardsPlaced', 'wardsKilled'
    ];
    var data = await api.get(summonerRegion, 'match.getMatch', matchID)
        .then((data) => {
            matchData.matchLengthTotal = data.gameDuration;
            matchData.matchMinutes = Math.floor(data.gameDuration / 60);
            matchData.matchSeconds = data.gameDuration % 60;
            for (var i = 0; i < Object.keys(data.participantIdentities).length; i++) {
                if (data.participantIdentities[i].player.accountId === summonerAccID) {
                    participantIDExt = data.participantIdentities[i].participantId;
                    for (var j = 0; j < Object.keys(data.participants).length; j++) {
                        if (data.participants[j].participantId === participantIDExt) {
                            matchData.spell1Id = data.participants[j].spell1Id;
                            matchData.spell2Id = data.participants[j].spell2Id;
                            matchData.championId = data.participants[j].championId;
                            itemsInJSONMatch.forEach(function(itemsInJSONMatch) {
                                matchData[itemsInJSONMatch] = data.participants[j].stats[itemsInJSONMatch];
                            })
                            var ratioDeaths = data.participants[j].stats.deaths;
                            if (ratioDeaths === 0) {
                                ratioDeaths = 1;
                            }
                            matchData.kdaRatio = ((data.participants[j].stats.kills + data.participants[j].stats.assists) / ratioDeaths).toFixed(2);
                            if (data.participants[j].stats.win === true) {
                                matchData.outcome = "WIN";
                            } else {
                                matchData.outcome = "LOSE";
                            }
                            if (data.participants[j].timeline.csDiffPerMinDeltas) {
                                matchData.csDiff = (data.participants[j].timeline.csDiffPerMinDeltas["0-10"]).toFixed(2);
                            } else {
                                matchData.csDiff = (data.participants[j].timeline.creepsPerMinDeltas["0-10"]).toFixed(2);
                            }
                            matchData.creepScore = data.participants[j].stats.totalMinionsKilled + data.participants[j].stats.neutralMinionsKilled;
                            matchData.csPerMin = ((matchData.creepScore / data.gameDuration) * 60).toFixed(2);

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
                }
            }
            if (data.length === 0) {
                rankedData = rankedReset;
            }
        })
        .catch(error => console.log(error));
    return rankedData;
}

async function retreiveData(summonerRegion, summonerName) {
    var testVar = "hello world";
    summoner = await getSummonerID(summonerRegion, summonerName)
    summoner.name = summonerName;
    summoner.region = summonerRegion;
    if (summoner.exists) {
        mastery = await getHighestMastery(summonerRegion, summoner.id);
        matches = await getRecentGames(summonerRegion, summoner.accountId, 10);
        rankedInfo = await getRankedInfo(summonerRegion, summoner.id);
    }
    return {
        summoner: summoner,
        mastery: mastery,
        matches: matches,
        rankedInfo: rankedInfo,
        testVar

    };
}
// async function retreiveData(summonerRegion, summonerName) {
//     var testVar = "hello world";
//     outputSummoner = await getSummonerID(summonerRegion, summonerName)
//     outputSummoner.name = summonerName;
//     outputSummoner.region = summonerRegion;
//     if (outputSummoner.exists) {
//         outputMastery = await getHighestMastery(summonerRegion, outputSummoner.id);
//         outputMatches = await getRecentGames(summonerRegion, outputSummoner.accountId, 10);
//         outputRanked = await getRankedInfo(summonerRegion, outputSummoner.id);
//     }
//     return {
//         outputSummoner: outputSummoner,
//         outputMastery: outputMastery,
//         outputMatches: outputMatches,
//         outputRanked: outputRanked,
//         testVar
//
//     };
// }
async function retreiveDataCompare(summoner1Region, summoner1Name,summoner2Region, summoner2Name) {
    summoner1 = await getSummonerID(summoner1Region, summoner1Name);
    summoner1.name = summoner1Name;
    summoner1.region = summoner1Region;
    if (summoner1.exists) {
        mastery1 = await getHighestMastery(summoner1Region, summoner1.id);
        matches1 = await getRecentGames(summoner1Region, summoner1.accountId, 5);
        rankedInfo1 = await getRankedInfo(summoner1Region, summoner1.id);
        //console.log(summoner1);
        //console.log(mastery1);
        console.log("log for 1");
        console.log(matches1);
        //console.log(rankedInfo1);
        console.log("\n\n\n");
    }
    summoner2 = await getSummonerID(summoner2Region, summoner2Name);
    summoner2.name = summoner2Name;
    summoner2.region = summoner2Region;
    if (summoner2.exists) {
        mastery2 = await getHighestMastery(summoner2Region, summoner2.id);
        matches2 = await getRecentGames(summoner2Region, summoner2.accountId, 5);
        rankedInfo2 = await getRankedInfo(summoner2Region, summoner2.id);
        //console.log(summoner2);
        //console.log(mastery2);
        console.log("log for 2");
        console.log(matches2);
        //console.log(rankedInfo2);
    }
    return "done";
}

function countValuesIn(array, defaultObject) {
    var occurrences = Object.assign({}, defaultObject || {});
    for (var i = 0, j = array.length; i < j; i++) {
        occurrences[array[i]] = (occurrences[array[i]] || 0) + 1;
    }
    return occurrences;
}

function mostCommon(array) {
    var data = {
        "mode": null,
        "count": null
    }
    var m = 0;
    for (var i = 0; i < array.length; i++) {
        for (var j = i; j < array.length; j++) {
            if (array[i] == array[j])
                m++;
            if (data.count < m) {
                data.count = m;
                data.mode = array[i];
            }
        }
        m = 0;
    }
    return data;
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
    const data = await retreiveData(req.body.summRegion, req.body.summName);
    // req.session.summoner = data.outputSummoner;
    // req.session.matches = data.outputMatches;
    // req.session.rankedInfo = data.outputRanked;
    // req.session.mastery = data.outputMastery;
    if (summoner.name) {
        title = req.body.summName + " on " + req.body.summRegion + " - LOLSTATS.GG";
    }
    // if (outputSummoner.name) {
    //     title = req.body.summName + " on " + req.body.summRegion + " - LOLSTATS.GG";
    // }
    // req.session.title = title;
    // req.session.testVar = data.testVar;
    res.redirect('/summoner/lookup');
});


//DATA DISPLAY PAGE
router.get('/summoner/lookup', function(req, res, next) {
    // if (req.session) {
    //     res.locals.title = title;
    //     res.locals.summoner = summoner;
    //     res.locals.mastery = mastery;
    //     res.locals.rankedInfo = rankedInfo;
    //     res.locals.matches = matches;
        res.render('summoner', {
            summoner: summoner,
            matches: matches,
            rankedInfo: rankedInfo,
            mastery: mastery,
            title
        });
    // } else {
    //     res.redirect('/');
    // }
});

router.get('/summoner/', function(req, res, next) {
    res.redirect('/');
});

router.post('/compare/submit', async function(req, res, next) {
    summoner1.region = req.body.summOneRegion;
    summoner1.name = req.body.summOneName;
    summoner2.region = req.body.summTwoRegion;
    summoner2.name = req.body.summTwoName;
    const x = await retreiveDataCompare(summoner1.region, summoner1.name, summoner2.region, summoner2.name);
    res.redirect('/compare/');
});

router.get('/compare/', function(req, res, next) {
    res.render('compare', {
        title: "Comparion between " + summoner1.name + " and " + summoner2.name,
        summoner1,
        summoner2
    });
});

module.exports = router;
