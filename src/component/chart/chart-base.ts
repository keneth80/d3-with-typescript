import './chart.css';

import { min, max, extent } from 'd3-array';
import { timeSecond } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import { scaleBand, scaleLinear, scaleTime, scalePoint, scaleOrdinal, ScaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { select, Selection, BaseType, event } from 'd3-selection';
import { axisBottom, axisLeft, axisTop, axisRight } from 'd3-axis';
import { brushX, brushY } from 'd3-brush';

import { fromEvent, Subscription, Subject, of, Observable, Observer } from 'rxjs';
import { debounceTime, delay } from 'rxjs/operators';

import { IChart } from './chart.interface';
import { ChartConfiguration, Axis, Margin, Placement, ChartTitle, ScaleType, Align, AxisTitle } from './chart-configuration';
import { ISeries } from './series.interface';
import { guid, textWrapping, getTextWidth, getMaxText, drawSvgCheckBox, getAxisByPlacement } from './util/d3-svg-util';
import { IFunctions } from './functions.interface';

export interface ISeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
}

export interface Scale {
    field: string;
    orient: string;
    scale: any;
    type: string;
    visible: boolean;
    tickFormat?: string;
    tickSize?: number;
    isGridLine: boolean;
    isZoom: boolean;
    min?: number;
    max?: number;
    title?: AxisTitle;
}

interface ContainerSize {
    width: number;
    height: number;
}

interface LegendItem {
    label: string; 
    selected: boolean;
    isHide: boolean;
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

    protected titleGroup: Selection<BaseType, any, BaseType, any>;

    protected legendGroup: Selection<BaseType, any, BaseType, any>;

    protected seriesList: Array<ISeries> = [];

    protected functionList: Array<IFunctions> = [];

    protected subscription: Subscription;

    protected chartClickSubject: Subject<any> = new Subject();

    protected tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    protected margin: Margin = {
        top: 30, left: 10, bottom: 30, right: 20
    }; // default margin

    protected defaultTitleStyle: any = {
        font: {
            family: 'Arial, Helvetica, sans-serif',
            size: 16,
            color: '#999'
        }
    };

    protected defaultLegendStyle: any = {
        font: {
            family: 'Arial, Helvetica, sans-serif',
            size: 12,
            color: '#999'
        }
    };

    protected defaultAxisLabelStyle: any = {
        font: {
            family: 'Arial, Helvetica, sans-serif',
            size: 12,
            color: '#000'
        }
    }

    protected defaultAxisTitleStyle: any = {
        font: {
            family: 'Arial, Helvetica, sans-serif',
            size: 14,
            color: '#000'
        }
    };

    private config: ChartConfiguration;

    private isTooltip: boolean = false;

    private clipPath: Selection<BaseType, any, HTMLElement, any>;

    private originDomains: any = {};

    private idleTimeout: any;

    private maskId: string;

    private colors: Array<string>;

    private isCustomMargin: boolean = false;

    // ===================== axis configuration start ===================== //
    private axisGroups: any = {
        top: null, left: null, bottom: null, right: null
    };

    private gridLineGroups: any = {
        top: null, left: null, bottom: null, right: null
    };

    private tickSize: number = 6;

    private tickPadding: number = 2;

    private axisTitleMargin: Margin = {
        top: 0, left: 0, bottom: 0, right: 0
    }; // axis title margin
    // ===================== axis configuration end ===================== //

    // ===================== Title configuration start ===================== //
    private isTitle: boolean = false;

    private titleContainerSize: ContainerSize = {
        width: 0, height: 0
    };

    private titlePlacement: string = Placement.TOP;
    // ===================== Title configuration end ===================== //

    // ===================== Legend configuration start ===================== //
    private isLegend: boolean = false;

    private legendPlacement: string = Placement.RIGHT;

    private legendItemSize: ContainerSize = {
        width: 10, height: 10
    };

    private legendContainerSize: ContainerSize = {
        width: 0, height: 0
    };

    private legendPadding: number = 5;

    private currentLegend: string = null;

    private currentLegendNode: any = null;

    private isCheckBox: boolean = true;

    private isAll: boolean = true;
    // ===================== Legend configuration end ===================== //

    constructor(
        configuration: ChartConfiguration
    ) {
        this.config = configuration;
        this.bootstrap(this.config);
    }

    get chartData(): Array<T> {
        return this.data;
    }

    set chartData(value: Array<T>) {
        this.data = value;
        this.draw();
    }

    get chartMargin(): any {
        return this.margin;
    }

    getColorBySeriesIndex(index: number): string {
        return this.colors[index];
    }

    chartClick() {
        return this.chartClickSubject.asObservable();
    }

    bootstrap(configuration: ChartConfiguration) {
        // initialize size setup
        if (configuration.margin) {
            Object.assign(this.margin, configuration.margin);
            this.isCustomMargin = true;
        } else {
            this.isCustomMargin = false;
        }

        this.svg = select(configuration.selector);

        if (!this.svg.node()) {
            if (console && console.log) {
                console.log('is not svg!');
            }
        }

        this.setRootSize();

        // data setup origin data 와 분리.
        this.data = this.setupData(configuration.data);

        if (configuration.series && configuration.series.length) {
            this.seriesList = configuration.series;
        }

        if (configuration.functions && configuration.functions.length) {
            this.functionList = configuration.functions;
        }

        if (configuration.colors && configuration.colors.length) {
            this.colors = this.config.colors;
        } else {
            this.colors = schemeCategory10.map((color: string) => color);
        }

        if (configuration.title) {
            this.isTitle = true;
            this.titlePlacement = configuration.title.placement;
        }

        if (configuration.legend) {
            this.isLegend = true;
            this.legendPlacement = configuration.legend.placement;
            this.isCheckBox = configuration.legend.isCheckBox === false ? configuration.legend.isCheckBox : true;
            this.isAll = configuration.legend.isAll === false ? configuration.legend.isAll : true;
        }

        this.maskId = guid();
        
        this.initContainer();
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
                this.seriesList.map((series: ISeries, index: number) => {
                    series.chartBase = this;
                    series.setSvgElement(this.svg, this.seriesGroup);
                    series.drawSeries(this.data, this.scales, this.width, this.height, index, this.colors[index]);
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

        this.updateRescaleAxis(false);
        
        this.updateSeries();
    }

    updateRescaleAxis(isZoom: boolean = true) {
        this.scales.map((scale: Scale) => {
            let orientedScale: any = null;
            if (scale.orient === Placement.RIGHT) {
                orientedScale = axisRight(scale.scale);
            } else if (scale.orient === Placement.LEFT) {
                orientedScale = axisLeft(scale.scale);
            } else if (scale.orient === Placement.TOP) {
                orientedScale = axisTop(scale.scale);
            } else {
                orientedScale = axisBottom(scale.scale);
            }

            // if (scale.isGridLine) {
            //     if (scale.orient === Placement.RIGHT || scale.orient === Placement.LEFT) {
            //         orientedScale.tickSize(-this.width);
            //     } else {
            //         orientedScale.tickSize(-this.height);
            //     }
            // }

            if (scale.type === ScaleType.NUMBER) {
                if (scale.tickFormat) {
                    orientedScale.ticks(null, scale.tickFormat);
                }
            } else if (scale.type === ScaleType.TIME) {
                if (scale.tickFormat) {
                    orientedScale.tickFormat(timeFormat(scale.tickFormat));
                }

                if (scale.tickSize) {
                    orientedScale.ticks(scale.tickSize);
                }
            }
            
            if (scale.visible) {
                this.axisGroups[scale.orient].call(
                    orientedScale
                );
            }

            if (isZoom && scale.isZoom === true) {
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

        // axis title check
        if (this.config.axes && this.config.axes.length) {
            const axisTitleHeight = 15;
            this.config.axes.forEach((axis: Axis) => {
                if (axis.title) {
                    this.axisTitleMargin[axis.placement] = axisTitleHeight;
                }
            });
        }

        this.width = this.svgWidth - (this.margin.left + this.margin.right) - (this.axisTitleMargin.left + this.axisTitleMargin.right);
        this.height = this.svgHeight - (this.margin.top + this.margin.bottom) - (this.axisTitleMargin.top + this.axisTitleMargin.bottom);

        if (this.isTitle) {
            this.titleContainerSize.width = this.titlePlacement === Placement.TOP || this.titlePlacement === Placement.BOTTOM ? this.width : 20;
            this.titleContainerSize.height = this.titlePlacement === Placement.TOP || this.titlePlacement === Placement.BOTTOM ? 20 : this.height;
            this.width = this.width - (this.titlePlacement === Placement.LEFT || this.titlePlacement === Placement.RIGHT ? 20 : 0);
            this.height = this.height - (this.titlePlacement === Placement.LEFT || this.titlePlacement === Placement.RIGHT ? 0 : 20);
        }

        if (this.isLegend) {
            const padding = 5;
            const targetText = getMaxText(this.seriesList.map((series: ISeries) => series.displayName || series.selector));
            const targetTextWidth = getTextWidth(targetText, this.defaultLegendStyle.font.size, this.defaultLegendStyle.font.family);
            const targetTextHeight = 15;

            this.legendContainerSize.width = this.legendPadding * 2 + this.legendItemSize.width + padding + Math.round(targetTextWidth) + (this.isCheckBox ? 15 : 0);
            this.legendContainerSize.height = 
                this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT ? 
                this.height : 
                this.legendPadding * 2 + targetTextHeight;
            
            this.width = this.width - (this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT ? this.legendContainerSize.width : 0);
            this.height = this.height - (this.legendPlacement === Placement.TOP || this.legendPlacement === Placement.BOTTOM ? this.legendContainerSize.height : 0);
        }
    }

    protected initContainer() {
        const x = this.margin.left + this.axisTitleMargin.left
            + (this.isTitle && this.titlePlacement === Placement.LEFT ? this.titleContainerSize.width : 0)
            + (this.isLegend && this.legendPlacement === Placement.LEFT ? this.legendContainerSize.width : 0);
        const y = this.margin.top + this.axisTitleMargin.top
            + (this.isTitle && this.titlePlacement === Placement.TOP ? this.titleContainerSize.height : 0)
            + (this.isLegend && this.legendPlacement === Placement.TOP ? this.legendContainerSize.height : 0);

        const width = this.width;
        const height = this.height;

        if (!this.clipPath) {
            this.clipPath = this.svg.append('defs')
                .append('svg:clipPath')
                    .attr('id', this.maskId)
                    .append('rect')
                    .attr('width', width)
                    .attr('height', height)
                    .attr('x', 0)
                    .attr('y', 0);
        }

        this.clipPath
            .attr('width', width)
            .attr('height', height)
            .attr('x', 0)
            .attr('y', 0);

        if (!this.mainGroup) {
            this.mainGroup = this.svg.append('g')
                .attr('class', 'main-group')
        }
        this.mainGroup.attr('transform', `translate(${x}, ${y})`);

        // grid line setup
        if (!this.gridLineGroups.bottom) {
            this.gridLineGroups.bottom = this.mainGroup.append('g')
                .attr('class', 'x-grid-group')
        }
        this.gridLineGroups.bottom.attr('transform', `translate(0, ${height})`);

        if (!this.gridLineGroups.top) {
            this.gridLineGroups.top = this.mainGroup.append('g')
                .attr('class', 'x-top-grid-group')
        }
        this.gridLineGroups.top.attr('transform', `translate(0, 0)`);
        
        if (!this.gridLineGroups.left) {
            this.gridLineGroups.left = this.mainGroup.append('g')
            .attr('class', 'y-grid-group')
        }

        if (!this.gridLineGroups.right) {
            this.gridLineGroups.right = this.mainGroup.append('g')
                .attr('class', 'y-right-grid-group')
        }
        this.gridLineGroups.right.attr('transform', `translate(${width}, 0)`);

        if (this.isTitle) {
            this.titleGroup = this.svg.selectAll('.title-group')
                .data([this.config.title])
                .join(
                    (enter) => enter.append('g').attr('class', 'title-group'),
                    (update) => update,
                    (exit) => exit.remove()
                );
        }

        if (this.isLegend) {
            if (!this.legendGroup) {
                this.legendGroup = this.svg.append('g').attr('class', 'legend-group');
            }
            let x = 0;
            this.legendGroup.attr('transform', () => {
                let translate = 'translate(0, 0)';
                if (this.legendPlacement === Placement.RIGHT) {
                    x = (this.margin.left + this.margin.right + this.axisTitleMargin.left + this.axisTitleMargin.right + width);
                    translate = `translate(${x}, ${y})`;
                } else if (this.legendPlacement === Placement.LEFT) {
                    x = (this.isTitle && this.titlePlacement === Placement.RIGHT ? this.titleContainerSize.width : 0);
                    translate = `translate(${x}, ${y})`;
                } else if (this.legendPlacement === Placement.TOP) {
                    translate = `translate(${this.margin.left}, ${this.titleContainerSize.height + this.legendPadding})`;
                } else {
                    x = this.margin.left;
                    let y = (this.margin.top + this.margin.bottom) + (this.axisTitleMargin.top + this.axisTitleMargin.bottom) + height;
                    if (this.isTitle && this.titlePlacement === Placement.TOP) {
                        y += this.titleContainerSize.height;
                    }
                    translate = `translate(${x}, ${y})`;
                }
                return translate;
            });
        }

        if (!this.seriesGroup) {
            this.seriesGroup = this.svg.append('g')
                .attr('class', 'series-group')
        }
        this.seriesGroup
            .attr('transform', `translate(${x}, ${y})`)
            .attr('clip-path', `url(#${this.maskId})`);

        // axis group setup
        if (!this.axisGroups.bottom) {
            this.axisGroups.bottom = this.mainGroup.append('g')
                .attr('class', 'x-axis-group')
        }
        this.axisGroups.bottom.attr('transform', `translate(0, ${height})`);

        if (!this.axisGroups.top) {
            this.axisGroups.top = this.mainGroup.append('g')
                .attr('class', 'x-top-axis-group')
        }
        this.axisGroups.top.attr('transform', `translate(0, 0)`);
        
        if (!this.axisGroups.left) {
            this.axisGroups.left = this.mainGroup.append('g')
            .attr('class', 'y-axis-group')
        }

        if (!this.axisGroups.right) {
            this.axisGroups.right = this.mainGroup.append('g')
                .attr('class', 'y-right-axis-group')
        }
        this.axisGroups.right.attr('transform', `translate(${width}, 0)`);

        if (!this.tooltipGroup) {
            this.tooltipGroup = this.svg.append('g')
                .attr('class', 'tooltip-group')
        }
        this.tooltipGroup.style('display', 'none');
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

    protected updateTitle() {
        if (this.titleGroup) {
            this.titleGroup.attr('transform', (d: ChartTitle) => {
                let titleX = 0;
                let titleY = 0;
                const padding = 5;
                if (d.placement === Placement.RIGHT) {
                    titleX = 
                        this.width + this.margin.left + this.margin.right + this.titleContainerSize.width +
                        (this.isLegend && (this.legendPlacement === Placement.RIGHT || this.legendPlacement === Placement.LEFT)? this.legendContainerSize.width : 0);
                    titleY = this.height;
                } else if (d.placement === Placement.LEFT) {
                    titleX = this.titleContainerSize.width;
                    titleY = this.height;
                } else if (d.placement === Placement.BOTTOM) {
                    titleY = 
                        this.height + (this.margin.top + this.margin.bottom) + (this.axisTitleMargin.top + this.axisTitleMargin.bottom) + 
                        (this.isLegend && (this.legendPlacement === Placement.TOP || this.legendPlacement === Placement.BOTTOM)? this.legendContainerSize.height : 0) -
                        padding;
                } else {
                    titleY = padding;
                }
                const rotate = 
                    d.placement === Placement.LEFT || d.placement === Placement.RIGHT ? -90 : 0;
                return `translate(${titleX}, ${titleY}) rotate(${rotate})`;
            });

            this.titleGroup.selectAll('.chart-title')
                .data((d: ChartTitle) => [d])
                .join(
                    (enter) => enter.append('text').attr('class', 'chart-title'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                // .style('text-anchor', 'middle')
                .style('font-size', (d: ChartTitle) => {
                    return (d.style && d.style.size ? d.style.size : this.defaultTitleStyle.font.size) + 'px';
                })
                .style('stroke', (d: ChartTitle) => {
                    return (d.style && d.style.color ? d.style.color : this.defaultTitleStyle.font.color)
                })
                .style('text-anchor', 'middle')
                .style('stroke-width', 0.5)
                .style('font-family', (d: ChartTitle) => {
                    return (d.style && d.style.font ? d.style.font : this.defaultTitleStyle.font.family)
                })
                .text((d: ChartTitle) => d.content)
                .attr('dy', '0em')
                // .attr('dy', (d: ChartTitle) => {
                //     return d.placement === Placement.TOP ? '0em': '1em';
                // })
                .attr('transform', (d: ChartTitle, index: number, nodeList: Array<any>) => {
                    // const textWidth = 
                    //     d.placement === Placement.TOP || d.placement === Placement.BOTTOM ? nodeList[index].getComputedTextLength() : 20;
                    const textNode = nodeList[index].getBoundingClientRect();
                    // const textWidth = 
                    //     d.placement === Placement.TOP || d.placement === Placement.BOTTOM ? textNode.width : 20;
                    const textHeight = textNode.height;
                    
                    let x = 0;
                    let y = 0;
                    if (d.placement === Placement.TOP || d.placement === Placement.BOTTOM) {
                        x = (this.width + this.margin.left + this.margin.right) / 2 - 
                            (this.isLegend && (this.legendPlacement === Placement.LEFT)? this.legendContainerSize.width : 0);
                        y = this.titleContainerSize.height / 2 + textHeight / 2 - 3;
                    } else {
                        x = (this.height + this.margin.top + this.margin.bottom) / 2 - textHeight / 2;;
                    }
                    const translate = `translate(${x}, ${y})`;
                    return translate;
                });
        }
    }

    protected updateAxis() {
        const maxTextWidth = {};
        const padding = 10; // 10 는 axis 여백.
        
        let isAxisUpdate: boolean = false;

        this.originDomains = {};

        this.scales = this.setupScale(this.config.axes, this.width, this.height);

        this.scales.map((scale: Scale) => {
            let orientedScale: any = null;
            let bandWidth: number = -1;
            if (scale.orient === Placement.RIGHT) {
                orientedScale = axisRight(scale.scale);
            } else if (scale.orient === Placement.LEFT) {
                orientedScale = axisLeft(scale.scale);
            } else if (scale.orient === Placement.TOP) {
                orientedScale = axisTop(scale.scale);
            } else {
                orientedScale = axisBottom(scale.scale);
            }

            if (scale.type === ScaleType.NUMBER) {
                if (scale.tickFormat) {
                    orientedScale.ticks(null, scale.tickFormat);
                    // orientedScale.tickFormat(timeFormat(scale.tickFormat));
                }
            } else if (scale.type === ScaleType.TIME) {
                if (scale.tickFormat) {
                    orientedScale.tickFormat(timeFormat(scale.tickFormat));
                }
                if (scale.tickSize) {
                    orientedScale.ticks(scale.tickSize);
                }
            } else if (scale.type === ScaleType.STRING) {
                bandWidth = scale.scale.bandwidth();
            }

            this.axisGroups[scale.orient].selectAll('text')
                .style('font-size', this.defaultAxisLabelStyle.font.size + 'px')
                .style('font-family', this.defaultAxisLabelStyle.font.family);
                // .style('font-weight', 100)
                // .style('stroke-width', 0.5)
                // .style('stroke', this.defaultAxisLabelStyle.font.color);
            
            if (scale.visible) {
                this.axisGroups[scale.orient].call(
                    orientedScale
                );
            }

            if (scale.isGridLine) {
                const targetScale = getAxisByPlacement(scale.orient, scale.scale);
                if (scale.tickSize) {
                    targetScale.ticks(scale.tickSize);
                }
                const tickFmt: any = ' ';
                if (scale.orient === Placement.RIGHT || scale.orient === Placement.LEFT) {
                    targetScale.tickSize(-this.width).tickFormat(tickFmt);
                } else {
                    targetScale.tickSize(-this.height).tickFormat(tickFmt);
                }

                this.gridLineGroups[scale.orient]
                    .style('stroke', '#ccc')
                    .style('stroke-opacity', 0.3)
                    .style('shape-rendering', 'crispEdges');

                this.gridLineGroups[scale.orient].call(
                    targetScale
                );
            }

            if (scale.isZoom === true) {
                this.setupBrush(scale);
            }

            // axis의 텍스트가 길어지면 margin도 덩달아 늘어나야함. 단, config.margin이 없을 때
            if (!this.isCustomMargin) {
                // 가장 긴 텍스트를 찾아서 사이즈를 저장하고 margin에 더해야함
                if (!maxTextWidth[scale.orient]) {
                    maxTextWidth[scale.orient] = 0;
                }
                let textLength = 0;
                let longTextNode: any = null;
                if (scale.orient === Placement.LEFT || scale.orient === Placement.RIGHT) {
                    this.axisGroups[scale.orient].selectAll('.tick').each((d: any, index: number, node: Array<any>) => {
                        const currentTextSize = (d + '').length;
                        if (textLength < currentTextSize) {
                            textLength = currentTextSize;
                            longTextNode = node[index];
                        }
                    });

                    if (longTextNode) {
                        const textWidth = Math.round(longTextNode.getBoundingClientRect().width);
                        if (maxTextWidth[scale.orient] < textWidth) {
                            maxTextWidth[scale.orient] = textWidth;
                        }
                    }
                } else {
                    this.axisGroups[scale.orient].selectAll('.tick').each((d: any, index: number, node: Array<any>) => {
                        // string일 때 bandWidth 보다 텍스트 사이즈가 더 크면 wordrap한다.
                        if (bandWidth > 0) {
                            const textNode: any = select(node[index]).select('text');
                            const textNodeWidth = textNode.node().getComputedTextLength();
                            const currentTextSize = (d + '').length;
                            if (textNodeWidth > bandWidth) {
                                textWrapping(textNode, bandWidth);
                            }

                            if (textLength < currentTextSize) {
                                textLength = currentTextSize;
                                longTextNode = node[index];
                            }
                        }
                    });
                    
                    if (longTextNode) {
                        const textHeight = Math.round(longTextNode.getBoundingClientRect().height);
                        if (maxTextWidth[scale.orient] < textHeight) {
                            maxTextWidth[scale.orient] = textHeight;
                        }
                    }
                }
            }

            if (scale.title) {
                this.axisGroups[scale.orient].selectAll(`.axis-${scale.orient}-title`)
                    .data([
                        scale.title
                    ])
                    .join(
                        (enter) => enter.append('text').attr('class', `axis-${scale.orient}-title`),
                        (update) => update,
                        (exit) => exit.remove()
                    )
                    .attr('dy', () => {
                        return scale.orient === Placement.TOP ? '0em' : '1em';
                    })
                    .style('text-anchor', 'middle')
                    .style('font-weight', 100)
                    .style('fill', this.defaultAxisTitleStyle.font.color)
                    .style('font-size', this.defaultAxisTitleStyle.font.size)
                    .style('font-family', this.defaultAxisTitleStyle.font.family)
                    .text((d: AxisTitle) => {
                        return d.content;
                    })
                    .attr('transform', (d: AxisTitle) => {
                        return scale.orient === Placement.LEFT || scale.orient === Placement.RIGHT ? 'rotate(-90)': '';
                    })
                    .attr('y', (d: AxisTitle, index: number, node: any) => {
                        const padding = 5;
                        let y = 0;
                        if (scale.orient === Placement.LEFT) {
                            y = 0 - (this.margin.left + this.axisTitleMargin.left - padding);
                        } else if (scale.orient === Placement.RIGHT) {
                            y = this.margin.right - padding;
                        } else if (scale.orient === Placement.BOTTOM) {
                            y = this.margin.bottom - padding;
                        } else {
                            y = -this.axisTitleMargin.top - padding;
                        }
                        return y;
                    })
                    .attr('x', (d: AxisTitle) => {
                        let x = 0;
                        if (scale.orient === Placement.LEFT || scale.orient === Placement.RIGHT) {
                            if (d.align === Align.CENTER) {
                                x = 0 - (this.height / 2);
                            } else if (d.align === Align.TOP) {
                                x = -padding;
                            } else if (d.align === Align.BOTTOM) {
                                x = 0 - (this.height - padding);
                            } else {
                                x = 0 - (this.height / 2);
                            }
                        } else if (scale.orient === Placement.BOTTOM || scale.orient === Placement.TOP) {
                            if (d.align === Align.CENTER) {
                                x = this.width / 2;
                            } else if (d.align === Align.LEFT) {
                                x = padding;
                            } else if (d.align === Align.RIGHT) {
                                x = this.width - padding;
                            } else {
                                x = this.width / 2;
                            }
                        }
                        return x;
                    });
            }
        });

        // margin 설정이 따로 없으면 자동으로 계산해서 margin을 갱신한다.
        if (!this.isCustomMargin) {
            Object.keys(maxTextWidth).map((orient: string) => {
                if (this.margin[orient] < maxTextWidth[orient] + padding) {
                    this.margin[orient] = maxTextWidth[orient] + padding;
                    isAxisUpdate = true;
                    // console.log('axis is high ==> ', this.margin);
                }
            });
        }

        return new Promise((resolve, reject) => {
            if (isAxisUpdate) {
                this.setRootSize();
                this.initContainer();
                this.updateDisplay();
            } else {
                resolve();
            }
        });
    }

    protected updateLegend() {
        if (!this.isLegend) {
            return;
        }
        const checkboxPadding = this.isCheckBox ? 15 : 0;
        let addTitleWidth = 0;
        if (this.isTitle && this.titlePlacement === Placement.LEFT) {
            addTitleWidth = this.titleContainerSize.width;
        }
        let addAllWidth = 0;
        if (this.isAll) {
            addAllWidth = 20;
        }

        const keys: Array<LegendItem> = this.seriesList.map((series: ISeries) => {
            const label: string = series.displayName ? series.displayName : series.selector;
            return {
                label,
                selected: true,
                isHide: false
            }
        });
        
        const legendItemGroup = this.legendGroup.selectAll('.legend-item-group')
            .data(keys)
            .join(
                (enter) => enter.append('g').attr('class', 'legend-item-group'),
                (update) => {
                    update.selectAll('*').remove();
                    return update;
                },
                (exit) => exit.remove()
            )
            .attr('transform', (d: any, index: number) => {
                const x = this.legendPlacement === Placement.LEFT ? this.legendPadding : 0;
                return this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT ? 
                    `translate(${x + addTitleWidth}, ${index * 20 + addAllWidth})` : 'translate(0, 0)';
            });

        if (this.isAll) {
            const allGroup = this.legendGroup.selectAll('.legend-all-group')
                .data([
                    <LegendItem>{
                        label: 'All',
                        selected: true,
                        isHide: false
                    }
                ])
                .join(
                    (enter) => enter.append('g').attr('class', 'legend-all-group'),
                    (update) => update,
                    (exit) => exit.remove()
                );

            allGroup.selectAll('.legend-all-label')
                .data((d: LegendItem) => [d])
                .join(
                    (enter) => enter.append('text').attr('class', 'legend-all-label'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .style('font-size', this.defaultLegendStyle.font.size)
                .attr('dy', '.35em')
                .attr('transform', 'translate(15, 5)')
                .text((d: LegendItem) => d.label)
                .on('click', this.onLegendAllLabelItemClick);
            
            drawSvgCheckBox(allGroup, this.onLegendAllCheckBoxItemClick);
        }
        
        if (this.isCheckBox) {
            legendItemGroup.each((d: LegendItem, index: number, nodeList: any) => {
                drawSvgCheckBox(select(nodeList[index]), this.onLegendCheckBoxItemClick);
            });
        }
        
        const legendLabelGroup = legendItemGroup.selectAll('.legend-label-group')
            .data((d: any) =>[d])
            .join(
                (enter) => enter.append('g').attr('class', 'legend-label-group').on('click', this.onLegendItemClick),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('transform', `translate(${checkboxPadding}, 0)`);
      
        legendLabelGroup.selectAll('.legend-item')
            .data((d: LegendItem) => [d])
            .join(
                (enter) => enter.append('rect').attr('class', 'legend-item'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('width', this.legendItemSize.width)
            .attr('height', this.legendItemSize.width)
            .attr('fill', (d: LegendItem) => {
                const index = keys.findIndex((key: LegendItem) => d.label === key.label);
                return this.colors[index];
            });
      
        legendLabelGroup.selectAll('.legend-label')
            .data((d: LegendItem) => [d])
            .join(
                (enter) => enter.append('text').attr('class', 'legend-label'),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('font-size', this.defaultLegendStyle.font.size)
            .attr('dy', '.35em')
            .attr('transform', (d: any, index: number) => {
                return `translate(${(this.legendPadding + this.legendItemSize.width)}, 5)`;
            })
            .text((d: LegendItem) => { return d.label; });

        
        if (this.legendPlacement === Placement.TOP || this.legendPlacement === Placement.BOTTOM) {
            let currentX = (this.isAll ? 20 : 0) + this.axisTitleMargin.left;
            const xpositions = [currentX];

            legendLabelGroup.selectAll('.legend-label').each((d: LegendItem) => {
                const index = keys.findIndex((key: LegendItem) => d.label === key.label);
                const textWidth = Math.round(getTextWidth(d.label, this.defaultLegendStyle.font.size, this.defaultLegendStyle.font.family));
                const legendItemWidth = this.legendItemSize.width + this.legendPadding * 2 + textWidth + (this.isCheckBox ? checkboxPadding : 0);
                currentX = currentX + legendItemWidth;
                xpositions.push(currentX);
            });
            
            legendItemGroup.attr('transform', (d: LegendItem) => {
                const addX = this.width + this.margin.left + this.axisTitleMargin.left - currentX;
                const index = keys.findIndex((key: LegendItem) => d.label === key.label);
                const x = xpositions[index];
                return `translate(${addX + x}, ${this.legendPadding})`;
            });

            if (this.isAll) {
                this.legendGroup.selectAll('.legend-all-group').attr('transform', (d: LegendItem) => {
                    const addX = this.width - currentX;
                    return `translate(${addX}, ${this.legendPadding})`;
                });
            }
        } else {
            if (this.isAll) {
                this.legendGroup.selectAll('.legend-all-group').attr('transform', (d: LegendItem) => {
                    const allGroupX = (this.legendPlacement === Placement.LEFT ? this.legendPadding : 0) + addTitleWidth
                    return `translate(${allGroupX}, 0)`;
                });
            }
        }
    }

    protected onLegendAllLabelItemClick = (d: LegendItem, index: number, nodeList: any) => {
        this.currentLegend = null;
        d.selected = !d.selected;
        
        select(nodeList[index]).style('opacity', d.selected === false ? 0.5 : null);
        this.legendGroup.selectAll('.legend-label-group')
            .style('opacity', d.selected === false ? 0.5 : null)
            .each((item: LegendItem) => {
                item.selected = d.selected;
            });
        
        this.seriesList.forEach((series: ISeries) => {
            series.select((series.displayName ? series.displayName : series.selector), d.selected);
        });
    }

    protected onLegendAllCheckBoxItemClick = (d: LegendItem, index: number, nodeList: any) => {
        this.currentLegend = null;
        d.isHide = !d.isHide;
        this.seriesList.forEach((series: ISeries) => {
            series.hide((series.displayName ? series.displayName : series.selector), d.isHide);
        });
        this.legendGroup.selectAll('.legend-label-group').each((item: LegendItem, i: number, node: any) => {
            item.isHide = d.isHide;
        });

        this.legendGroup.selectAll('.legend-item-group').selectAll('.checkbox-mark').each((item: any, i: number, node: any) => {
            item.checked = !d.isHide;
            select(node[i]).style('opacity', item.checked? 1 : 0)
        });
    }

    protected onLegendCheckBoxItemClick = (d: LegendItem, index: number, nodeList: any) => {
        d.isHide = !d.isHide;
        const target: ISeries = this.seriesList.find((series: ISeries) => (series.displayName ? series.displayName : series.selector) === d.label);
        if (target) {
            target.hide(d.label, d.isHide);
            if (!d.isHide && !d.selected) {
                target.select(d.label, d.selected);
            }

            if (this.isAll) {
                let isCheckedAll = (this.legendGroup.selectAll('.legend-all-group').selectAll('.checkbox-mark').data()[0] as any).checked;
                
                let checkCount = 0;
                let uncheckCount = 0;
                let allCount = 0;
                this.legendGroup.selectAll('.legend-item-group').selectAll('.checkbox-mark').each((item: any, i: number, node: any) => {
                    if (item.checked) {
                        checkCount++;
                    } else {
                        uncheckCount++;
                    }
                    allCount++;
                });

                if (isCheckedAll && uncheckCount > 0) {
                    // all check 해제
                    this.legendGroup.selectAll('.legend-all-group').selectAll('.checkbox-mark').each((item: any, i: number, node: any) => {
                        item.checked = false;
                        item.data.isHide = true;
                        select(node[i]).style('opacity', item.checked? 1 : 0);
                    });
                } else {
                    if (checkCount === allCount) {
                        // all check 설정.
                        this.legendGroup.selectAll('.legend-all-group').selectAll('.checkbox-mark').each((item: any, i: number, node: any) => {
                            item.checked = true;
                            item.data.isHide = false;
                            select(node[i]).style('opacity', item.checked? 1 : 0);
                        });
                    }
                }
            }
        }
    }

    protected onLegendItemClick = (d: LegendItem, index: number, nodeList: any) => {
        this.currentLegend = d.label;
        d.selected = !d.selected;

        select(nodeList[index]).style('opacity', d.selected === false ? 0.5 : null);

        const target: ISeries = this.seriesList.find((series: ISeries) => (series.displayName ? series.displayName : series.selector) === d.label);
        if (target) {
            target.select(d.label, d.selected);
        }
    }

    protected setupBrush(scale: any) {
        let brush = null;
        if (scale.type === ScaleType.NUMBER || scale.type === ScaleType.TIME) {
            if (scale.orient === Placement.RIGHT || scale.orient === Placement.LEFT) {
                let left = 0;
                let width = 0;

                if (scale.orient === Placement.LEFT) {
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
                if (scale.orient === Placement.TOP) {
                    top = this.margin.top * -1;
                } else {
                    height = this.margin.bottom;
                }

                brush = brushX()
                    .extent([ [0, top], [this.width, height] ]);
            }
            brush.on('end', () => {
                this.updateBrushHandler(scale.orient, brush);
            });
        }

        if (brush) {
            if (!this.axisGroups[scale.orient].select('.brush' + scale.orient).node()) {
                this.axisGroups[scale.orient].append('g')
                    .attr('class', 'brush' + scale.orient);
            }
            this.axisGroups[scale.orient].select('.brush' + scale.orient).call(
                brush
            );
        }
    }

    protected updateDisplay() {
        if (this.width <= 50 || this.height <= 50) {
            if (console && console.log) {
                console.log('It is too small to draw.');
            }
            return;
        }

        // 기준이되는 axis가 완료된 후에 나머지를 그린다.
        this.updateAxis()
            .then(() => {
                this.updateSeries();
                this.updateLegend();
                // POINT: 해당 기능이 series에 의존함으로 series를 먼저 그린뒤에 function을 설정 하도록 한다.
                this.updateFunctions();
                this.updateTitle();
            });
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
            if (axis.placement === Placement.BOTTOM || axis.placement === Placement.TOP) {
                range = [0, width];
            } else {
                range = [height, 0];
            }

            let scale = null;
            let minValue = 0;
            let maxValue = 0;
            if (axis.type === ScaleType.STRING) {
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
            } else if (axis.type === ScaleType.TIME) {
                scale = scaleTime().range(range);
                scale.domain(extent(this.data, (item: T) => item[axis.field]));
            } else {
                scale = scaleLinear().range(range);
                
                if (!axis.hasOwnProperty('max')) {
                    axis.max = max(this.data.map((item: T) => parseFloat(item[axis.field])));
                    axis.max += Math.round(axis.max * 0.05);
                }

                if (!axis.hasOwnProperty('min')) {
                    axis.min = min(this.data.map((item: T) => parseFloat(item[axis.field])));
                }

                // if (!axis.max) {
                //     axis.max = max(this.data.map((item: T) => parseFloat(item[axis.field])));
                // }

                // if (!axis.min) {
                //     axis.min = min(this.data.map((item: T) => parseFloat(item[axis.field])));
                // }

                minValue = axis.min;
                maxValue = axis.max;

                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    if (reScaleAxes.length) {
                        const reScale = reScaleAxes.find((d: any) => d.field === axis.field);
                        minValue = +reScale.min.toFixed(2);
                        maxValue = +reScale.max.toFixed(2);

                        if (axis.isRound === true) {
                            scale.domain(
                                [minValue, maxValue]
                            ).nice();
                        } else {
                            scale.domain(
                                [minValue, maxValue]
                            );
                        }
                    } else {
                        // TODO : index string domain 지정.
                        if (axis.isRound === true) {
                            scale.domain(
                                [minValue, maxValue]
                            ).nice();
                        } else {
                            scale.domain(
                                [minValue, maxValue]
                            );
                        }
                    }
                }
            }

            returnAxes.push({
                field: axis.field,
                orient: axis.placement,
                scale,
                type: axis.type,
                visible: axis.visible === false ? false : true,
                tickFormat: axis.tickFormat ? axis.tickFormat : undefined,
                tickSize: axis.tickSize ? axis.tickSize : undefined,
                isGridLine: axis.isGridLine === true ? true : false,
                isZoom: axis.isZoom === true ? true : false,
                min: minValue,
                max: maxValue,
                title: axis.title
            });
        });
        return returnAxes;
    }

    protected updateBrushHandler(orient: string = 'bottom', brush: any) {
        const extent = event.selection;
        const axis: any = this.scales.find((scale: Scale) => scale.orient === orient).scale;

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

            if (orient === Placement.TOP || orient === Placement.BOTTOM) {
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

        if (orient === Placement.LEFT) {
            currnetAxis = axisLeft(axis);
        } else if (orient === Placement.RIGHT) {
            currnetAxis = axisRight(axis);
        } else if (orient === Placement.TOP) {
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

        this.initContainer();

        this.clipPath.attr('width', this.width)
                .attr('height', this.height)
                .attr('x', 0)
                .attr('y', 0);

        this.updateDisplay();

        this.isResize = false;
    }
}
