const express = require('express');
const router = express.Router();

//all functions in this file
const functions = require('./functions.js');


router.post('/test/submit', function(req, res, next) {
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
        console.log(lookupPlatform + " " + req.params.summNameLive);
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
module.exports = router;
