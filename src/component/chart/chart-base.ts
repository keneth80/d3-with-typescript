import '../../chart.css';

import { min, max, extent } from 'd3-array';
import { timeSecond } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import { scaleBand, scaleLinear, scaleTime, scalePoint } from 'd3-scale';
import { select, Selection, BaseType, event } from 'd3-selection';
import { axisBottom, axisLeft, axisTop, axisRight } from 'd3-axis';
import { brushX, brushY } from 'd3-brush';

import { fromEvent, Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IChart } from './chart.interface';
import { ChartConfiguration, Axis, Margin } from './chart-configuration';
import { ISeries } from './series.interface';
import { guid } from './util/d3-svg-util';
import { IFunctions } from './functions.interface';

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
    isGridLine: boolean;
    isZoom: boolean;
    min?: number;
    max?: number;
}

export class ChartBase<T = any> implements IChart {
    public isResize: boolean = false;

    protected data: Array<T> = [];

    protected svgWidth: number = 0;

    protected svgHeight: number = 0;

    protected scales: Array<Scale> = [];
    
    protected width: number;

    protected height: number;

    protected originalData: any;

    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected seriesGroup: Selection<BaseType, any, HTMLElement, any>;

    protected seriesList: Array<ISeries> = [];

    protected functionList: Array<IFunctions> = [];

    protected subscription: Subscription;

    protected chartClickSubject: Subject<any> = new Subject();

    protected tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    protected margin: Margin = {
        top: 20, left: 40, bottom: 40, right: 20
    };

    protected axisGroups: any = {
        top: null, left: null, bottom: null, right: null
    };

    private config: ChartConfiguration;

    private isTooltip: boolean = false;

    private clipPath: Selection<BaseType, any, HTMLElement, any>;

    private originDomains: any = {};

    private idleTimeout: any;

    private maskId: string;

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

        if (this.config.series && this.config.series.length) {
            this.seriesList = this.config.series;
        }

        if (this.config.functions && this.config.functions.length) {
            this.functionList = this.config.functions;
        }

        this.maskId = guid();
        
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
        this.originDomains = null;
        this.originalData.length = 0;
        this.data.length = 0;
    }

    updateSeries() {
        try {
            if (this.seriesList && this.seriesList.length) {
                this.seriesList.map((series: ISeries) => {
                    series.chartBase = this;
                    series.setSvgElement(this.svg, this.seriesGroup);
                    series.drawSeries(this.data, this.scales, this.width, this.height);
                });
            }
        } catch(error) {
            if (console && console.log) {
                console.log(error);
            }
        }
    }

    updateAxisForZoom(
        reScale: Array<any>
    ) {
        this.scales = this.setupScale(this.config.axes, this.width, this.height, reScale);

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

            if (scale.isGridLine) {
                if (scale.orinet === 'right' || scale.orinet === 'left') {
                    orientedScale.tickSize(-this.width);
                } else {
                    orientedScale.tickSize(-this.height);
                }
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
        
        this.updateSeries();
    }

    updateRescaleAxis() {
        this.scales.map((scale: Scale) => {
            let orientedScale: any = null;
            if (scale.orinet === 'right') {
                orientedScale = axisRight(scale.scale);
            } else if (scale.orinet === 'left') {
                orientedScale = axisLeft(scale.scale);
                // orientedScale.tickSize(-this.width);
                // orientedScale.ticks(5);
            } else if (scale.orinet === 'top') {
                orientedScale = axisTop(scale.scale);
            } else {
                orientedScale = axisBottom(scale.scale);
                // orientedScale.tickSize(-this.height);
                // orientedScale.ticks(5);
            }

            if (scale.isGridLine) {
                if (scale.orinet === 'right' || scale.orinet === 'left') {
                    orientedScale.tickSize(-this.width);
                } else {
                    orientedScale.tickSize(-this.height);
                }
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

            if (scale.isZoom === true) {
                this.setupBrush(scale);
            }
        });
    }

    protected updateFunctions() {
        try {
            if (this.functionList && this.functionList.length) {
                this.functionList.map((functionItem: IFunctions) => {
                    functionItem.chartBase = this;
                    functionItem.setSvgElement(this.svg, this.seriesGroup);
                    functionItem.drawFunctions(this.data, this.scales, this.width, this.height);
                });
            }
        } catch(error) {
            if (console && console.log) {
                console.log(error);
            }
        }
    }

    protected setRootSize() {
        this.svgWidth = parseFloat(this.svg.style('width'));
        this.svgHeight = parseFloat(this.svg.style('height'));

        this.width = this.svgWidth - this.margin.left - this.margin.right,
        this.height = this.svgHeight - this.margin.top - this.margin.bottom;
    }

    protected makeContainer() {
        this.clipPath = this.svg.append('defs')
            .append('svg:clipPath')
                .attr('id', this.maskId)
                .append('rect')
                .attr('width', this.width)
                .attr('height', this.height)
                .attr('x', 0)
                .attr('y', 0);

        this.mainGroup = this.svg.append('g')
            .attr('class', 'main-group')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        this.seriesGroup = this.svg.append('g')
            .attr('class', 'series-group')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
            .attr('clip-path', `url(#${this.maskId})`);

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
        this.originDomains = {};

        this.scales = this.setupScale(this.config.axes, this.width, this.height);

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

            if (scale.isGridLine) {
                if (scale.orinet === 'right' || scale.orinet === 'left') {
                    orientedScale.tickSize(-this.width);
                } else {
                    orientedScale.tickSize(-this.height);
                }
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

            if (scale.isZoom === true) {
                this.setupBrush(scale);
            }
        });
    }

    protected setupBrush(scale: any) {
        let brush = null;
        if (scale.type === 'number' || scale.type === 'time') {
            if (scale.orinet === 'right' || scale.orinet === 'left') {
                let left = 0;
                let width = 0;

                if (scale.orinet === 'left') {
                    left = -1 * this.margin.left;
                } else {
                    width = this.width;
                }

                brush = brushY()
                    .extent([ [left, 0], [width, this.height] ]);
            } else {
                let top = 0;
                let height = 0;

                // top margin 때문에 처리.
                if (scale.orinet === 'top') {
                    top = this.margin.top * -1;
                } else {
                    height = this.margin.bottom;
                }

                brush = brushX()
                    .extent([ [0, top], [this.width, height] ]);
            }
            brush.on('end', () => {
                this.updateBrushHandler(scale.orinet, brush);
            });
        }

        if (brush) {
            if (!this.axisGroups[scale.orinet].select('.brush' + scale.orinet).node()) {
                this.axisGroups[scale.orinet].append('g')
                    .attr('class', 'brush' + scale.orinet);
            }
            this.axisGroups[scale.orinet].select('.brush' + scale.orinet).call(
                brush
            );
        }
    }

    protected updateDisplay() {
        this.updateAxis();
        this.updateSeries();
        // POINT: 해당 기능이 series에 의존함으로 series를 먼저 그린뒤에 function을 설정 하도록 한다.
        this.updateFunctions(); 
    }

    protected setupData(data: Array<T>) {
        this.originalData = [...data];
        return data;
    }

    protected setupScale(
        axes: Array<Axis> = [],
        width: number = 0,
        height: number = 0,
        reScaleAxes: Array<any> = []
    ): Array<Scale> {
        const returnAxes: Array<Scale> = [];
        axes.map((axis: Axis) => {
            let range = <any>[];
            if (axis.placement === 'bottom' || axis.placement === 'top') {
                range = [0, width];
            } else {
                range = [height, 0];
            }

            let scale = null;
            if (axis.type === 'string') {
                scale = scaleBand().range(range).padding(axis.padding ? +axis.padding : 0).paddingOuter(0.1);
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
                if (!axis.max) {
                    axis.max = max(this.data.map((item: T) => parseFloat(item[axis.field])));
                }

                if (!axis.min) {
                    axis.min = min(this.data.map((item: T) => parseFloat(item[axis.field])));
                }

                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    if (reScaleAxes.length) {
                        const reScale = reScaleAxes.find((d: any) => d.field === axis.field);
                        const reScaleMin = +reScale.min.toFixed(2);
                        const reScaleMax = +reScale.max.toFixed(2);

                        if (axis.isRound === true) {
                            scale.domain(
                                [reScaleMin, reScaleMax]
                            ).nice();
                        } else {
                            scale.domain(
                                [reScaleMin, reScaleMax]
                            );
                        }
                    } else {
                        // TODO : index string domain 지정.
                        if (axis.isRound === true) {
                            scale.domain(
                                [axis.min, axis.max]
                            ).nice();
                        } else {
                            scale.domain(
                                [axis.min, axis.max]
                            );
                        }
                    }
                }
            }

            returnAxes.push({
                orinet: axis.placement,
                scale,
                type: axis.type,
                visible: axis.visible === false ? false : true,
                tickFormat: axis.tickFormat ? axis.tickFormat : undefined,
                isGridLine: axis.isGridLine === true ? true : false,
                isZoom: axis.isZoom === true ? true : false
            });
        });
        return returnAxes;
    }

    protected updateBrushHandler(orient: string = 'bottom', brush: any) {
        const extent = event.selection;
        const axis: any = this.scales.find((scale: Scale) => scale.orinet === orient).scale;

        if (!extent) {
            if (!this.idleTimeout) return this.idleTimeout = setTimeout(this.idled, 350);
            if (this.originDomains[orient]) {
                axis.domain([this.originDomains[orient][0], this.originDomains[orient][1]]);
            }
        } else {
            if (!this.originDomains[orient]) {
                this.originDomains[orient] = axis.domain();
            }

            let domainStart = 0;
            let domainEnd = 0;

            if (orient === 'top' || orient === 'bottom') {
                domainStart = axis.invert(extent[0]);
                domainEnd = axis.invert(extent[1]);
            } else { // left, right 는 아래에서 위로 정렬이기 때문.
                domainStart = axis.invert(extent[1]);
                domainEnd = axis.invert(extent[0]);
            }

            axis.domain([ domainStart, domainEnd ]);
            this.axisGroups[orient].select('.brush' + orient).call(
                brush.move, null
            );
        }

        let currnetAxis: any = null;

        if (orient === 'left') {
            currnetAxis = axisLeft(axis);
        } else if (orient === 'right') {
            currnetAxis = axisRight(axis);
        } else if (orient === 'top') {
            currnetAxis = axisTop(axis);
        } else {
            currnetAxis = axisBottom(axis);
        }

        this.axisGroups[orient].transition().duration(1000).call(currnetAxis);

        this.updateSeries();
    }

    protected idled = () => { 
        this.idleTimeout = null; 
    }

    protected resizeEventHandler = () => {
        
        if (!this.svg) return;

        this.isResize = true;

        this.setRootSize();

        this.clipPath.attr('width', this.width)
                .attr('height', this.height)
                .attr('x', 0)
                .attr('y', 0);

        this.updateDisplay();

        this.isResize = false;
    }

}
