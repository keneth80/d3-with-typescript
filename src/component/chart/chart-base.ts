import '../../chart.css'

import { min, max, extent } from 'd3-array';
import { scaleBand, scaleLinear, scaleTime, scalePoint } from 'd3-scale';
import { select, event, Selection, BaseType } from 'd3-selection';
import { axisBottom, axisLeft, axisTop, axisRight } from 'd3-axis';
import { fromEvent, Subscription, Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IChart } from './chart.interface';
import { ChartConfiguration, Axis, Margin } from './chart-configuration';
import { ISeries } from './series.interface';

export interface ISeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
}

export interface Scale {
    orinet: string;
    scale: any;
}

export class ChartBase<T = any> implements IChart {

    protected data: Array<T> = [];

    protected scales: Array<Scale> = [];

    public min: number = 0;

    public max: number = Infinity;

    protected width: number;

    protected height: number;

    protected originalData: any;

    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected svgWidth: number = 0;

    protected svgHeight: number = 0;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected xAxisGroup: Selection<BaseType, any, HTMLElement, any>;

    protected xTopAxisGroup: Selection<BaseType, any, HTMLElement, any>;

    protected yAxisGroup: Selection<BaseType, any, HTMLElement, any>;

    protected yRightAxisGroup: Selection<BaseType, any, HTMLElement, any>;

    protected seriesList: Array<ISeries> = [];

    protected subscription: Subscription;

    protected chartClickSubject: Subject<any> = new Subject();

    protected margin: Margin = {
        top: 20, left: 30, bottom: 40, right: 20
    };

    private config: ChartConfiguration;

    constructor(
        configuration: ChartConfiguration
    ) {
        this.config = configuration;
        this.bootstrap();
    }

    get chartData(): Array<T> {
        return this.data;
    }

    set chartData(value: Array<T>) {
        this.data = value;
    }

    chartClick() {
        return this.chartClickSubject.asObservable();
    }

    bootstrap() {
        // initialize size setup
        if (this.config.margin) {
            Object.assign(this.margin, this.config.margin);
        }

        this.svg = select(this.config.selector);

        this.setRootSize();

        // data setup origin data 와 분리.
        this.data = this.setupData(this.config.data);

        let targetValues: Array<number> = undefined;

        // setup min value
        if (!this.config.hasOwnProperty('min')) {
            if (this.config.calcField) {
                targetValues = this.data.map((item: T) => parseFloat(item[this.config.calcField]));
            } else {
                new Error('please setup configuration calcField because min, max value');
            }

            this.min = min(targetValues);
        } else {
            this.min = this.config.min;
        }

        // setup max value
        if (!this.config.hasOwnProperty('max')) {
            if (!this.config.calcField) {
                new Error('please setup configuration calcField because min, max value')
            } else {
                if (!targetValues || !targetValues.length) {
                    targetValues = this.data.map((item: T) => parseFloat(item[this.config.calcField]));
                }
            }

            this.max = max(targetValues);
        } else {
            this.max = this.config.max;
        }

        if (this.config.series) {
            this.seriesList = this.config.series;
        }
        
        this.makeContainer();
        this.addEventListner();
    }

    draw() {
        this.updateDisplay();

        return this;
    }

    destroy() {
        this.subscription.unsubscribe();
        if (this.svg) {
            this.svg.on('click', null);
        }
        this.data.length = 0;
    }

    protected setRootSize() {
        this.svgWidth = parseFloat(this.svg.style('width'));
        this.svgHeight = parseFloat(this.svg.style('height'));

        this.width = this.svgWidth - this.margin.left - this.margin.right,
        this.height = this.svgHeight - this.margin.top - this.margin.bottom;
    }

    protected makeContainer() {
        this.mainGroup = this.svg.append('g')
            .attr('class', 'main-group')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        this.xAxisGroup = this.mainGroup.append('g')
            .attr('class', 'x-axis-group')
            .attr('transform', `translate(0, ${this.height})`);

        this.xTopAxisGroup = this.mainGroup.append('g')
            .attr('class', 'x-top-axis-group')
            .attr('transform', `translate(0, 0)`);

        this.yAxisGroup = this.mainGroup.append('g')
            .attr('class', 'y-axis-group');

        this.yRightAxisGroup = this.mainGroup.append('g')
            .attr('class', 'y-right-axis-group')
            .attr('transform', `translate(${this.width - this.margin.right}, 0)`);
    }

    protected addEventListner() {
        this.svg.on('click', this.chartCanvasClick);
        this.subscription = new Subscription();
        if (this.config.isResize && this.config.isResize === 'Y') {
            const resizeEvent = fromEvent(window, 'resize').pipe(debounceTime(500));
            this.subscription.add(
                resizeEvent.subscribe(this.resizeEventHandler)
            );
        }
    }

    protected chartCanvasClick = () => {
        this.chartClickSubject.next();
    }

    protected updateAxis() {
        this.scales = this.setupScale(this.config.axes);

        const bottom = this.scales.find((scale: Scale) => scale.orinet === 'bottom');
        if (bottom) {
            this.xAxisGroup.call(
                axisBottom(bottom.scale)
            )
        }

        const left = this.scales.find((scale: Scale) => scale.orinet === 'left');
        if (left) {
            this.yAxisGroup.call(
                axisLeft(left.scale)
            )
        }

        // special
        const top = this.scales.find((scale: Scale) => scale.orinet === 'top');
        if (top) {
            this.xTopAxisGroup.call(
                axisTop(top.scale)
            )
        }

        const right = this.scales.find((scale: Scale) => scale.orinet === 'right');
        if (right) {
            this.yRightAxisGroup.call(
                axisRight(right.scale)
            )
        }
    }

    protected updateSeries() {
        try {
            if (this.seriesList && this.seriesList.length) {
                this.seriesList.map((series: ISeries) => {
                    series.chartBase = this;
                    series.setSvgElement(this.svg, this.mainGroup);
                    series.drawSeries(this.data, this.scales, this.width, this.height);
                });
            }
        } catch(error) {
            if (console && console.log) {
                console.log(error);
            }
        }
    }

    protected updateDisplay() {
        this.updateAxis();
        this.updateSeries();
    }

    protected setupData(data: Array<T>) {
        this.originalData = [...data];
        return data;
    }

    protected setupScale(axes: Array<Axis> = []): Array<{orinet:string, scale:any, visible?: boolean}> {
        const returnAxes: Array<{orinet:string, scale:any, visible?: boolean}> = [];
        axes.map((axis: Axis) => {
            let range = <any>[];
            if (axis.placement === 'bottom' || axis.placement === 'top') {
                range = [0, this.width];
            } else {
                range = [this.height, 0];
            }

            let scale = null;
            if (axis.type === 'string') {
                scale = scaleBand().range(range).padding(axis.padding ? +axis.padding : 0.1);
                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    scale.domain(
                        this.data.map((item: T) => item[axis.field])
                    );
                }
            } else if (axis.type === 'point') {
                scale = scalePoint().range(range).padding(axis.padding ? +axis.padding : 0.1);
                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    scale.domain(
                        this.data.map((item: T) => item[axis.field])
                    );
                }
            } else if (axis.type === 'time') {
                scale = scaleTime().range(range);
                scale.domain(extent(this.data, (item: T) => item[axis.field]));
            } else {
                scale = scaleLinear().range(range);
                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    if (!this.max) {
                        this.max = max(this.data.map((item: T) => parseFloat(item[axis.field])));
                    }
                    scale.domain(
                        [this.min, this.max]
                    );
                }
            }

            returnAxes.push({
                orinet: axis.placement,
                scale
            });
        });
        return returnAxes;
    }

    protected resizeEventHandler = () => {
        
        if (!this.svg) return;

        this.setRootSize();

        this.updateDisplay();
    }

}