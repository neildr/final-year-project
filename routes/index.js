const express = require('express');
const router = express.Router();
const TeemoJS = require('TeemoJS');
const championJSON = require('./champions.json');
const apiImport = require('./APIKEY');
const api = TeemoJS(apiImport.key);


//**********************//
//      VARIABLES       //
//**********************//


var title = "Access Denied";



//default positions object - stops errors
var defaultPositionObj = {
    "TOP": 0,
    "JUNGLE": 0,
    "MID": 0,
    "ADC": 0,
    "SUPPORT": 0
}

//default champion object - stops errors
var defaultChampionObj = {
}


//default ranked data object - stops errors
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



//**********************//
//      FUNCTIONS       //
//**********************//

//GET SUMMONER INFORMATION FROM NAME
async function getSummonerID(summonerRegion, summonerName) {
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


//GETS A USERS HIGHEST MASTERY CHAMPION
async function getHighestMastery(summonerRegion, summonerID) {
    var masteryData = {};
    var data = await api.get(summonerRegion, 'championMastery.getAllChampionMasteries', summonerID)
        .then((data) => {
            masteryData.championId = data[0].championId;
            masteryData.championLevel = data[0].championLevel;
            masteryData.championPoints = data[0].championPoints;
            //loop through champions.JSON to find an ID match
            for (var i = 0; i < Object.keys(championJSON.data).length; i++)
                if ((masteryData.championId) === (championJSON.data[Object.keys(championJSON.data)[i]].id)) {
                    masteryData.championName = championJSON.data[Object.keys(championJSON.data)[i]].name;
                    masteryData.championTitle = championJSON.data[Object.keys(championJSON.data)[i]].title;
                }
        })
        .catch(error => console.log(error));
    return masteryData;
}


//GETS PLAYERS RECENT GAMES, 10 RECCOMENDED BECAUSE OF API RATE LIMIT
async function getRecentGames(summonerRegion, summonerAccID, noOfGames) {
    //stores information about the games in arrays
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
                //validating games
                if (data.matches[i].queue === 400 || data.matches[i].queue === 420 || data.matches[i].queue === 430 || data.matches[i].queue === 440) {
                    recentGamesData.ids[i] = data.matches[i].gameId;
                    recentGamesData.roles[i] = data.matches[i].role;
                    recentGamesData.lanes[i] = data.matches[i].lane;
                    recentGamesData.queues[i] = data.matches[i].queue;
                    recentGamesData.champions[i] = data.matches[i].champion;
                    recentGamesData.timestamps[i] = data.matches[i].timestamp;
                    //calculating actual position - can have errors on Riot's end
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
                    //gets the game data from each match
                    recentGamesData.matchData[i] = await getMatchData(summonerRegion, data.matches[i].gameId, summonerAccID);
                    if (recentGamesData.matchData[i].outcome === "WIN") {
                        totalWins++;
                    }
                    //calculates average
                    itemsInJSONAverage.forEach(function(itemsInJSONAverage) {
                        recentGamesData.averages[itemsInJSONAverage] += parseFloat(((recentGamesData.matchData[i][itemsInJSONAverage]) / noOfGames));
                        recentGamesData.averages[itemsInJSONAverage] = parseFloat((recentGamesData.averages[itemsInJSONAverage]).toFixed(2));
                    })
                }
            }
            //more calculations - mode role, mode champion, win ratio, champion count and role count
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

//FUNCTION FOR GETTING DATA ABOUT AN INDIVIDUAL MATCH
async function getMatchData(summonerRegion, matchID, summonerAccID) {
    //stores the participantId externally outside loop
    var participantIDExt;
    //initialising variables to store data for the match
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
            //get time data for match
            matchData.matchLengthTotal = data.gameDuration;
            matchData.matchMinutes = Math.floor(data.gameDuration / 60);
            matchData.matchSeconds = data.gameDuration % 60;
            //loop through participantIdentities to find ID match
            for (var i = 0; i < Object.keys(data.participantIdentities).length; i++) {
                if (data.participantIdentities[i].player.accountId === summonerAccID) {
                    //store the participantId
                    participantIDExt = data.participantIdentities[i].participantId;
                    //loop through participants
                    for (var j = 0; j < Object.keys(data.participants).length; j++) {
                        //if ID match is found, get data
                        if (data.participants[j].participantId === participantIDExt) {
                            //gets summone spells and champion played
                            matchData.spell1Id = data.participants[j].spell1Id;
                            matchData.spell2Id = data.participants[j].spell2Id;
                            matchData.championId = data.participants[j].championId;
                            //gets data from matches
                            itemsInJSONMatch.forEach(function(itemsInJSONMatch) {
                                matchData[itemsInJSONMatch] = data.participants[j].stats[itemsInJSONMatch];
                            })
                            //stop /0 error
                            var ratioDeaths = data.participants[j].stats.deaths;
                            if (ratioDeaths === 0) {
                                ratioDeaths = 1;
                            }
                            //calculate kda ratio
                            matchData.kdaRatio = ((data.participants[j].stats.kills + data.participants[j].stats.assists) / ratioDeaths).toFixed(2);
                            //outcome
                            if (data.participants[j].stats.win === true) {
                                matchData.outcome = "WIN";
                            } else {
                                matchData.outcome = "LOSE";
                            }
                            //validation for missing data - problem on Riot's end
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
//GET RANKED INFORMATION FOR A PLAYER
async function getRankedInfo(summonerRegion, summonerID) {
    var rankedData = {};
    var data = await api.get(summonerRegion, 'league.getAllLeaguePositionsForSummoner', summonerID)
        .then((data) => {
            for (var i = 0; i < data.length; i++) {
                //go through data to find correct queue type. if found, get data
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
            //if not found or nothing, return null
            if (data.length === 0) {
                rankedData = rankedReset;
            }
        })
        .catch(error => console.log(error));
    return rankedData;
}

//ASYNC FUNCTION TO GET DATA
async function retreiveData(summonerRegion, summonerName) {
    outputSummoner = await getSummonerID(summonerRegion, summonerName)
    if (outputSummoner.exists) {
        outputMastery = await getHighestMastery(summonerRegion, outputSummoner.id);
        outputMatches = await getRecentGames(summonerRegion, outputSummoner.accountId, 10);
        outputRanked = await getRankedInfo(summonerRegion, outputSummoner.id);

    }
    return {
        outputSummoner,
        outputMastery,
        outputMatches,
        outputRanked
    };
}
//ASYNC FUNCTION TO GET DATA ABOUT 2 PEOPLE
async function retreiveDataCompare(summoner1Region, summoner1Name, summoner2Region, summoner2Name) {
    outputSummoner1 = await getSummonerID(summoner1Region, summoner1Name);
    if (outputSummoner1.exists) {
        outputMastery1 = await getHighestMastery(summoner1Region, outputSummoner1.id);
        outputMatches1 = await getRecentGames(summoner1Region, outputSummoner1.accountId, 5);
        outputRanked1 = await getRankedInfo(summoner1Region, outputSummoner1.id);
        console.log("log for 1");
        console.log(outputMatches1);
        console.log("\n\n\n");
    }
    outputSummoner2 = await getSummonerID(summoner2Region, summoner2Name);
    if (outputSummoner2.exists) {
        outputMastery2 = await getHighestMastery(summoner2Region, outputSummoner2.id);
        outputMatches2 = await getRecentGames(summoner2Region, outputSummoner2.accountId, 5);
        outputRanked2 = await getRankedInfo(summoner2Region, outputSummoner2.id);
        console.log("log for 2");
        console.log(outputMatches2);
    }
    return {
        outputSummoner1,
        outputMastery1,
        outputRanked1,
        outputMatches1,
        outputSummoner2,
        outputMastery2,
        outputRanked2,
        outputMatches2
    }
}
//function for counting values in an array
function countValuesIn(array, defaultObject) {
    var occurrences = Object.assign({}, defaultObject || {});
    for (var i = 0, j = array.length; i < j; i++) {
        occurrences[array[i]] = (occurrences[array[i]] || 0) + 1;
    }
    return occurrences;
}
//FUNCTION FOR CALCULATING THE MODE (AND COUNT OF MODE)
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

//HOMEPAGE
router.get('/', function(req, res, next) {
    res.render('index', {
        title: "LOLSTATS.GG"
    });
});

//GET DATA FROM FORM AND REDIRECT
router.post('/lookup/submit', function(req, res, next) {
    //contruct wildcard url
    res.redirect('/lookup/' + req.body.summRegion + '/' + req.body.summName);
});


//DATA DISPLAY PAGE
router.get('/lookup/:summRegion/:summName', async function(req, res, next) {
    //variables
    var outputSummoner;
    var outputRanked;
    var outputMatches;
    var outputMastery;
    //call function to get data from region/name passed from wildcard url
    const data = await retreiveData(req.params.summRegion, req.params.summName);
    //pass data to variables
    outputSummoner = data.outputSummoner;
    outputRanked = data.outputRanked;
    outputMatches = data.outputMatches;
    outputMastery = data.outputMastery;
    if (data.outputSummoner.name) {
        title = data.outputSummoner.name + " on " + req.params.summRegion + " - LOLSTATS.GG";
    }
    //render page with data
    res.render('summoner', {
        summoner: outputSummoner,
        matches: outputMatches,
        rankedInfo: outputRanked,
        mastery: outputMastery,
        title
    });
});

//ROUTING REDIRECT
router.get('/lookup/', function(req, res, next) {
    res.redirect('/');
});
//GET DATA FROM FORM AND REDIRECT
router.post('/compare/submit', function(req, res, next) {
    //contruct wildcard url
    res.redirect('/compare/user1=' + req.body.summOneRegion + '/' +req.body.summOneName + '/user2=' + req.body.summTwoRegion + '/' + req.body.summTwoName);
});

router.get('/compare/user1=:summOneRegion/:summOneName/user2=:summTwoRegion/:summTwoName', async function(req, res, next) {
    //variables
    var outputSummoner1;
    var outputSummoner2;
    var outputMastery1;
    var outputMastery2;
    var outputMatches1;
    var outputMatches2;
    var outputRanked1;
    var outputRanked2;
    //call function to get data from regions/names passed from wildcard url
    const compareData = await retreiveDataCompare(req.params.summOneRegion, req.params.summOneName, req.params.summTwoRegion, req.params.summTwoName);
    console.log(req.params.summOneRegion);
    console.log(req.params.summOneName);
    console.log(req.params.summTwoRegion);
    console.log(req.params.summTwoName);
    //pass data to variables
    outputSummoner1 = compareData.outputSummoner1;
    outputMastery1 = compareData.outputMastery1;
    outputMatches1 = compareData.outputMatches1;
    outputRanked1 = compareData.outputRanked1;
    outputSummoner2 = compareData.outputSummoner2;
    outputMastery2 = compareData.outputMastery2;
    outputMatches2 = compareData.outputMatches2;
    outputRanked2 = compareData.outputRanked2;
    //render page with data
    res.render('compare', {
        title: "Comparion between " + outputSummoner1.name + " and " + outputSummoner2.name,
        summoner1: outputSummoner1,
        summoner2: outputSummoner2,
        matches1: outputMatches1,
        matches2: outputMatches2,
        rankedInfo1: outputRanked1,
        rankedInfo2: outputRanked2,
        mastery1: outputMastery1,
        mastery2: outputMastery2
    });
});
router.get('/legal', function(req, res, next) {
    res.render('legal', {

    });
});

module.exports = router;
