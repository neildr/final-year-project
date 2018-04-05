var express = require('express');
var router = express.Router();
var TeemoJS = require('teemojs');
var championTestJSON = ('./champion.json');
var api = TeemoJS('RGAPI-218a2186-53a1-4b15-b46f-b95cba504312');

let summoner;
var summID;
var testMast;

function getSummID() {
    api.get('euw1', 'summoner.getBySummonerName', 'easyrıder')
    .then((data) => {
    summoner = data;
    summID = summoner.id;
    getHighestMastery();
    });
}
function getHighestMastery(){
    api.get('euw1', 'championMastery.getAllChampionMasteries', summID)
    .then((data) => {
        testMast = data[0];
        });
}

function getRecentGames(){
    api.get('euw1', 'match.getRecentMatchlist', '40123768')
    .then((data) => {
        console.log(data);
    })
    .catch(error => console.log(error));
}

    getSummID();

/* GET test page. */
router.get('/', function(req, res, next) {
    res.render('test', {
        title: 'test page',
        content: 'test content',
        summoner: summoner,
        testMast: testMast
  });
});

module.exports = router;
