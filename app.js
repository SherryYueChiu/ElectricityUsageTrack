var $tableSec = document.querySelector("#tableSec");
var $averageAll = document.querySelector("#averageAll");
var $clockDigit = document.querySelector("#clockDigit");
var $chooseRecord = document.querySelector("#chooseRecord");

var chartLayout = {
    title: '用電追蹤',
    yaxis: {
        title: '每日用量（度）',
        titlefont: { color: 'rgb(174, 186, 177)' },
        tickfont: { color: 'rgb(174, 186, 177)' },
    },
    yaxis2: {
        title: '電表讀數（度）',
        titlefont: { color: 'rgb(58, 62, 59)' },
        tickfont: { color: 'rgb(58, 62, 59)' },
        overlaying: 'y',
        side: 'right'
    }
};

var dates, degrees, data, rangeCrossYear, crossYear, prevDate, chartData = [];
var year, monthRange, dayRange, lastIndex;
var chosen = record.length - 1;

/**
 * @param {string} rawData 
 */
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

/**
 * @param {string} mdText
 * @returns {{date:string, degree:string, delta:string}[]}
 */
let md2arr = (mdText) => {
    let lines = [],
        pattern = [];
    lines = mdText.trim().split(/[\r\n]+/);
    lines.forEach((line) => {
        pattern.push(line.replace(/\|/g, " ").trim().split(/\s+/));
    });
    return pattern;
}

/**
 * mmdd to yyyy-mm-dd
 * @param {string} date mmdd
 * @param {boolean} _crossYear 
 * @returns {string} yyyy-mm-dd
 */
let dateFormat = (date, _crossYear) => {
    _crossYear |= crossYear;
    // cross year
    if (prevDate && `${prevDate[0]}${prevDate[1]}` > `${date[0]}${date[1]}`) {
        _crossYear = true;
    }
    let str = `${1 * year + (_crossYear ? 1 : 0)}-${date[0]}${date[1]}-${date[2]}${date[3]}`;
    prevDate = date;
    crossYear |= _crossYear;
    return str;
}

let init = () => {
    deltaData = {
        x: [],
        y: [],
        type: 'bar',
        name: '每日用量（度）',
        marker: { color: 'rgb(174, 186, 177)' }
    };
    degreeData = {
        x: [],
        y: [],
        yaxis: 'y2',
        type: 'scatter',
        name: '電表讀數（度）',
        line: { color: 'rgb(58, 62, 59)' }
    };
    data = md2arr(record[chosen].rawData);
    year = record[chosen].startYear;
    crossYear = false;
    rangeCrossYear = false;
    let prevDate = data[0][1];
    // fetch from second line of markdown table
    data = data.filter((o, i) => { return i > 1 ? true : false });
    data.forEach((o, i) => {
        // date
        let date = dateFormat(o[0], crossYear);
        degreeData.x.push(date);
        deltaData.x.push(date);
        // degree
        degreeData.y.push(o[1]);
        // delta
        let delta = (o[1] - (data[i - 1]?.[1] ?? o[1])) / ((new Date(date) - new Date(prevDate ?? date)) / 86400000);
        deltaData.y.push(delta ?? 0);
        prevDate = date;
    });
    // show table
    // printMd(record[chosen].rawData);
    // show chart
    Plotly.newPlot('chart', [deltaData, degreeData], chartLayout);
    // show statics
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

// register service worker
navigator.serviceWorker.register('service-worker.js', { scope: "." });