var express = require('express');
var router = express.Router();
var TeemoJS = require('TeemoJS');

var api = TeemoJS('RGAPI-218a2186-53a1-4b15-b46f-b95cba504312');

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


var championJSON = {};
testChampionJSON = {
    "data": {
        "Jax": {
            "id": 24,
            "key": "Jax",
            "name": "Jax",
            "title": "Grandmaster at Arms"
        },
        "Sona": {
            "id": 37,
            "key": "Sona",
            "name": "Sona",
            "title": "Maven of the Strings"
        },
        "Tristana": {
            "id": 18,
            "key": "Tristana",
            "name": "Tristana",
            "title": "the Yordle Gunner"
        },
        "Varus": {
            "id": 110,
            "key": "Varus",
            "name": "Varus",
            "title": "the Arrow of Retribution"
        },
        "Kaisa": {
            "id": 145,
            "key": "Kaisa",
            "name": "Kai'Sa",
            "title": "Daughter of the Void"
        },
        "Fiora": {
            "id": 114,
            "key": "Fiora",
            "name": "Fiora",
            "title": "the Grand Duelist"
        },
        "Singed": {
            "id": 27,
            "key": "Singed",
            "name": "Singed",
            "title": "the Mad Chemist"
        },
        "TahmKench": {
            "id": 223,
            "key": "TahmKench",
            "name": "Tahm Kench",
            "title": "the River King"
        },
        "Leblanc": {
            "id": 7,
            "key": "Leblanc",
            "name": "LeBlanc",
            "title": "the Deceiver"
        },
        "Thresh": {
            "id": 412,
            "key": "Thresh",
            "name": "Thresh",
            "title": "the Chain Warden"
        },
        "Karma": {
            "id": 43,
            "key": "Karma",
            "name": "Karma",
            "title": "the Enlightened One"
        },
        "Jhin": {
            "id": 202,
            "key": "Jhin",
            "name": "Jhin",
            "title": "the Virtuoso"
        },
        "Rumble": {
            "id": 68,
            "key": "Rumble",
            "name": "Rumble",
            "title": "the Mechanized Menace"
        },
        "Udyr": {
            "id": 77,
            "key": "Udyr",
            "name": "Udyr",
            "title": "the Spirit Walker"
        },
        "LeeSin": {
            "id": 64,
            "key": "LeeSin",
            "name": "Lee Sin",
            "title": "the Blind Monk"
        },
        "Yorick": {
            "id": 83,
            "key": "Yorick",
            "name": "Yorick",
            "title": "Shepherd of Souls"
        },
        "Ornn": {
            "id": 516,
            "key": "Ornn",
            "name": "Ornn",
            "title": "The Fire below the Mountain"
        },
        "Kayn": {
            "id": 141,
            "key": "Kayn",
            "name": "Kayn",
            "title": "the Shadow Reaper"
        },
        "Kassadin": {
            "id": 38,
            "key": "Kassadin",
            "name": "Kassadin",
            "title": "the Void Walker"
        },
        "Sivir": {
            "id": 15,
            "key": "Sivir",
            "name": "Sivir",
            "title": "the Battle Mistress"
        },
        "MissFortune": {
            "id": 21,
            "key": "MissFortune",
            "name": "Miss Fortune",
            "title": "the Bounty Hunter"
        },
        "Draven": {
            "id": 119,
            "key": "Draven",
            "name": "Draven",
            "title": "the Glorious Executioner"
        },
        "Yasuo": {
            "id": 157,
            "key": "Yasuo",
            "name": "Yasuo",
            "title": "the Unforgiven"
        },
        "Kayle": {
            "id": 10,
            "key": "Kayle",
            "name": "Kayle",
            "title": "The Judicator"
        },
        "Shaco": {
            "id": 35,
            "key": "Shaco",
            "name": "Shaco",
            "title": "the Demon Jester"
        },
        "Renekton": {
            "id": 58,
            "key": "Renekton",
            "name": "Renekton",
            "title": "the Butcher of the Sands"
        },
        "Hecarim": {
            "id": 120,
            "key": "Hecarim",
            "name": "Hecarim",
            "title": "the Shadow of War"
        },
        "Fizz": {
            "id": 105,
            "key": "Fizz",
            "name": "Fizz",
            "title": "the Tidal Trickster"
        },
        "KogMaw": {
            "id": 96,
            "key": "KogMaw",
            "name": "Kog'Maw",
            "title": "the Mouth of the Abyss"
        },
        "Maokai": {
            "id": 57,
            "key": "Maokai",
            "name": "Maokai",
            "title": "the Twisted Treant"
        },
        "Lissandra": {
            "id": 127,
            "key": "Lissandra",
            "name": "Lissandra",
            "title": "the Ice Witch"
        },
        "Jinx": {
            "id": 222,
            "key": "Jinx",
            "name": "Jinx",
            "title": "the Loose Cannon"
        },
        "Urgot": {
            "id": 6,
            "key": "Urgot",
            "name": "Urgot",
            "title": "the Dreadnought"
        },
        "Fiddlesticks": {
            "id": 9,
            "key": "Fiddlesticks",
            "name": "Fiddlesticks",
            "title": "the Harbinger of Doom"
        },
        "Galio": {
            "id": 3,
            "key": "Galio",
            "name": "Galio",
            "title": "the Colossus"
        },
        "Pantheon": {
            "id": 80,
            "key": "Pantheon",
            "name": "Pantheon",
            "title": "the Artisan of War"
        },
        "Talon": {
            "id": 91,
            "key": "Talon",
            "name": "Talon",
            "title": "the Blade's Shadow"
        },
        "Gangplank": {
            "id": 41,
            "key": "Gangplank",
            "name": "Gangplank",
            "title": "the Saltwater Scourge"
        },
        "Ezreal": {
            "id": 81,
            "key": "Ezreal",
            "name": "Ezreal",
            "title": "the Prodigal Explorer"
        },
        "Gnar": {
            "id": 150,
            "key": "Gnar",
            "name": "Gnar",
            "title": "the Missing Link"
        },
        "Teemo": {
            "id": 17,
            "key": "Teemo",
            "name": "Teemo",
            "title": "the Swift Scout"
        },
        "Annie": {
            "id": 1,
            "key": "Annie",
            "name": "Annie",
            "title": "the Dark Child"
        },
        "Mordekaiser": {
            "id": 82,
            "key": "Mordekaiser",
            "name": "Mordekaiser",
            "title": "the Iron Revenant"
        },
        "Azir": {
            "id": 268,
            "key": "Azir",
            "name": "Azir",
            "title": "the Emperor of the Sands"
        },
        "Kennen": {
            "id": 85,
            "key": "Kennen",
            "name": "Kennen",
            "title": "the Heart of the Tempest"
        },
        "Riven": {
            "id": 92,
            "key": "Riven",
            "name": "Riven",
            "title": "the Exile"
        },
        "Chogath": {
            "id": 31,
            "key": "Chogath",
            "name": "Cho'Gath",
            "title": "the Terror of the Void"
        },
        "Aatrox": {
            "id": 266,
            "key": "Aatrox",
            "name": "Aatrox",
            "title": "the Darkin Blade"
        },
        "Poppy": {
            "id": 78,
            "key": "Poppy",
            "name": "Poppy",
            "title": "Keeper of the Hammer"
        },
        "Taliyah": {
            "id": 163,
            "key": "Taliyah",
            "name": "Taliyah",
            "title": "the Stoneweaver"
        },
        "Illaoi": {
            "id": 420,
            "key": "Illaoi",
            "name": "Illaoi",
            "title": "the Kraken Priestess"
        },
        "Heimerdinger": {
            "id": 74,
            "key": "Heimerdinger",
            "name": "Heimerdinger",
            "title": "the Revered Inventor"
        },
        "Alistar": {
            "id": 12,
            "key": "Alistar",
            "name": "Alistar",
            "title": "the Minotaur"
        },
        "XinZhao": {
            "id": 5,
            "key": "XinZhao",
            "name": "Xin Zhao",
            "title": "the Seneschal of Demacia"
        },
        "Lucian": {
            "id": 236,
            "key": "Lucian",
            "name": "Lucian",
            "title": "the Purifier"
        },
        "Volibear": {
            "id": 106,
            "key": "Volibear",
            "name": "Volibear",
            "title": "the Thunder's Roar"
        },
        "Sejuani": {
            "id": 113,
            "key": "Sejuani",
            "name": "Sejuani",
            "title": "Fury of the North"
        },
        "Nidalee": {
            "id": 76,
            "key": "Nidalee",
            "name": "Nidalee",
            "title": "the Bestial Huntress"
        },
        "Garen": {
            "id": 86,
            "key": "Garen",
            "name": "Garen",
            "title": "The Might of Demacia"
        },
        "Leona": {
            "id": 89,
            "key": "Leona",
            "name": "Leona",
            "title": "the Radiant Dawn"
        },
        "Zed": {
            "id": 238,
            "key": "Zed",
            "name": "Zed",
            "title": "the Master of Shadows"
        },
        "Blitzcrank": {
            "id": 53,
            "key": "Blitzcrank",
            "name": "Blitzcrank",
            "title": "the Great Steam Golem"
        },
        "Rammus": {
            "id": 33,
            "key": "Rammus",
            "name": "Rammus",
            "title": "the Armordillo"
        },
        "Velkoz": {
            "id": 161,
            "key": "Velkoz",
            "name": "Vel'Koz",
            "title": "the Eye of the Void"
        },
        "Caitlyn": {
            "id": 51,
            "key": "Caitlyn",
            "name": "Caitlyn",
            "title": "the Sheriff of Piltover"
        },
        "Trundle": {
            "id": 48,
            "key": "Trundle",
            "name": "Trundle",
            "title": "the Troll King"
        },
        "Kindred": {
            "id": 203,
            "key": "Kindred",
            "name": "Kindred",
            "title": "The Eternal Hunters"
        },
        "Quinn": {
            "id": 133,
            "key": "Quinn",
            "name": "Quinn",
            "title": "Demacia's Wings"
        },
        "Ekko": {
            "id": 245,
            "key": "Ekko",
            "name": "Ekko",
            "title": "the Boy Who Shattered Time"
        },
        "Nami": {
            "id": 267,
            "key": "Nami",
            "name": "Nami",
            "title": "the Tidecaller"
        },
        "Swain": {
            "id": 50,
            "key": "Swain",
            "name": "Swain",
            "title": "the Noxian Grand General"
        },
        "Taric": {
            "id": 44,
            "key": "Taric",
            "name": "Taric",
            "title": "the Shield of Valoran"
        },
        "Syndra": {
            "id": 134,
            "key": "Syndra",
            "name": "Syndra",
            "title": "the Dark Sovereign"
        },
        "Rakan": {
            "id": 497,
            "key": "Rakan",
            "name": "Rakan",
            "title": "The Charmer"
        },
        "Skarner": {
            "id": 72,
            "key": "Skarner",
            "name": "Skarner",
            "title": "the Crystal Vanguard"
        },
        "Braum": {
            "id": 201,
            "key": "Braum",
            "name": "Braum",
            "title": "the Heart of the Freljord"
        },
        "Veigar": {
            "id": 45,
            "key": "Veigar",
            "name": "Veigar",
            "title": "the Tiny Master of Evil"
        },
        "Xerath": {
            "id": 101,
            "key": "Xerath",
            "name": "Xerath",
            "title": "the Magus Ascendant"
        },
        "Corki": {
            "id": 42,
            "key": "Corki",
            "name": "Corki",
            "title": "the Daring Bombardier"
        },
        "Nautilus": {
            "id": 111,
            "key": "Nautilus",
            "name": "Nautilus",
            "title": "the Titan of the Depths"
        },
        "Ahri": {
            "id": 103,
            "key": "Ahri",
            "name": "Ahri",
            "title": "the Nine-Tailed Fox"
        },
        "Jayce": {
            "id": 126,
            "key": "Jayce",
            "name": "Jayce",
            "title": "the Defender of Tomorrow"
        },
        "Darius": {
            "id": 122,
            "key": "Darius",
            "name": "Darius",
            "title": "the Hand of Noxus"
        },
        "Tryndamere": {
            "id": 23,
            "key": "Tryndamere",
            "name": "Tryndamere",
            "title": "the Barbarian King"
        },
        "Janna": {
            "id": 40,
            "key": "Janna",
            "name": "Janna",
            "title": "the Storm's Fury"
        },
        "Elise": {
            "id": 60,
            "key": "Elise",
            "name": "Elise",
            "title": "the Spider Queen"
        },
        "Vayne": {
            "id": 67,
            "key": "Vayne",
            "name": "Vayne",
            "title": "the Night Hunter"
        },
        "Brand": {
            "id": 63,
            "key": "Brand",
            "name": "Brand",
            "title": "the Burning Vengeance"
        },
        "Zoe": {
            "id": 142,
            "key": "Zoe",
            "name": "Zoe",
            "title": "the Aspect of Twilight"
        },
        "Graves": {
            "id": 104,
            "key": "Graves",
            "name": "Graves",
            "title": "the Outlaw"
        },
        "Soraka": {
            "id": 16,
            "key": "Soraka",
            "name": "Soraka",
            "title": "the Starchild"
        },
        "Xayah": {
            "id": 498,
            "key": "Xayah",
            "name": "Xayah",
            "title": "the Rebel"
        },
        "Karthus": {
            "id": 30,
            "key": "Karthus",
            "name": "Karthus",
            "title": "the Deathsinger"
        },
        "Vladimir": {
            "id": 8,
            "key": "Vladimir",
            "name": "Vladimir",
            "title": "the Crimson Reaper"
        },
        "Zilean": {
            "id": 26,
            "key": "Zilean",
            "name": "Zilean",
            "title": "the Chronokeeper"
        },
        "Katarina": {
            "id": 55,
            "key": "Katarina",
            "name": "Katarina",
            "title": "the Sinister Blade"
        },
        "Shyvana": {
            "id": 102,
            "key": "Shyvana",
            "name": "Shyvana",
            "title": "the Half-Dragon"
        },
        "Warwick": {
            "id": 19,
            "key": "Warwick",
            "name": "Warwick",
            "title": "the Uncaged Wrath of Zaun"
        },
        "Ziggs": {
            "id": 115,
            "key": "Ziggs",
            "name": "Ziggs",
            "title": "the Hexplosives Expert"
        },
        "Kled": {
            "id": 240,
            "key": "Kled",
            "name": "Kled",
            "title": "the Cantankerous Cavalier"
        },
        "Khazix": {
            "id": 121,
            "key": "Khazix",
            "name": "Kha'Zix",
            "title": "the Voidreaver"
        },
        "Olaf": {
            "id": 2,
            "key": "Olaf",
            "name": "Olaf",
            "title": "the Berserker"
        },
        "TwistedFate": {
            "id": 4,
            "key": "TwistedFate",
            "name": "Twisted Fate",
            "title": "the Card Master"
        },
        "Nunu": {
            "id": 20,
            "key": "Nunu",
            "name": "Nunu",
            "title": "the Yeti Rider"
        },
        "Rengar": {
            "id": 107,
            "key": "Rengar",
            "name": "Rengar",
            "title": "the Pridestalker"
        },
        "Bard": {
            "id": 432,
            "key": "Bard",
            "name": "Bard",
            "title": "the Wandering Caretaker"
        },
        "Irelia": {
            "id": 39,
            "key": "Irelia",
            "name": "Irelia",
            "title": "the Will of the Blades"
        },
        "Ivern": {
            "id": 427,
            "key": "Ivern",
            "name": "Ivern",
            "title": "the Green Father"
        },
        "MonkeyKing": {
            "id": 62,
            "key": "MonkeyKing",
            "name": "Wukong",
            "title": "the Monkey King"
        },
        "Ashe": {
            "id": 22,
            "key": "Ashe",
            "name": "Ashe",
            "title": "the Frost Archer"
        },
        "Kalista": {
            "id": 429,
            "key": "Kalista",
            "name": "Kalista",
            "title": "the Spear of Vengeance"
        },
        "Akali": {
            "id": 84,
            "key": "Akali",
            "name": "Akali",
            "title": "the Fist of Shadow"
        },
        "Vi": {
            "id": 254,
            "key": "Vi",
            "name": "Vi",
            "title": "the Piltover Enforcer"
        },
        "Amumu": {
            "id": 32,
            "key": "Amumu",
            "name": "Amumu",
            "title": "the Sad Mummy"
        },
        "Lulu": {
            "id": 117,
            "key": "Lulu",
            "name": "Lulu",
            "title": "the Fae Sorceress"
        },
        "Morgana": {
            "id": 25,
            "key": "Morgana",
            "name": "Morgana",
            "title": "Fallen Angel"
        },
        "Nocturne": {
            "id": 56,
            "key": "Nocturne",
            "name": "Nocturne",
            "title": "the Eternal Nightmare"
        },
        "Diana": {
            "id": 131,
            "key": "Diana",
            "name": "Diana",
            "title": "Scorn of the Moon"
        },
        "AurelionSol": {
            "id": 136,
            "key": "AurelionSol",
            "name": "Aurelion Sol",
            "title": "The Star Forger"
        },
        "Zyra": {
            "id": 143,
            "key": "Zyra",
            "name": "Zyra",
            "title": "Rise of the Thorns"
        },
        "Viktor": {
            "id": 112,
            "key": "Viktor",
            "name": "Viktor",
            "title": "the Machine Herald"
        },
        "Cassiopeia": {
            "id": 69,
            "key": "Cassiopeia",
            "name": "Cassiopeia",
            "title": "the Serpent's Embrace"
        },
        "Nasus": {
            "id": 75,
            "key": "Nasus",
            "name": "Nasus",
            "title": "the Curator of the Sands"
        },
        "Twitch": {
            "id": 29,
            "key": "Twitch",
            "name": "Twitch",
            "title": "the Plague Rat"
        },
        "DrMundo": {
            "id": 36,
            "key": "DrMundo",
            "name": "Dr. Mundo",
            "title": "the Madman of Zaun"
        },
        "Orianna": {
            "id": 61,
            "key": "Orianna",
            "name": "Orianna",
            "title": "the Lady of Clockwork"
        },
        "Evelynn": {
            "id": 28,
            "key": "Evelynn",
            "name": "Evelynn",
            "title": "Agony's Embrace"
        },
        "RekSai": {
            "id": 421,
            "key": "RekSai",
            "name": "Rek'Sai",
            "title": "the Void Burrower"
        },
        "Lux": {
            "id": 99,
            "key": "Lux",
            "name": "Lux",
            "title": "the Lady of Luminosity"
        },
        "Sion": {
            "id": 14,
            "key": "Sion",
            "name": "Sion",
            "title": "The Undead Juggernaut"
        },
        "Camille": {
            "id": 164,
            "key": "Camille",
            "name": "Camille",
            "title": "the Steel Shadow"
        },
        "MasterYi": {
            "id": 11,
            "key": "MasterYi",
            "name": "Master Yi",
            "title": "the Wuju Bladesman"
        },
        "Ryze": {
            "id": 13,
            "key": "Ryze",
            "name": "Ryze",
            "title": "the Rune Mage"
        },
        "Malphite": {
            "id": 54,
            "key": "Malphite",
            "name": "Malphite",
            "title": "Shard of the Monolith"
        },
        "Anivia": {
            "id": 34,
            "key": "Anivia",
            "name": "Anivia",
            "title": "the Cryophoenix"
        },
        "Shen": {
            "id": 98,
            "key": "Shen",
            "name": "Shen",
            "title": "the Eye of Twilight"
        },
        "JarvanIV": {
            "id": 59,
            "key": "JarvanIV",
            "name": "Jarvan IV",
            "title": "the Exemplar of Demacia"
        },
        "Malzahar": {
            "id": 90,
            "key": "Malzahar",
            "name": "Malzahar",
            "title": "the Prophet of the Void"
        },
        "Zac": {
            "id": 154,
            "key": "Zac",
            "name": "Zac",
            "title": "the Secret Weapon"
        },
        "Gragas": {
            "id": 79,
            "key": "Gragas",
            "name": "Gragas",
            "title": "the Rabble Rouser"
        }
    },
    "type": "champion",
    "version": "8.6.1"
}
championJSON = testChampionJSON.data;


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
            for (var i = 0; i < Object.keys(championJSON).length; i++)
                if ((mastery.championId) === (championJSON[Object.keys(championJSON)[i]].id)) {
                    mastery.championName = championJSON[Object.keys(championJSON)[i]].name;
                    mastery.championTitle = championJSON[Object.keys(championJSON)[i]].title;
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
