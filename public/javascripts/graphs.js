function drawChamps(data, id) {
    google.charts.setOnLoadCallback(function() {
        championsPlayed(data, id);
    });
}

function championsPlayed(data, id) {

    data = google.visualization.arrayToDataTable(data);
    var options = {
        pieHole: 1,
        pieSliceTextStyle: {
            color: 'white',
        },
        fontName: 'Nunito',
        fontSize: '11',
        backgroundColor: {
            fill: '#FFFFFF',
            fillOpacity: 0.0
        },
        legend: {
            textStyle: {
                color: 'white'
            }
        },
        chartArea: {
            left: 10,
            bottom: 5,
            width: '80%',
            height: '80%'
        }
    };

    var chart = new google.visualization.PieChart(document.getElementById(id));
    chart.draw(data, options);
}

function drawRoles(data, id) {
    google.charts.setOnLoadCallback(function() {
        rolesPlayed(data, id);
    });
}

function rolesPlayed(data, id) {
    data = google.visualization.arrayToDataTable(data);
    var options = {
        pieHole: 1,
        pieSliceTextStyle: {
            color: 'white',
        },
        fontName: 'Nunito',
        fontSize: '11',
        backgroundColor: {
            fill: '#FFFFFF',
            fillOpacity: 0.0
        },
        legend: {
            textStyle: {
                color: 'white'
            }
        },
        chartArea: {
            left: 10,
            bottom: 5,
            width: '80%',
            height: '80%'
        }
    };

    var chart = new google.visualization.PieChart(document.getElementById(id));
    chart.draw(data, options);
}
function drawDamage(data, id) {
    google.charts.setOnLoadCallback(function() {
        averageDamageChart(data, id);
    });
}
function averageDamageChart(data, id){
    var data = google.visualization.arrayToDataTable(data);

    var options = {
        legend: {position: 'bottom'}
    }
    var chart = new google.visualization.LineChart(document.getElementById(id));
    chart.draw(data, options);
}

function drawGold(data, id) {
    google.charts.setOnLoadCallback(function() {
        averageGoldChart(data, id);
    });
}
function averageGoldChart(data, id){
    var data = google.visualization.arrayToDataTable(data);

    var options = {
        legend: {position: 'bottom'}
    }
    var chart = new google.visualization.LineChart(document.getElementById(id));
    chart.draw(data, options);
}
function drawCS(data, id) {
    google.charts.setOnLoadCallback(function() {
        averageCSChart(data, id);
    });
}
function averageCSChart(data, id){
    var data = google.visualization.arrayToDataTable(data);

    var options = {
        legend: {position: 'bottom'}
    }
    var chart = new google.visualization.LineChart(document.getElementById(id));
    chart.draw(data, options);
}
function drawKD(data, id) {
    google.charts.setOnLoadCallback(function() {
        averageKDChart(data, id);
    });
}
function averageKDChart(data, id){
    var data = google.visualization.arrayToDataTable(data);

    var options = {
        legend: {position: 'bottom'}
    }
    var chart = new google.visualization.LineChart(document.getElementById(id));
    chart.draw(data, options);
}
