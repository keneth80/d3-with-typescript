import './style.css';

import { min, max, quantile, mean } from 'd3-array';
import { randomUniform, randomNormal } from 'd3-random';
import { scaleOrdinal, scaleQuantile } from 'd3-scale';
import { timeParse } from 'd3-time-format';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { csv } from 'd3-fetch';
import { DocumentSelectionExample } from './component/document-selection-example';
import { BasicChart } from './component/basic-chart';
import { VerticalBarSeries } from './component/series/vertical-bar-series';
import { BasicLineSeries } from './component/series/basic-line-series';
import { LabelSeries } from './component/series/label-series';
import { BasicPlotSeries } from './component/series/basic-plot-series';
import { BasicBoxplotSeries } from './component/series/basic-boxplot-series';
import { bollingerData } from './component/mock-data/bollinger-band-data';
import { BasicBollingerBandSeries } from './component/series/basic-bollinger-band-series';
import { BasicViolinSeries } from './component/series/basic-violin-series';
import { StackedVerticalBarSeries } from './component/series/stacked-vertical-bar-series';
import { GroupedVerticalBarSeries } from './component/series/grouped-vertical-bar-series';

class SalesModel {
    salesperson: string;
    sales: number;
    assets: number;
    date?: Date;
    dateStr?: string;

    constructor(
        salesperson: string,
        sales: number,
        assets: number,
        dateStr?: string,
        date?: Date
    ) {
        Object.assign(this, {
            salesperson,
            sales,
            assets,
            dateStr,
            date
        });
    }

    static clone({
        salesperson,
        sales,
        assets,
        dateStr,
        date
    }): SalesModel {
        return new SalesModel(salesperson, sales, assets, dateStr, date);
    }
}

const data: Array<SalesModel> = [
    new SalesModel('Bob', 33, 80, '1-May-12'),
    new SalesModel('Robin', 12, 40, '29-Apr-12'),
    new SalesModel('Anne', 41, null, '27-Apr-12'),
    new SalesModel('Mark', 16, 50, '26-Apr-12'),
    new SalesModel('Joe', 59, 95, '25-Apr-12'),
    new SalesModel('Eve', 38, 60, '20-Apr-12'),
    new SalesModel('Karen', 21, 55, '19-Apr-12'),
    new SalesModel('Kirsty', 25, 37, '18-Apr-12'),
    new SalesModel('Chris', 30, 50, '17-Apr-12'),
    new SalesModel('Lisa', 47, 77, '9-Apr-12'),
    new SalesModel('Tom', 5, 25, '5-Apr-12'),
    new SalesModel('Stacy', 20, 40, '4-Apr-12'),
    new SalesModel('Charles', 13, 35, '3-Apr-12'),
    new SalesModel('Mary', 29, 67, '26-Mar-12')
];

const excute = () => {
    const parseTime = timeParse('%d-%b-%y');
    const verticalBarSeries = new VerticalBarSeries({
        selector: 'vertical-bar',
        yField: 'sales',
        xField: 'salesperson'
    });
    verticalBarSeries.$currentItem.subscribe((item: any) => {
        console.log('verticalBarSeries.item : ', item);
    });

    const basicLineSeries = new BasicLineSeries({
        selector: 'basic-line-sales',
        dotSelector: 'basic-line-sales-dot',
        yField: 'sales',
        xField: 'salesperson'
    });
    basicLineSeries.$currentItem.subscribe((item: any) => {
        console.log('basicLineSeries.item : ', item);
    });

    const labelSeries = new LabelSeries({
        selector: 'sales-label',
        yField: 'sales',
        xField: 'salesperson'
    });

    const basicLineSeries2 = new BasicLineSeries({
        selector: 'basic-line-assets',
        dotSelector: 'basic-line-assets-dot',
        yField: 'assets',
        xField: 'salesperson'
    });
    basicLineSeries2.$currentItem.subscribe((item: any) => {
        console.log('basicLineSerie2s.item : ', item);
    });

    const plotSeries = new BasicPlotSeries({
        selector: 'plot-series',
        yField: 'sales',
        xField: 'date',
        style: {
            fill: '#ff00ff',
            stroke: '#fff'
        }
    });

    const basicChart: BasicChart = new BasicChart({
        selector: '#chart',
        calcField: 'sales',
        data: data.map((item: SalesModel) => {
            item.date = parseTime(item.dateStr);
            return item;
        }),
        margin: {
            top: 40
        },
        isResize: 'Y',
        min: 0,
        max: max(data.map((item: SalesModel) => item.assets)),
        axes: [
            {
                field: 'salesperson',
                type: 'string',
                placement: 'bottom',
                padding: 0.2,
                // domain: data.map((item: any) => item.salesperson)
            },
            {
                field: 'sales',
                type: 'number',
                placement: 'left'
            },
            {
                field: 'date',
                type: 'time',
                placement: 'top',
                // tickFormat: '%y/%m/%d'
            }
        ],
        series: [
            verticalBarSeries,
            basicLineSeries,
            basicLineSeries2,
            labelSeries,
            plotSeries
        ]
    }).draw();
};

const boxplot = () => {
    // data setup
    const groupCounts = {};
    const globalCounts = [];
    const meanGenerator = randomUniform(10);

    for(let i = 0; i < data.length; i++) {
        const randomMean = meanGenerator();
        const generator = randomNormal(randomMean);
        const key = data[i].salesperson;
        groupCounts[key] = [];

        for(let j = 0; j < 100; j++) {
            const entry = generator();
            groupCounts[key].push(entry);
            globalCounts.push(entry);
        }
    }

    // Sort group counts so quantile methods work
    for(let key in groupCounts) {
        const groupCount = groupCounts[key];
        groupCounts[key] = groupCount.sort((a: number, b: number) => {
            return a - b;
        });
    }

    // Setup a color scale for filling each box
    const colorScale = scaleOrdinal(schemeCategory10)
        .domain(Object.keys(groupCounts));

    // Prepare the data for the box plots
    const boxPlotData = [];
    for (let [key, groupCount] of Object.entries(groupCounts)) {
        const tempCounts: Array<string> = (groupCount as Array<number>).map((num) => num + '');
        const localMin = min(tempCounts);
        const localMax = max(tempCounts);

        var obj = {};
        obj['key'] = key;
        obj['counts'] = groupCount;
        obj['quartile'] = boxQuartiles(groupCount);
        obj['whiskers'] = [parseFloat(localMin), parseFloat(localMax)];
        obj['color'] = colorScale(key);
        boxPlotData.push(obj);
    }

    const boxplotSeries = new BasicBoxplotSeries({
        xField: 'key',
        maxWidth: 20
    })

    const boxPlotChart = new BasicChart({
        selector: '#boxplot',
        data: boxPlotData,
        isResize: 'Y',
        min: min(globalCounts),
        max: max(globalCounts),
        axes: [
            {
                field: 'key',
                type: 'string',
                placement: 'bottom',
                padding: 0.2,
                // domain: data.map((item: any) => item.salesperson)
            },
            {
                field: 'sales',
                type: 'number',
                placement: 'left'
            }
        ],
        series: [
            boxplotSeries
        ]
    }).draw();
};

const boxQuartiles = (d: any) => {
    return [
        quantile(d, .25),
        quantile(d, .5),
        quantile(d, .75)
    ];
}

const bollinger = () => {
    const parseTime = timeParse('%m/%d/%Y');

    bollingerData.forEach((item: any) => {
        item.date = parseTime(item.date);
        item.close = +item.close;
    });
    const bollingerChartData = getBollingerBands(20, 2, bollingerData);

    const bollingerBandSeries = new BasicBollingerBandSeries({
        xField: 'key'
    });

    const lineSeries = new BasicLineSeries({
        selector: 'bollinger-line',
        xField: 'key',
        yField: 'close',
        isDot: false
    });

    const bollingerChart = new BasicChart({
        selector: '#bollinger',
        data: bollingerChartData,
        isResize: 'Y',
        min: min(bollingerChartData, (d: any) => { return d.low; }),
        max: max(bollingerChartData, (d: any) => { return d.high; }),
        axes: [
            {
                field: 'close',
                type: 'number',
                placement: 'left'
            },
            {
                field: 'key',
                type: 'time',
                placement: 'bottom'
            }
        ],
        series: [
            bollingerBandSeries,
            lineSeries
        ]
    }).draw();
}

// test 용
const getBollingerBands = (n: number, k: number, data: Array<any>) => {
    const bands = []; //{ ma: 0, low: 0, high: 0 }
    for (let i = n - 1, len = data.length; i < len; i++) {
        const slice = data.slice(i + 1 - n , i);
        let meanData = mean(slice, (d: any) => { return d.close; });
        const stdDev = Math.sqrt(mean(slice.map((d: any) =>{
            return Math.pow(d.close - meanData, 2);
        })));
        bands.push({ 
            key: data[i].date,
            ma: meanData,
            low: meanData - (k * stdDev),
            high: meanData + (k * stdDev) ,
            close: data[i].close
        });
    }
    return bands;
}

const violin = () => {
    // https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/iris.csv
    // ./component/mock-data/iris.csv
    csv('./component/mock-data/iris.csv', (data: any) => {
        return data;
    }).then((data: any) => {
        const violinSeries = new BasicViolinSeries({
            selector: 'basic-violin',
            xField: 'Species',
            yField: 'Sepal_Length'
        });

        const violinChart = new BasicChart({
            selector: '#violin',
            data: data,
            isResize: 'Y',
            min: 0,
            max: 10,
            axes: [
                {
                    field: 'Species',
                    type: 'string',
                    placement: 'bottom',
                    padding: 0.2,
                    domain: ['setosa', 'versicolor', 'virginica']
                },
                {
                    field: 'Sepal_Length',
                    type: 'number',
                    placement: 'left'
                }
            ],
            series: [
                violinSeries
            ]
        }).draw();
    })
}

const stackedBar = () => {
    csv('./component/mock-data/age-groups.csv', (d: any, index: number, columns: Array<string>) => {
        for (let i = 1, t = 0; i < columns.length; ++i) {
            t += d[columns[i]] = +d[columns[i]];
            d.total = t;
        }
        return d;
    })
    .then((data) => {
        data.sort((a, b) => { return b.total - a.total; });

        const stackedVerticalBarSeries = new StackedVerticalBarSeries({
            xField: 'State',
            yField: 'total',
            columns: data.columns
        });

        const stackedBarChart = new BasicChart({
            selector: '#stackedBar',
            data: data,
            min: 0,
            max: max(data, (d: any) => d.total),
            margin: {
                left: 65
            },
            isResize: 'Y',
            axes: [
                {
                    field: 'State',
                    type: 'string',
                    placement: 'bottom',
                    padding: 0.2
                },
                {
                    field: 'total',
                    type: 'number',
                    placement: 'left',
                    isRound: true,
                    tickFormat: ',d'
                }
            ],
            series: [
                stackedVerticalBarSeries
            ]
        }).draw();
    })
    .catch((error: any) => {
        console.log('Error : ', error);
    });
}

const groupedBar = () => {
    csv('./component/mock-data/grouped-bar-data.csv', (d: any, index: number, columns: Array<string>) => {
        for (let i = 1, t = 0; i < columns.length; ++i) {
            t += d[columns[i]] = +d[columns[i]];
            d.total = t;
        }
        return d;
    })
    .then((data) => {
        const groupedVerticalBarSeries = new GroupedVerticalBarSeries({
            xField: 'State',
            columns: data.columns
        });

        const groupedBarChart = new BasicChart({
            selector: '#groupedBar',
            data: data,
            margin: {
                left: 65
            },
            min: -2000000,
            max: max(data, d => max(data.columns.slice(1), key => d[key])),
            isResize: 'Y',
            axes: [
                {
                    field: 'State',
                    type: 'string',
                    placement: 'bottom',
                    padding: 0.1
                },
                {
                    field: 'total',
                    type: 'number',
                    placement: 'left',
                    tickFormat: 's',
                    isRound: true
                }
            ],
            series: [
                groupedVerticalBarSeries
            ]
        }).draw();
    })
    .catch((error: any) => {
        console.log('Error : ', error);
    });
}

excute();

boxplot();

bollinger();

violin();

stackedBar();

groupedBar();