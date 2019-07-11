import './style.css';

import { min, max, quantile } from 'd3-array';
import { randomUniform, randomNormal } from 'd3-random';
import { scaleOrdinal, scaleQuantile } from 'd3-scale';
import { timeParse } from 'd3-time-format';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { DocumentSelectionExample } from './component/document-selection-example';
import { BasicChart } from './component/basic-chart';
import { VerticalBarSeries } from './component/series/vertical-bar-series';
import { BasicLineSeries } from './component/series/basic-line-series';
import { LabelSeries } from './component/series/label-series';
import { BasicPlotSeries } from './component/series/basic-plot-series';
import { BasicBoxplotSeries } from './component/series/basic-boxplot-series';

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
    verticalBarSeries.currentItem.subscribe((item: any) => {
        console.log('verticalBarSeries.item : ', item);
    });

    const basicLineSeries = new BasicLineSeries({
        selector: 'basic-line-sales',
        dotSelector: 'basic-line-sales-dot',
        yField: 'sales',
        xField: 'salesperson'
    });
    basicLineSeries.currentItem.subscribe((item: any) => {
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
    basicLineSeries2.currentItem.subscribe((item: any) => {
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
                placement: 'top'
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

    console.log('groupCounts : ', groupCounts);

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

    console.log('boxPlotData : ', boxPlotData);

    const boxplotSeries = new BasicBoxplotSeries({
        xField: 'key'
    })

    const boxPlotChart = new BasicChart({
        selector: '#boxplot',
        data: boxPlotData,
        margin: {
            top: 40
        },
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
            },
            {
                field: 'date',
                type: 'time',
                placement: 'top'
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

excute();

boxplot();