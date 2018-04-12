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
var matches = {};
var mastery = {};
var rankedInfo = {};
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
        "modePosition": { //most common position
            "mode": "",
            "count": null
        },
        "modeChampion": {//most common champion
            "info":{
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
    var itemsInJSON = ['kills', 'deaths', 'assists', 'kdaRatio', 'visionScore',
        'goldEarned', 'totalDamageDealtToChampions', 'magicDamageDealtToChampions', 'physicalDamageDealtToChampions',
        'trueDamageDealtToChampions', 'damageDealtToObjectives', 'damageDealtToTurrets', 'turretKills', 'inhibitorKills', 'totalMinionsKilled', 'totalMinionsKilled', 'neutralMinionsKilled',
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
                    itemsInJSON.forEach(function(itemsInJSON) {
                        recentGamesData.averages[itemsInJSON] += parseFloat(((recentGamesData.matchData[i][itemsInJSON]) / noOfGames));
                        recentGamesData.averages[itemsInJSON] = parseFloat((recentGamesData.averages[itemsInJSON]).toFixed(2));
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

async function getMatchData(summonerRegion, matchID) {
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
    var itemsInJSON = ['kills', 'deaths', 'assists', 'kdaRatio', 'visionScore', 'goldEarned', 'item0', 'item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'perk0', 'perk1', 'perk2', 'perk3', 'perk4', 'perk5',
        'totalDamageDealtToChampions', 'magicDamageDealtToChampions', 'physicalDamageDealtToChampions',
        'trueDamageDealtToChampions', 'damageDealtToObjectives', 'damageDealtToTurrets', 'turretKills', 'inhibitorKills', 'totalMinionsKilled', 'totalMinionsKilled', 'neutralMinionsKilled',
        'neutralMinionsKilledTeamJungle', 'neutralMinionsKilledEnemyJungle', 'csDiff', 'csPerMin', 'visionWardsBoughtInGame', 'wardsPlaced', 'wardsKilled'
    ];
    var data = await api.get(summonerRegion, 'match.getMatch', matchID)
        .then((data) => {
            matchData.matchLength = data.gameDuration;
            for (var i = 0; i < Object.keys(data.participantIdentities).length; i++) {
                if (data.participantIdentities[i].player.accountId === summoner.accountId) {
                    participantIDExt = data.participantIdentities[i].participantId;
                    for (var j = 0; j < Object.keys(data.participants).length; j++) {
                        if (data.participants[j].participantId === participantIDExt) {
                            matchData.spell1Id = data.participants[j].spell1Id;
                            matchData.spell2Id = data.participants[j].spell2Id;
                            matchData.championId = data.participants[j].championId;
                            itemsInJSON.forEach(function(itemsInJSON) {
                                matchData[itemsInJSON] = data.participants[j].stats[itemsInJSON];
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
                }
            }
            if (data.length === 0) {
                rankedInfo = rankedReset;
            }
        })
        .catch(error => console.log(error));
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
        console.log("\nmatches for " + summoner.name);
        console.log(matches);
        console.log("\n");
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

function mostCommon(array){
var data = {
	"mode": null,
    "count": null
}
var m = 0;
for (var i=0; i<array.length; i++){
          for (var j=i; j<array.length; j++){
                  if (array[i] == array[j])
                   m++;
                  if (data.count<m)
                  {
                    data.count=m;
                    data.mode = array[i];
                  }
          }
          m=0;
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
        title,
        summoner: summoner,
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
