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

let selectWeekScale = () => {
    viewScale = 'week';
    viewFrom = moment().startOf('week');
    viewUntil = moment().endOf('week');
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
    viewFrom = moment().startOf('month');
    viewUntil = moment().endOf('month');
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
    viewFrom = moment().startOf('quarter');
    viewUntil = moment().endOf('quarter');
    search(viewFrom, viewUntil);
    document.querySelectorAll('.timeScale>*').forEach(elm => {
        elm.classList.remove('selected');
    });
    document.querySelector('.timeScale>.season').classList.add('selected');

    let label = '本季';
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let selectPrevScale = () => {
    if (viewScale === 'week') {
        viewUntil = moment(viewUntil).subtract(1, 'w').endOf('week');
        viewFrom = moment(viewUntil).startOf('week');
    } else if (viewScale === 'month') {
        viewUntil = moment(viewUntil).subtract(1, 'M').endOf('month');
        viewFrom = moment(viewUntil).startOf('month');
    } else if (viewScale === 'season') {
        viewUntil = moment(viewUntil).subtract(1, 'Q').endOf('quarter');
        viewFrom = moment(viewUntil).startOf('quarter');
    }
    search(viewFrom, viewUntil);

    let label = '';
    if (viewScale == 'week' || viewScale == 'month') {
        let center = moment(viewFrom).add(viewUntil.diff(viewFrom, 'days'), 'days');
        label = `${center.year()}年 ${center.month() + 1}月`;
    } else if (viewScale === 'season') {
        let center = moment(viewFrom).add(viewUntil.diff(viewFrom, 'days'), 'days');
        label = `${center.year()}年`;
    }
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let selectCurScale = () => {
    viewFrom = moment().startOf('days');
    viewUntil = moment().endOf('days');
    if (viewScale === 'week') {
        viewFrom = moment(viewFrom).startOf('week');
        viewUntil = moment(viewUntil).endOf('week');
    } else if (viewScale === 'month') {
        viewFrom = moment(viewFrom).startOf('month');
        viewUntil = moment(viewUntil).endOf('month');
    } else if (viewScale === 'season') {
        viewFrom = moment(viewFrom).startOf('quarter');
        viewUntil = moment(viewUntil).endOf('quarter');
    }
    search(viewFrom, viewUntil);

    let label = '';
    if (viewScale === 'week') label = '本週';
    if (viewScale === 'month') label = '本月';
    if (viewScale === 'season') label = '本季';
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let selectNextScale = () => {
    if (viewScale === 'week') {
        viewFrom = moment(viewFrom).add(1, 'w').startOf('week');
        viewUntil = moment(viewFrom).endOf('week');
    } else if (viewScale == 'month') {
        viewFrom = moment(viewFrom).add(1, 'M').startOf('month');
        viewUntil = moment(viewFrom).endOf('month');
    } else if (viewScale == 'season') {
        viewFrom = moment(viewFrom).add(1, 'Q').startOf('quarter');
        viewUntil = moment(viewFrom).endOf('quarter');
    }
    search(viewFrom, viewUntil);

    let label = '';
    if (viewScale == 'week' || viewScale == 'month') {
        let center = moment(viewFrom).add(viewUntil.diff(viewFrom, 'days'), 'days');
        label = `${center.year()}年 ${center.month() + 1}月`;
    } else if (viewScale == 'season') {
        let center = moment(viewFrom).add(viewUntil.diff(viewFrom, 'days'), 'days');
        label = `${center.year()}年`;
    }
    document.querySelector('.timeSelect>.cur').textContent = label;
}

let search = (beginDate, endData) => {
    console.log('search range', beginDate.format('YYYY-MM-DD'), endData.format('YYYY-MM-DD'));
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
        viewFrom = beginDate = moment(fullData[0].date, 'YYYYMMDD').startOf('days');
        viewUntil = endData = moment(fullData[fullData.length - 1].date, 'YYYYMMDD').startOf('days');
    }
    let filterData = fullData.filter(data => (
        moment(data.date, 'YYYYMMDD').isSameOrAfter(beginDate) &&
        moment(data.date, 'YYYYMMDD').isSameOrBefore(endData)
    ));

    filterData.forEach((data, idx, arr) => {
        // date
        let date = moment(data.date, 'YYYYMMDD');
        degreeData.x.push(date.format('YYYY-MM-DD'));
        deltaData.x.push(date.format('YYYY-MM-DD'));
        // degree
        degreeData.y.push(data.degree);
        // delta
        let delta = (data.degree - (arr[idx - 1]?.degree ?? data.degree)) / date.diff(moment(arr[idx - 1]?.date ?? date, 'YYYYMMDD'), 'days');
        deltaData.y.push(delta ?? 0);
    });
    // show chart
    Plotly.newPlot('chart', [deltaData, degreeData], chartLayout);
    if (filterData.length > 0) {
        // 6月之前
        if (moment(filterData[filterData.length - 1].date).month() + 1 < 6) {
            let fee = (filterData[filterData.length - 1].degree - filterData[0].degree) * 5;
            document.querySelector('.info>.fee').textContent = `電費\n約$${fee}`;
        }
        // 10月之後
        else if (moment(filterData[0].date).month() + 1 > 10) {
            let fee = (filterData[filterData.length - 1].degree - filterData[0].degree) * 5;
            document.querySelector('.info>.fee').textContent = `電費\n約$${fee}`;
        }
        // 6月～9月
        else if (
            moment(filterData[0].date).month() + 1 >= 6 &&
            moment(filterData[filterData.length - 1].date).month() + 1 <= 9
        ) {
            let fee = (filterData[filterData.length - 1].degree - filterData[0].degree) * 6;
            document.querySelector('.info>.fee').textContent = `電費\n約$${fee}`;
        }
        // 混合
        else {
            let feeFrom = (filterData[filterData.length - 1].degree - filterData[0].degree) * 5;
            let feeTo = (filterData[filterData.length - 1].degree - filterData[0].degree) * 6;
            document.querySelector('.info>.fee').textContent = `電費\n$${feeFrom}~${feeTo}`;
        }
    } else {
        document.querySelector('.info>.fee').textContent = `電費\n約$--`;
    }
}

window.onload = function () {
    selectMonthScale();
};

// register service worker
navigator.serviceWorker.register('service-worker.js', { scope: "." });