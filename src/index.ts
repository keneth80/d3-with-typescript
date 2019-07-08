import './style.css';

import { min, max } from 'd3-array';
import { DocumentSelectionExample } from './component/document-selection-example';
import { BasicChart } from './component/basic-chart';
import { VerticalBarSeries } from './component/series/vertical-bar-series';
import { BasicLineSeries } from './component/series/basic-line-series';
import { LabelSeries } from './component/series/label-series';

class SalesModel {
    salesperson: string;
    sales: number;
    assets: number;

    constructor(
        salesperson: string,
        sales: number,
        assets: number
    ) {
        Object.assign(this, {
            salesperson,
            sales,
            assets
        });
    }

    static clone({
        salesperson,
        sales,
        assets
    }): SalesModel {
        return new SalesModel(salesperson, sales, assets);
    }
}

const data: Array<SalesModel> = [
    new SalesModel('Bob', 33, 80),
    new SalesModel('Robin', 12, 40),
    new SalesModel('Anne', 41, 90),
    new SalesModel('Mark', 16, 50),
    new SalesModel('Joe', 59, 95),
    new SalesModel('Eve', 38, 60),
    new SalesModel('Karen', 21, 55),
    new SalesModel('Kirsty', 25, 37),
    new SalesModel('Chris', 30, 50),
    new SalesModel('Lisa', 47, 77),
    new SalesModel('Tom', 5, 25),
    new SalesModel('Stacy', 20, 40),
    new SalesModel('Charles', 13, 35),
    new SalesModel('Mary', 29, 67)
];

const excute = () => {
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
    })

    const basicLineSeries2 = new BasicLineSeries({
        selector: 'basic-line-assets',
        dotSelector: 'basic-line-assets-dot',
        yField: 'assets',
        xField: 'salesperson'
    });
    basicLineSeries2.currentItem.subscribe((item: any) => {
        console.log('basicLineSerie2s.item : ', item);
    });

    const basicChart: BasicChart = new BasicChart({
        selector: '#chart',
        calcField: 'sales',
        data: data,
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
        ],
        series: [
            verticalBarSeries,
            basicLineSeries,
            basicLineSeries2,
            labelSeries
        ]
    }).draw();
};

excute();