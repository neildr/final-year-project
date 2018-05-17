const championJSON = require('./json/champions.json');
const itemsJSON = require('./json/items.json');
const spellsJSON = require('./json/summoner.json');
const runesJSON = require('./json/runesReforged.json');
const tempLiveGame = require('./json/templivegame.json');
const apiImport = require('./APIKEY');
const fetch = require('node-fetch');

//**********************//
//      VARIABLES       //
//**********************//
//default positions object - stops errors
var defaultPositionObj = {
    "TOP": 0,
    "JUNGLE": 0,
    "MID": 0,
    "ADC": 0,
    "SUPPORT": 0
};

//default champion object - stops errors
var defaultChampionObj = {};

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
async function getSummonerID(summonerRegion, summonerName) {
    var summonerData = {};
    const url = "https://" + summonerRegion + ".api.riotgames.com/lol/summoner/v3/summoners/by-name/" + summonerName + "?api_key=" + apiImport.key;
    const request = await fetch(url);
    if (request.status !== 200) {
        summonerData.exists = false;
        summonerData.name = summonerName;
        return summonerData;
    }
    const data = await request.json();
    if (data){
        summonerData.id = data.id;
        summonerData.accountId = data.accountId;
        summonerData.name = data.name;
        summonerData.profileIconId = data.profileIconId;
        summonerData.summonerLevel = data.summonerLevel;
        summonerData.exists = true;
    }
    return summonerData;
}
//GETS A USERS HIGHEST MASTERY CHAMPION
async function getHighestMastery(summonerRegion, summonerID) {
    var masteryData = {};
    const url = "https://" + summonerRegion + ".api.riotgames.com/lol/champion-mastery/v3/champion-masteries/by-summoner/" + summonerID + "?api_key=" + apiImport.key;
    const request = await fetch(url);
    if (request.status !== 200) {
        masteryData.valid = false;
    }
    const data = await request.json();
    if (!masteryData.valid){
        if (data.length != 0) {
            masteryData.championId = data[0].championId;
            masteryData.championLevel = data[0].championLevel;
            masteryData.championPoints = data[0].championPoints;
            //loop through champions.JSON to find an ID match
            for (var i = 0; i < Object.keys(championJSON.data).length; i++)
                if ((masteryData.championId) === (championJSON.data[Object.keys(championJSON.data)[i]].id)) {
                    masteryData.championName = championJSON.data[Object.keys(championJSON.data)[i]].name;
                    masteryData.championTitle = championJSON.data[Object.keys(championJSON.data)[i]].title;
                }
            masteryData.valid = true;
        }
    }
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
        "championCountUse": [],
        "matchData": [],
        "averages": {
            "kills": 0,
            "deaths": 0,
            "assists": 0,
            "kdaRatio": 0,
            "visionScore": 0,
            "goldEarned": 0,
            "goldPerMin": 0,
            "totalDamageDealtToChampions": 0,
            "damagePerMin": 0,
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
        },
        "valid": false
    };
    //variable template for easier processing
    var itemsInJSONAverage = ['kills', 'deaths', 'assists', 'kdaRatio', 'visionScore',
        'goldEarned', 'goldPerMin', 'totalDamageDealtToChampions', 'damagePerMin', 'magicDamageDealtToChampions', 'physicalDamageDealtToChampions',
        'trueDamageDealtToChampions', 'totalHeal', 'timeCCingOthers', 'damageDealtToObjectives', 'damageDealtToTurrets', 'turretKills', 'inhibitorKills', 'creepScore', 'neutralMinionsKilled',
        'neutralMinionsKilledTeamJungle', 'neutralMinionsKilledEnemyJungle', 'csDiff', 'csPerMin', 'visionWardsBoughtInGame', 'wardsPlaced', 'wardsKilled'
    ];
    //unix timestamp to check if they've played recent enough games - set to midnight 10th November 2017 - 3 days after launch of new runes
    const timestamp = 1510272000;
    var totalWins = 0;
    var recentGames = true;
    const url = "https://" + summonerRegion + ".api.riotgames.com/lol/match/v3/matchlists/by-account/" + summonerAccID + "?api_key=" + apiImport.key;
    const request = await fetch(url);
    if (request.status !== 200) {
        recentGames = false;
    }
    const data = await request.json();
    if (recentGames){
        var validMatchesCount = 0;
        for (i = 0; i < data.matches.length; i++) {
            //validating games
            if ((data.matches[i].queue === 400 || data.matches[i].queue === 420 || data.matches[i].queue === 430 || data.matches[i].queue === 440) && data.matches[i].timestamp > 1510272000000) {
                validMatchesCount++;
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
            if (validMatchesCount >= noOfGames) {
                recentGamesData.valid = true;
                break;
            }
        }
        //more calculations - mode role, mode champion, win ratio, champion count and role count
        recentGamesData.modePosition = mostCommon(recentGamesData.actualPosition);
        recentGamesData.modeChampion.info = mostCommon(recentGamesData.champions);
        for (var i = 0; i < Object.keys(championJSON.data).length; i++) {
            if ((recentGamesData.modeChampion.info.mode) === (championJSON.data[Object.keys(championJSON.data)[i]].id)) {
                recentGamesData.modeChampion.name = championJSON.data[Object.keys(championJSON.data)[i]].name;
                recentGamesData.modeChampion.title = championJSON.data[Object.keys(championJSON.data)[i]].title;
            }
        }
        recentGamesData.actualpositionCount = countValuesIn(recentGamesData.actualPosition, defaultPositionObj);
        recentGamesData.championCount = countValuesIn(recentGamesData.champions, defaultChampionObj);
        for (var i = 0; i < (Object.keys(recentGamesData.championCount).length); i++) {
            var tempName = "";
            for (var j = 0; j < Object.keys(championJSON.data).length; j++) {
                if ((Object.keys(recentGamesData.championCount)[i]) == (championJSON.data[Object.keys(championJSON.data)[j]].id)) {
                    tempName = championJSON.data[Object.keys(championJSON.data)[j]].name;
                }
            }
            recentGamesData.championCountUse[i] = {
                "id": Object.keys(recentGamesData.championCount)[i],
                "count": recentGamesData.championCount[Object.keys(recentGamesData.championCount)[i]],
                "name": tempName
            }
        }
        recentGamesData.winRatio = (totalWins / noOfGames).toFixed(2) * 100;
    }
    console.log("recentGamesData.valid is " + recentGamesData.valid);
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
        "goldPerMin": null,
        "spell1": {
            "id": null,
            "name": null
        },
        "spell2": {
            "id": null,
            "name": null
        },
        "champion": {
            "id": null,
            "name": null
        },
        "item0": {
            "id": null,
            "name": null
        },
        "item1": {
            "id": null,
            "name": null
        },
        "item2": {
            "id": null,
            "name": null
        },
        "item3": {
            "id": null,
            "name": null
        },
        "item4": {
            "id": null,
            "name": null
        },
        "item5": {
            "id": null,
            "name": null
        },
        "item6": {
            "id": null,
            "name": null
        },
        "perk0": {
            "id": null,
            "name": null
        },
        "perk1": {
            "id": null,
            "name": null
        },
        "perk2": {
            "id": null,
            "name": null
        },
        "perk3": {
            "id": null,
            "name": null
        },
        "perk4": {
            "id": null,
            "name": null
        },
        "perk5": {
            "id": null,
            "name": null
        },
        "totalDamageDealtToChampions": null,
        "damagePerMin": null,
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
    var itemsInJSONMatch = ['kills', 'deaths', 'assists', 'kdaRatio', 'visionScore', 'goldEarned', 'goldPerMin',
        'totalDamageDealtToChampions', 'magicDamageDealtToChampions', 'physicalDamageDealtToChampions',
        'trueDamageDealtToChampions', 'totalHeal', 'timeCCingOthers', 'damageDealtToObjectives', 'damageDealtToTurrets', 'turretKills', 'inhibitorKills', 'totalMinionsKilled', 'neutralMinionsKilled',
        'neutralMinionsKilledTeamJungle', 'neutralMinionsKilledEnemyJungle', 'csDiff', 'csPerMin', 'visionWardsBoughtInGame', 'wardsPlaced', 'wardsKilled'
    ];
    var gotMatchData;
    const url = "https://" + summonerRegion + ".api.riotgames.com/lol/match/v3/matches/" + matchID + "?api_key=" + apiImport.key;
    const request = await fetch(url);
    if (request.status !== 200) {
        gotMatchData = false;
    }
    const data = await request.json();
    if (!gotMatchData){
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
                        //gets summone spells, item data, rune data and champion played
                        matchData.spell1.id = data.participants[j].spell1Id;
                        matchData.spell2.id = data.participants[j].spell2Id;
                        matchData.item0.id = data.participants[j].stats.item0;
                        matchData.item1.id = data.participants[j].stats.item1;
                        matchData.item2.id = data.participants[j].stats.item2;
                        matchData.item3.id = data.participants[j].stats.item3;
                        matchData.item4.id = data.participants[j].stats.item4;
                        matchData.item5.id = data.participants[j].stats.item5;
                        matchData.item6.id = data.participants[j].stats.item6;
                        matchData.perk0.id = data.participants[j].stats.perk0;
                        matchData.perk1.id = data.participants[j].stats.perk1;
                        matchData.perk2.id = data.participants[j].stats.perk2;
                        matchData.perk3.id = data.participants[j].stats.perk3;
                        matchData.perk4.id = data.participants[j].stats.perk4;
                        matchData.perk5.id = data.participants[j].stats.perk5;
                        matchData.champion.id = data.participants[j].championId;
                        for (var k = 0; k < Object.keys(championJSON.data).length; k++)
                            if ((matchData.champion.id) === (championJSON.data[Object.keys(championJSON.data)[k]].id)) {
                                matchData.champion.name = championJSON.data[Object.keys(championJSON.data)[k]].name;
                            }
                        var itemsArray = [matchData.item0, matchData.item1, matchData.item2, matchData.item3,
                            matchData.item4, matchData.item5, matchData.item6
                        ];
                        var spellsArray = [matchData.spell1, matchData.spell2];
                        var runesArray = [matchData.perk0, matchData.perk1, matchData.perk2, matchData.perk3, matchData.perk4, matchData.perk5];
                        for (var k = 0; k < itemsArray.length; k++) {
                            if (itemsArray[k].id != 0) {
                                //console.log("item " + k + " is "+ itemsArray[k].id + " attempting to get match");
                                for (var l = 0; l < Object.keys(itemsJSON.data).length; l++) {
                                    if (itemsArray[k].id == (Object.keys(itemsJSON.data)[l])) {;
                                        itemsArray[k].name = itemsJSON.data[Object.keys(itemsJSON.data)[l]].name;
                                    }
                                }
                            }
                        }
                        for (var k = 0; k < spellsArray.length; k++) {
                            for (var l = 0; l < Object.keys(spellsJSON.data).length; l++) {
                                if (spellsArray[k].id == spellsJSON.data[Object.keys(spellsJSON.data)[l]].key) {
                                    spellsArray[k].name = spellsJSON.data[Object.keys(spellsJSON.data)[l]].name;
                                }
                            }
                        }
                        for (var k = 0; k < runesArray.length; k++) {
                            for (var l = 0; l < runesJSON.length; l++) {
                                var slots = runesJSON[l].slots;
                                for (var m = 0; m < slots.length; m++) {
                                    var runes = slots[m].runes;
                                    for (var n = 0; n < runes.length; n++) {
                                        if (runesArray[k].id == runes[n].id) {
                                            runesArray[k].name = runes[n].name;
                                        }
                                    }
                                }
                            }
                        }
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
                            matchData.outcome = "LOSS";
                        }
                        //validation for missing data - problem on Riot's end
                        if (data.participants[j].timeline.csDiffPerMinDeltas) {
                            matchData.csDiff = (data.participants[j].timeline.csDiffPerMinDeltas["0-10"]).toFixed(2);
                        } else {
                            matchData.csDiff = (data.participants[j].timeline.creepsPerMinDeltas["0-10"]).toFixed(2);
                        }
                        matchData.creepScore = data.participants[j].stats.totalMinionsKilled + data.participants[j].stats.neutralMinionsKilled;
                        matchData.csPerMin = ((matchData.creepScore / data.gameDuration) * 60).toFixed(2);
                        matchData.damagePerMin = ((matchData.totalDamageDealtToChampions / data.gameDuration) * 60).toFixed(2);
                        matchData.goldPerMin = ((matchData.goldEarned / data.gameDuration) * 60).toFixed(2);

                    }
                }
            }
        }
    }
    return matchData;
}
//GET RANKED INFORMATION FOR A PLAYER
async function getRankedInfo(summonerRegion, summonerID) {
    var rankedData = {};
    var gotRankedData;
    const url = "https://" + summonerRegion + ".api.riotgames.com/lol/league/v3/positions/by-summoner/" + summonerID + "?api_key=" + apiImport.key;
    const request = await fetch(url);
    if (request.status !== 200) {
        gotRankedData = false;
    }
    const data = await request.json();
    if (!gotRankedData){
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
    }
    return rankedData;
}

async function getLiveGame(summonerRegion, summonerID) {
    const url = "https://" + summonerRegion + ".api.riotgames.com/lol/spectator/v3/active-games/by-summoner/" + summonerID + "?api_key=" + apiImport.key;
    //team 100 is blue, team 200 is red
    var gameData = {
        "inGame": null,
        "teamOne": {
            "0": {
                "teamId": 100,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
            "1": {
                "teamId": 100,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
            "2": {
                "teamId": 100,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
            "3": {
                "teamId": 100,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
            "4": {
                "teamId": 100,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
        },
        "teamTwo": {
            "0": {
                "teamId": 200,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
            "1": {
                "teamId": 200,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
            "2": {
                "teamId": 200,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
            "3": {
                "teamId": 200,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
            "4": {
                "teamId": 200,
                "spell1": {
                    "id": null,
                    "name": null
                },
                "spell2": {
                    "id": null,
                    "name": null
                },
                "champion": {
                    "id": null,
                    "name": null
                },
                "rankedStats": null,
                "summonerName": null,
                "summonerId": null,
                "perks": {
                    "0": {
                        "id": null,
                        "name": null
                    },
                    "1": {
                        "id": null,
                        "name": null
                    },
                    "2": {
                        "id": null,
                        "name": null
                    },
                    "3": {
                        "id": null,
                        "name": null
                    },
                    "4": {
                        "id": null,
                        "name": null
                    },
                    "5": {
                        "id": null,
                        "name": null
                    },
                },
            },
        },
    };
    const request = await fetch(url);
    if (request.status !== 200) {
        gameData.inGame = false;
    }
    const data = await request.json();
    if (!gameData.inGame) {
        if (data.gameQueueConfigId === 400 || data.gameQueueConfigId === 420 || data.gameQueueConfigId === 430 || data.gameQueueConfigId === 440) {
            gameData.inGame = true;
            for (var i = 0; i < ((data.participants).length); i++) {
                if (i < 5) {
                    gameData.teamOne[i].summonerName = data.participants[i].summonerName;
                    gameData.teamOne[i].summonerId = data.participants[i].summonerId;
                    gameData.teamOne[i].spell1.id = data.participants[i].spell1Id;
                    gameData.teamOne[i].spell2.id = data.participants[i].spell2Id;
                    gameData.teamOne[i].champion.id = data.participants[i].championId;
                    var spellsArray = [gameData.teamOne[i].spell1, gameData.teamOne[i].spell2];
                    for (var k = 0; k < spellsArray.length; k++) {
                        for (var l = 0; l < Object.keys(spellsJSON.data).length; l++) {
                            if (spellsArray[k].id == spellsJSON.data[Object.keys(spellsJSON.data)[l]].key) {
                                spellsArray[k].name = spellsJSON.data[Object.keys(spellsJSON.data)[l]].name;
                            }
                        }
                    }
                    for (var j = 0; j < (data.participants[i].perks.perkIds).length; j++) {
                        gameData.teamOne[i].perks[j].id = data.participants[i].perks.perkIds[j];
                        for (var l = 0; l < runesJSON.length; l++) {
                            var slots = runesJSON[l].slots;
                            for (var m = 0; m < slots.length; m++) {
                                var runes = slots[m].runes;
                                for (var n = 0; n < runes.length; n++) {
                                    if (gameData.teamOne[i].perks[j].id == runes[n].id) {
                                        gameData.teamOne[i].perks[j].name = runes[n].name;
                                    }
                                }
                            }
                        }
                    }
                    for (var j = 0; j < Object.keys(championJSON.data).length; j++) {
                        if ((gameData.teamOne[i].champion.id) === (championJSON.data[Object.keys(championJSON.data)[j]].id)) {
                            gameData.teamOne[i].champion.name = championJSON.data[Object.keys(championJSON.data)[j]].name;
                        }
                    }
                    gameData.teamOne[i].rankedStats = await getRankedInfo(summonerRegion, gameData.teamOne[i].summonerId);
                } else {
                    gameData.teamTwo[i - 5].summonerName = data.participants[i].summonerName;
                    gameData.teamTwo[i - 5].summonerId = data.participants[i].summonerId;
                    gameData.teamTwo[i - 5].spell1.id = data.participants[i].spell1Id;
                    gameData.teamTwo[i - 5].spell2.id = data.participants[i].spell2Id;
                    gameData.teamTwo[i - 5].champion.id = data.participants[i].championId;
                    var spellsArray = [gameData.teamTwo[i - 5].spell1, gameData.teamTwo[i - 5].spell2];
                    for (var k = 0; k < spellsArray.length; k++) {
                        for (var l = 0; l < Object.keys(spellsJSON.data).length; l++) {
                            if (spellsArray[k].id == spellsJSON.data[Object.keys(spellsJSON.data)[l]].key) {
                                spellsArray[k].name = spellsJSON.data[Object.keys(spellsJSON.data)[l]].name;
                            }
                        }
                    }
                    for (var j = 0; j < (data.participants[i].perks.perkIds).length; j++) {
                        gameData.teamTwo[i - 5].perks[j].id = data.participants[i].perks.perkIds[j];
                        for (var l = 0; l < runesJSON.length; l++) {
                            var slots = runesJSON[l].slots;
                            for (var m = 0; m < slots.length; m++) {
                                var runes = slots[m].runes;
                                for (var n = 0; n < runes.length; n++) {
                                    if (gameData.teamTwo[i - 5].perks[j].id == runes[n].id) {
                                        gameData.teamTwo[i - 5].perks[j].name = runes[n].name;
                                    }
                                }
                            }
                        }
                    }
                    for (var j = 0; j < Object.keys(championJSON.data).length; j++) {
                        if ((gameData.teamTwo[i - 5].champion.id) === (championJSON.data[Object.keys(championJSON.data)[j]].id)) {
                            gameData.teamTwo[i - 5].champion.name = championJSON.data[Object.keys(championJSON.data)[j]].name;
                        }
                    }
                    gameData.teamTwo[i - 5].rankedStats = await getRankedInfo(summonerRegion, gameData.teamTwo[i - 5].summonerId);
                }
            }
        }
    }
    return gameData;
}

//ASYNC FUNCTION TO GET DATA
async function retreiveData(summonerRegion, summonerName) {
    var outputSummoner = await getSummonerID(summonerRegion, summonerName)
    if (outputSummoner.exists) {
        var outputMastery = await getHighestMastery(summonerRegion, outputSummoner.id);
        var outputMatches = await getRecentGames(summonerRegion, outputSummoner.accountId, 10);
        var outputRanked = await getRankedInfo(summonerRegion, outputSummoner.id);
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
    var outputSummoner1 = await getSummonerID(summoner1Region, summoner1Name);
    if (outputSummoner1.exists) {
        var outputMastery1 = await getHighestMastery(summoner1Region, outputSummoner1.id);
        var outputMatches1 = await getRecentGames(summoner1Region, outputSummoner1.accountId, 10);
        var outputRanked1 = await getRankedInfo(summoner1Region, outputSummoner1.id);
    }
    //await sleep(1000);
    var outputSummoner2 = await getSummonerID(summoner2Region, summoner2Name);
    if (outputSummoner2.exists) {
        var outputMastery2 = await getHighestMastery(summoner2Region, outputSummoner2.id);
        var outputMatches2 = await getRecentGames(summoner2Region, outputSummoner2.accountId, 10);
        var outputRanked2 = await getRankedInfo(summoner2Region, outputSummoner2.id);;
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
//FUNCTION FOR COUNTING VALUES IN AN ARRAY
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

//FUNCTION FOR IF ARRAY CONTAINS
Array.prototype.contains = function(object) {
    if (this.indexOf(object) == -1) {
        return false;
    } else {
        return true;
    }
}

module.exports.getSummonerID = getSummonerID;
module.exports.getHighestMastery = getHighestMastery;
module.exports.getRecentGames = getRecentGames;
module.exports.getMatchData = getMatchData;
module.exports.getLiveGame = getLiveGame;
module.exports.getRankedInfo = getRankedInfo;
module.exports.retreiveData = retreiveData;
module.exports.retreiveDataCompare = retreiveDataCompare;
