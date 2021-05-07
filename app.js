var $tableSec = document.querySelector("#tableSec");
var $averageAll = document.querySelector("#averageAll");
var $clockDigit = document.querySelector("#clockDigit");
var $chooseRecord = document.querySelector("#chooseRecord");

var chartLayout = {
    title: '每日平均用電度數',
};

var dates, degrees, data, rangeCrossYear, crossYear, prevDate, chartData = [];
var year, monthRange, dayRange, lastIndex;
var chosen = record.length - 1;

function printMd(rawData) {
    converter = new showdown.Converter({
        metadata: true,
        underline: true,
        ghCodeBlocks: true,
        openLinksInNewWindow: true,
        emoji: true,
        simpleLineBreaks: true,
        tasklists: true,
        tables: true,
        splitAdjacentBlockquotes: true,
        strikethrough: true,
        parseImgDimensions: true,
        omitExtraWLInCodeBlocks: true
    });
    showdown.setFlavor('vanilla');
    const html = converter.makeHtml(rawData);
    $tableSec.innerHTML = html;
}

function md2arr(mdText) {
    let lines = [],
        pattern = [];
    lines = mdText.trim().split(/[\r\n]+/);
    lines.forEach((line) => {
        pattern.push(line.replace(/\|/g, " ").trim().split(/\s+/));
    });
    return pattern;
}

//mmdd to yyyy-mm-dd
function dateFormat(date, _crossYear) {
    _crossYear |= crossYear;
    //cross year
    if (prevDate && `${prevDate[0]}${prevDate[1]}` > `${date[0]}${date[1]}`) {
        _crossYear = true;
    }
    let str = `${1 * year + (_crossYear ? 1 : 0)}-${date[0]}${date[1]}-${date[2]}${date[3]}`;
    prevDate = date;
    crossYear |= _crossYear;
    return str;
}

function init() {
    chartData = [{
        x: [],
        y: [],
        mode: 'lines+markers',
        line: { color: '#7F7F7F' }
    }];
    dates = chartData[0].x;
    degrees = chartData[0].y;
    data = md2arr(record[chosen].rawData);
    year = record[chosen].startYear;
    crossYear = false;
    rangeCrossYear = false;
    //fetch from second line od markdown table
    data = data.filter((o, i) => { return i > 1 ? true : false });
    data.forEach((o) => {
        dates.push(dateFormat(o[0], crossYear));
        degrees.push(o[2]);
    });
    //show table
    printMd(record[chosen].rawData);
    //show chart
    Plotly.newPlot('chart', chartData, chartLayout);
    //show statics
    lastIndex = data.length - 1;
    degreeRange = data[lastIndex][1] - data[0][1];
    if (data[0][0][0] + data[0][0][1] > data[lastIndex][0][0] + data[lastIndex][0][1]) rangeCrossYear = true;
    crossYear = false;
    monthRange = (new Date(dateFormat(data[lastIndex][0], rangeCrossYear)).getTime() - new Date(dateFormat(data[0][0], false)).getTime() + (crossYear ? 86400000 * 30.5 * 12 : 0)) / (86400000 * 30.5);
    crossYear = false;
    dayRange = (new Date(dateFormat(data[lastIndex][0], rangeCrossYear)).getTime() - new Date(dateFormat(data[0][0], false)).getTime() + (crossYear ? 365 * 86400000 : 0)) / 86400000;
    $clockDigit.innerHTML = `在這${monthRange.toFixed(1)}個月中`;
    $averageAll.innerHTML = `平均每天用了${(degreeRange / dayRange).toFixed(2)}度`;
}

/*
page loaded
*/
window.onload = function () {
    init();
    record.forEach((it, i) => {
        $chooseRecord.insertAdjacentHTML("beforeEnd", `<option value="${i}" ${(i == record.length - 1) ? "selected" : ""}>${it.name}</option>`);
    });
    $chooseRecord.addEventListener("change", () => {
        chosen = $chooseRecord.value;
        init();
    });
};

//register service worker
navigator.serviceWorker.register('service-worker.js', { scope: "." });