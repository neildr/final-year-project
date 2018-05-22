const express = require('express');
const router = express.Router();

//all functions in this file
const functions = require('./functions.js');

//**********************//
//      VARIABLES       //
//**********************//
var title = "Error - LOLSTATS.GG";

//server platforms
var platform = ['BR1', 'EUN1', 'EUW1', 'JP1', 'KR', 'LA1', 'LA2', 'NA1', 'OC1', 'TR1', 'RU'];
//server regions
var region = ['BR', 'EUNE', 'EUW', 'JP', 'KR', 'LAN', 'LAS', 'NA', 'OCE', 'TR', 'RU'];

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
    var outputSummoner = {};
    var outputRanked = {};
    var outputMatches = {};
    var outputMastery = {};
    var validRegion = false;
    if (region.contains(req.params.summRegion)) {
        var lookupPlatform = platform[region.indexOf(req.params.summRegion)];
        //call function to get data from region/name passed from wildcard url
        validRegion = true;
        const data = await functions.retreiveData(lookupPlatform, req.params.summName);
        //pass data to variables
        outputSummoner = data.outputSummoner;
        if (outputSummoner.exists) {
            outputRanked = data.outputRanked;
            outputMatches = data.outputMatches;
            outputMastery = data.outputMastery;
            outputSummoner.region = req.params.summRegion;
            title = data.outputSummoner.name + " on " + req.params.summRegion + " - LOLSTATS.GG";
        } else {
            title = "Summoner does not exist - LOLSTATS.GG";
            outputSummoner.region = req.params.summRegion;
            outputMastery.valid = false;
        }
    }
    //render page with data
    res.render('summoner', {
        summoner: outputSummoner,
        matches: outputMatches,
        rankedInfo: outputRanked,
        mastery: outputMastery,
        title,
        validRegion
    });
});

//ROUTING REDIRECT
router.get('/lookup/', function(req, res, next) {
    res.redirect('/');
});
//GET DATA FROM FORM AND REDIRECT
router.post('/compare/submit', function(req, res, next) {
    //contruct wildcard url
    res.redirect('/compare/user1=' + req.body.summOneRegion + '/' + req.body.summOneName + '/user2=' + req.body.summTwoRegion + '/' + req.body.summTwoName);
});

router.get('/compare/user1=:summOneRegion/:summOneName/user2=:summTwoRegion/:summTwoName', async function(req, res, next) {
    //variables
    var outputSummoner1 = {};
    var outputSummoner2 = {};
    var outputMastery1 = {};
    var outputMastery2 = {};
    var outputMatches1 = {};
    var outputMatches2 = {};
    var outputRanked1 = {};
    var outputRanked2 = {};
    var validRegion1 = false;
    var validRegion2 = false;
    var noValidMatches = false;
    var itemsInJSONShow = ['kills', 'deaths', 'assists', 'kdaRatio', 'visionScore',
        'goldEarned', 'goldPerMin','totalDamageDealtToChampions', 'damagePerMin', 'magicDamageDealtToChampions', 'physicalDamageDealtToChampions',
        'trueDamageDealtToChampions', 'totalHeal', 'timeCCingOthers', 'damageDealtToObjectives', 'damageDealtToTurrets', 'turretKills', 'inhibitorKills', 'creepScore', 'neutralMinionsKilled',
        'neutralMinionsKilledTeamJungle', 'neutralMinionsKilledEnemyJungle', 'csDiff', 'csPerMin', 'visionWardsBoughtInGame', 'wardsPlaced', 'wardsKilled'
    ];
    var outputAverages = {
        "kills": {
            "statName": "Kills",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "deaths": {
            "statName": "Deaths",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "assists": {
            "statName": "Assists",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "kdaRatio": {
            "statName": "KDA Ratio",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "visionScore": {
            "statName": "Vision Score",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "goldEarned": {
            "statName": "Gold Earned",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "goldPerMin": {
            "statName": "Gold/min",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "totalDamageDealtToChampions": {
            "statName": "Total Damage Dealt to Champions",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "damagePerMin": {
            "statName": "Damage Dealt/min",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "magicDamageDealtToChampions": {
            "statName": "Magic Damage Dealt to Champions",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "physicalDamageDealtToChampions": {
            "statName": "Physical Damage Dealt to Champion",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "trueDamageDealtToChampions": {
            "statName": "True Damage Dealt to Champions",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "totalHeal": {
            "statName": "Total Healing",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "timeCCingOthers": {
            "statName": "CC Score",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "damageDealtToObjectives": {
            "statName": "Damage Dealt to Objectives",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "damageDealtToTurrets": {
            "statName": "Damage Dealt to Turrets",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "turretKills": {
            "statName": "Turret KIlls",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "inhibitorKills": {
            "statName": "Inhibitor Kills",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "neutralMinionsKilled": {
            "statName": "Neutral Minions Killed",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "neutralMinionsKilledTeamJungle": {
            "statName": "Neutral Minions Killed in Team's Jungle",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "neutralMinionsKilledEnemyJungle": {
            "statName": "Neutral Minions Killed in Enemy Jungle",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "creepScore": {
            "statName": "Creep Score",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "csDiff": {
            "statName": "CS Difference in first 10 minutes",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "csPerMin": {
            "statName": "CS/Min",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "visionWardsBoughtInGame": {
            "statName": "Vision Wards Bought",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "wardsPlaced": {
            "statName": "Wards Placed",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        },
        "wardsKilled": {
            "statName": "Wards Killed",
            "summOne": 0,
            "summTwo": 0,
            "delta": 0
        }
    }

    //call function to get data from regions/names passed from wildcard url
    if (region.contains(req.params.summOneRegion)) {
        validRegion1 = true;
        var lookupPlatform1 = platform[region.indexOf(req.params.summOneRegion)];
        if (region.contains(req.params.summTwoRegion)) {
            validRegion2 = true;
            var lookupPlatform2 = platform[region.indexOf(req.params.summTwoRegion)];
            const compareData = await functions.retreiveDataCompare(lookupPlatform1, req.params.summOneName, lookupPlatform2, req.params.summTwoName);
            //pass data to variables
            outputSummoner1 = compareData.outputSummoner1;
            outputMastery1 = compareData.outputMastery1;
            outputMatches1 = compareData.outputMatches1;
            outputRanked1 = compareData.outputRanked1;
            outputSummoner2 = compareData.outputSummoner2;
            outputMastery2 = compareData.outputMastery2;
            outputMatches2 = compareData.outputMatches2;
            outputRanked2 = compareData.outputRanked2;
            outputSummoner1.region = req.params.summOneRegion;
            outputSummoner2.region = req.params.summTwoRegion;
            if (outputSummoner1.exists && outputSummoner2.exists) {
                itemsInJSONShow.forEach(function(itemsInJSONShow) {
                    outputAverages[itemsInJSONShow].summOne = outputMatches1.averages[itemsInJSONShow];
                    outputAverages[itemsInJSONShow].summTwo = outputMatches2.averages[itemsInJSONShow];
                    outputAverages[itemsInJSONShow].delta = (outputAverages[itemsInJSONShow].summOne - outputAverages[itemsInJSONShow].summTwo).toFixed(2);
                    title = "Comparion between " + outputSummoner1.name + " (" + req.params.summOneRegion + ") and " + outputSummoner2.name + " (" + req.params.summTwoRegion + ") - LOLSTATS.GG";
                });
                if ((outputMatches1.valid == false) && (outputMatches2.valid == false)){
                    noValidMatches = true;
                }
            } else {
                title = "Summoner does not exist - LOLSTATS.GG";
            }
        } else {
            outputSummoner2.name = req.params.summTwoName;
            outputSummoner2.region = req.params.summTwoRegion;
        }
    } else {
        outputSummoner1.name = req.params.summOneName;
        outputSummoner1.region = req.params.summOneRegion;
    }
    //render page with data
    res.render('compare', {
        title: title,
        summoner1: outputSummoner1,
        summoner2: outputSummoner2,
        matches1: outputMatches1,
        matches2: outputMatches2,
        rankedInfo1: outputRanked1,
        rankedInfo2: outputRanked2,
        mastery1: outputMastery1,
        mastery2: outputMastery2,
        averages: outputAverages,
        validRegion1,
        validRegion2,
        noValidMatches
    });
});
router.get('/legal', function(req, res, next) {
    res.render('legal', {
    });
});
router.post('/live/submit', function(req, res, next) {
    //contruct wildcard url
    res.redirect('/live/' + req.body.summRegionLive + '/' + req.body.summNameLive);
});

router.get('/live/:summRegionLive/:summNameLive', async function(req, res, next) {
    var outputSummoner = {};
    var validRegion = false;
    var outputLiveGame = {};
    if (region.contains(req.params.summRegionLive)) {
        var lookupPlatform = platform[region.indexOf(req.params.summRegionLive)];
        //call function to get data from region/name passed from wildcard url
        validRegion = true;
        var outputSummoner = await functions.getSummonerID(lookupPlatform, req.params.summNameLive);
        outputSummoner.region = req.params.summRegionLive;
        outputLiveGame = await functions.getLiveGame(lookupPlatform, outputSummoner.id);
        var title = outputSummoner.name + " Live Game Lookup - LOLSTATS.GG";
    }
    //render page with data
    res.render('livegame', {
        title,
        summoner: outputSummoner,
        outputLiveGame,
        validRegion
    });
});

router.post('/test/submit', function(req, res, next) {
    //contruct wildcard url
    var valid = "";
    if (req.body.team1Box0 != null){
        valid += req.body.team1Box0 + " ";
    }
    if (req.body.team1Box1 != null){
        valid += req.body.team1Box1 + " ";
    }
    if (req.body.team1Box2 != null){
        valid += req.body.team1Box2 + " ";
    }
    if (req.body.team1Box3 != null){
        valid += req.body.team1Box3 + " ";
    }
    if (req.body.team1Box4 != null){
        valid += req.body.team1Box4 + " ";
    }
    if (req.body.team2Box0 != null){
        valid += req.body.team2Box0 + " ";
    }
    if (req.body.team2Box1 != null){
        valid += req.body.team2Box1 + " ";
    }
    if (req.body.team2Box2 != null){
        valid += req.body.team2Box2 + " ";
    }
    if (req.body.team2Box3 != null){
        valid += req.body.team2Box3 + " ";
    }
    if (req.body.team42Box4 != null){
        valid += req.body.team2Box4 + " ";
    }
    console.log(valid + " " + req.body.summRegion);
    res.redirect('/live/' + req.body.summRegionLive + '/' + req.body.summNameLive);
});



module.exports = router;
