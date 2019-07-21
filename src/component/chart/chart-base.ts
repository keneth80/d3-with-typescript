import '../../chart.css'

import { min, max, extent } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import { format } from 'd3-format';
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
    type: string;
    visible: boolean;
    tickFormat?: string;
}

export class ChartBase<T = any> implements IChart {
    public min: number = 0;

    public max: number = Infinity;

    protected data: Array<T> = [];

    protected svgWidth: number = 0;

    protected svgHeight: number = 0;

    protected scales: Array<Scale> = [];
    
    protected width: number;

    protected height: number;

    protected originalData: any;

    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected seriesList: Array<ISeries> = [];

    protected subscription: Subscription;

    protected chartClickSubject: Subject<any> = new Subject();

    protected tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    protected margin: Margin = {
        top: 20, left: 30, bottom: 40, right: 20
    };

    protected axisGroups: any = {
        top: null, left: null, bottom: null, right: null
    };

    private config: ChartConfiguration;

    private isTooltip: boolean = false;

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

    get chartMargin(): any {
        return this.margin;
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

    showTooltip(): Selection<BaseType, any, HTMLElement, any> {
        this.tooltipGroup.style('display', null);
        this.drawTooltip();
        return this.tooltipGroup;
    }

    hideTooltip(): Selection<BaseType, any, HTMLElement, any> {
        this.tooltipGroup.style('display', 'none');
        return this.tooltipGroup;
    }

    drawTooltip() {
        if (this.isTooltip) {
            return;
        }

        this.isTooltip = true;

        this.tooltipGroup.selectAll('.tooltip-background')
            .data(['background'])
            .join(
                (enter) => enter.append('rect').attr('class', '.tooltip-background'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 60)
            .attr('height', 20)
            .attr('fill', 'white')
            .style('stroke', '#000')
            .style('fill-opacity', 0.6);

        this.tooltipGroup.selectAll('.tooltip-text')
            .data(['text'])
            .join(
                (enter) => enter.append('text').attr('class', '.tooltip-text'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('x', 5)
            .attr('dy', '1.2em')
            .style('text-anchor', 'start')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold');
    }

    destroy() {
        this.subscription.unsubscribe();
        if (this.svg) {
            this.svg.on('click', null);
            this.svg.selectAll('*').remove();
        }
        this.originalData.length = 0;
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

        this.axisGroups.bottom = this.mainGroup.append('g')
            .attr('class', 'x-axis-group')
            .attr('transform', `translate(0, ${this.height})`);

        this.axisGroups.top = this.mainGroup.append('g')
            .attr('class', 'x-top-axis-group')
            .attr('transform', `translate(0, 0)`);

        this.axisGroups.left = this.mainGroup.append('g')
            .attr('class', 'y-axis-group');

        this.axisGroups.right = this.mainGroup.append('g')
            .attr('class', 'y-right-axis-group')
            .attr('transform', `translate(${this.width - this.margin.right}, 0)`);

        this.tooltipGroup = this.svg.append('g')
            .attr('class', 'tooltip-group')
            .style('display', 'none');
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

        this.scales.map((scale: Scale) => {
            let orientedScale: any = null;
            if (scale.orinet === 'right') {
                orientedScale = axisRight(scale.scale);
            } else if (scale.orinet === 'left') {
                orientedScale = axisLeft(scale.scale);
            } else if (scale.orinet === 'top') {
                orientedScale = axisTop(scale.scale);
            } else {
                orientedScale = axisBottom(scale.scale);
            }

            if (scale.type === 'number') {
                if (scale.tickFormat) {
                    orientedScale.ticks(null, scale.tickFormat);
                    // orientedScale.tickFormat(timeFormat(scale.tickFormat));
                }
            } else if (scale.type === 'time') {
                if (scale.tickFormat) {
                    orientedScale.tickFormat(timeFormat(scale.tickFormat));
                }
            }

            if (scale.visible) {
                this.axisGroups[scale.orinet].call(
                    orientedScale
                );
            }
        });
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

    protected setupScale(axes: Array<Axis> = []): Array<Scale> {
        const returnAxes: Array<Scale> = [];
        axes.map((axis: Axis) => {
            let range = <any>[];
            if (axis.placement === 'bottom' || axis.placement === 'top') {
                range = [0, this.width];
            } else {
                range = [this.height, 0];
            }

            let scale = null;
            if (axis.type === 'string') {
                scale = scaleBand().range(range).padding(axis.padding ? +axis.padding : 0);
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
                    if (axis.isRound === true) {
                        scale.domain(
                            [this.min, this.max]
                        ).nice();
                    } else {
                        scale.domain(
                            [this.min, this.max]
                        );
                    }
                    
                }
            }

            returnAxes.push({
                orinet: axis.placement,
                scale,
                type: axis.type,
                visible: axis.visible === false ? false : true,
                tickFormat: axis.tickFormat ? axis.tickFormat : undefined
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