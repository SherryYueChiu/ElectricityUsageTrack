var $tableSec = document.querySelector("#tableSec");
var $averageAll = document.querySelector("#averageAll");
var $clockDigit = document.querySelector("#clockDigit");
var $chooseRecord = document.querySelector("#chooseRecord");

var chartLayout = {
    title: '',
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

var fullData, chartData = [];
/** @type {string} 'week'|'month'|'season' */
var viewScale = 'month';
/** @type {Date} */
var viewFrom;
/** @type {Date} */
var viewUntil;

/**
 * @param {string} mdText
 * @returns {{date:string, degree:string, delta:string}[]}
 */
let md2arr = (mdText) => {
    return mdText
        .trim()
        .split(/[\r\n]+/)
        .map((line) => {
            let [date, degree, delta] = line.replace(/\|/g, " ").trim().split(/\s+/);
            if (!delta) delta = 0;
            return { date: date, degree: Number(degree), delta: Number(delta) };
        });
}

/**
 * mmdd to yyyy-mm-dd
 * @param {string} date yyyymmdd
 * @returns {string} yyyy-mm-dd
 */
let dateFormat = (date) => {
    return date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
}

let selectWeekScale = () => {
    viewScale = 'week';
    let today = new Date();
    let fromDate = new Date();
    fromDate = fromDate.setDate(fromDate.getDate() - 7);
    fromDate = new Date(fromDate);
    viewUntil = new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
    viewFrom = new Date(`${fromDate.getFullYear()}-${fromDate.getMonth() + 1}-${fromDate.getDate()}`);
    search(viewFrom, viewUntil);
    document.querySelectorAll('.timeScale>*').forEach(elm => {
        elm.classList.remove('selected');
    });
    document.querySelector('.timeScale>.week').classList.add('selected');

    let label = '本週';
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let selectMonthScale = () => {
    viewScale = 'month';
    let today = new Date();
    let fromDate = new Date();
    fromDate = fromDate.setMonth(fromDate.getMonth() - 1);
    fromDate = new Date(fromDate);
    viewUntil = new Date(`${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`);
    viewFrom = new Date(`${fromDate.getFullYear()}/${fromDate.getMonth() + 1}/${fromDate.getDate()}`);
    search(viewFrom, viewUntil);
    document.querySelectorAll('.timeScale>*').forEach(elm => {
        elm.classList.remove('selected');
    });
    document.querySelector('.timeScale>.month').classList.add('selected');

    let label = '本月';
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let selectSeasonScale = () => {
    viewScale = 'season';
    let today = new Date();
    let fromDate = new Date();
    fromDate = fromDate.setMonth(fromDate.getMonth() - 3);
    fromDate = new Date(fromDate);
    viewUntil = new Date(`${today.getFullYear()}-/${today.getMonth() + 1}/${today.getDate()}`);
    viewFrom = new Date(`${fromDate.getFullYear()}/${fromDate.getMonth() + 1}/${fromDate.getDate()}`);
    search(viewFrom, viewUntil);
    document.querySelectorAll('.timeScale>*').forEach(elm => {
        elm.classList.remove('selected');
    });
    document.querySelector('.timeScale>.season').classList.add('selected');

    let label = '本季';
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let selectPrevScale = () => {
    viewUntil = viewFrom;
    viewUntil = viewUntil.setDate(viewFrom.getDate() - 1);
    viewUntil = new Date(viewUntil);
    if (viewScale === 'week') viewFrom = viewFrom.setDate(viewUntil.getDate() - 7);
    if (viewScale === 'month') viewFrom = viewFrom.setMonth(viewUntil.getMonth() - 1);
    if (viewScale === 'season') viewFrom = viewFrom.setMonth(viewUntil.getMonth() - 3);
    if (new Date(viewFrom) < new Date(dateFormat(fullData[0].date))) {
        viewFrom = new Date(dateFormat(fullData[0].date));
        if (viewScale === 'week') viewUntil = viewUntil.setDate(viewFrom.getDate() + 7);
        if (viewScale === 'month') viewUntil = viewUntil.setMonth(viewFrom.getMonth() + 1);
        if (viewScale === 'season') viewUntil = viewUntil.setMonth(viewFrom.getMonth() + 3);
        viewFrom = new Date(viewFrom);
        viewUntil = new Date(viewUntil);
        search(viewFrom, viewUntil);
        return;
    }
    viewFrom = new Date(viewFrom);
    viewUntil = new Date(viewUntil);
    search(viewFrom, viewUntil);

    let label = '';
    if (viewScale == 'week' || viewScale == 'month') {
        let center = new Date(viewFrom.getTime() + (viewUntil.getTime() - viewFrom.getTime()) / 2);
        label = `${center.getFullYear()}年 ${center.getMonth() + 1}月`;
    } else if (viewScale === 'season') {
        let center = new Date(viewFrom.getTime() + (viewUntil.getTime() - viewFrom.getTime()) / 2);
        label = `${center.getFullYear()}年`;
    }
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let selectCurScale = () => {
    viewFrom = new Date();
    viewUntil = new Date();
    if (viewScale === 'week') viewFrom = viewFrom.setDate(viewFrom.getDate() - 7);
    if (viewScale === 'month') viewFrom = viewFrom.setMonth(viewFrom.getMonth() - 1);
    if (viewScale === 'season') viewFrom = viewFrom.setMonth(viewFrom.getMonth() - 3);
    viewFrom = new Date(viewFrom);
    search(viewFrom, viewUntil);

    let label = '';
    if (viewScale === 'week') label = '本週';
    if (viewScale === 'month') label = '本月';
    if (viewScale === 'season') label = '本季';
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let selectNextScale = () => {
    viewFrom = viewUntil;
    viewFrom = viewFrom.setDate(viewUntil.getDate() + 1);
    viewFrom = new Date(viewFrom);
    if (viewScale == 'week') viewUntil = viewUntil.setDate(viewFrom.getDate() + 7);
    if (viewScale == 'month') viewUntil = viewUntil.setMonth(viewFrom.getMonth() + 1);
    if (viewScale == 'season') viewUntil = viewUntil.setMonth(viewFrom.getMonth() + 3);
    if (new Date(viewUntil) > new Date()) {
        viewUntil = new Date();
        if (viewScale == 'week') viewFrom = viewFrom.setDate(viewUntil.getDate() - 7);
        if (viewScale == 'month') viewFrom = viewFrom.setMonth(viewUntil.getMonth() - 1);
        if (viewScale == 'season') viewFrom = viewFrom.setMonth(viewUntil.getMonth() - 3);
        viewFrom = new Date(viewFrom);
        viewUntil = new Date(viewUntil);
        search(viewFrom, viewUntil);
        return;
    }
    viewFrom = new Date(viewFrom);
    viewUntil = new Date(viewUntil);
    search(viewFrom, viewUntil);

    let label = '';
    if (viewScale == 'week' || viewScale == 'month') {
        let center = new Date(viewFrom.getTime() + (viewUntil.getTime() - viewFrom.getTime()) / 2);
        label = `${center.getFullYear()}年 ${center.getMonth() + 1}月`;
    } else if (viewScale == 'season') {
        let center = new Date(viewFrom.getTime() + (viewUntil.getTime() - viewFrom.getTime()) / 2);
        label = `${center.getFullYear()}年`;
    }
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let search = (beginDate, endData) => {
    beginDate.setHours(8, 0, 0);
    endData.setHours(8, 0, 0);
    console.log('search range', beginDate, endData)
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
    fullData = md2arr(record);
    if (!beginDate || !endData) {
        viewFrom = beginDate = new Date(dateFormat(fullData[0].date));
        viewUntil = endData = new Date(dateFormat(fullData[fullData.length - 1].date));
        beginDate.setHours(8, 0, 0);
        endData.setHours(8, 0, 0);
        viewFrom = beginDate;
        viewUntil = endData;
    }
    let filterData = fullData.filter(data => new Date(dateFormat(data.date)) >= beginDate && new Date(dateFormat(data.date)) <= endData);

    let prevDate = filterData[0].degree;
    filterData.forEach((o, i) => {
        // date
        let date = dateFormat(o.date);
        degreeData.x.push(date);
        deltaData.x.push(date);
        // degree
        degreeData.y.push(o.degree);
        // delta
        let delta = (o.degree - (filterData[i - 1]?.degree ?? o.degree)) / ((new Date(date) - new Date(prevDate ?? date)) / 86400000);
        deltaData.y.push(delta ?? 0);
        prevDate = date;
    });
    // show chart
    Plotly.newPlot('chart', [deltaData, degreeData], chartLayout);
    let fee = (filterData[filterData.length - 1].degree - filterData[0].degree) * 4.5;
    document.querySelector('.info>.fee').textContent = `電費\n$${fee}`;
}

window.onload = function () {
    selectMonthScale();
};

// register service worker
navigator.serviceWorker.register('service-worker.js', { scope: "." });