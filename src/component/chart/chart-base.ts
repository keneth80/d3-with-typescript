import '../../chart.css';

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
import { ChartConfiguration, Axis, Margin, Placement, ChartTitle } from './chart-configuration';
import { ISeries } from './series.interface';
import { guid, textWrapping, getTextWidth, getMaxText } from './util/d3-svg-util';
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

interface ContainerSize {
    width: number;
    height: number;
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

    protected axisGroups: any = {
        top: null, left: null, bottom: null, right: null
    };

    protected tickSize: number = 6;

    protected tickPadding: number = 2;

    protected defaultTitleStyle: any = {
        font: {
            family: 'Arial, Helvetica, sans-serif',
            size: 16,
            color: '#999'
        }
    }

    protected defaultLegendStyle: any = {
        font: {
            family: 'Arial, Helvetica, sans-serif',
            size: 12,
            color: '#999'
        }
    }

    private config: ChartConfiguration;

    private isTooltip: boolean = false;

    private clipPath: Selection<BaseType, any, HTMLElement, any>;

    private originDomains: any = {};

    private idleTimeout: any;

    private maskId: string;

    private colors: Array<string>;

    private isCustomMargin: boolean = false;

    private titleContainerSize: ContainerSize = {
        width: 0, height: 0
    };

    private titlePlacement: string = Placement.TOP;

    private isLegend: boolean = false;

    private legendPlacement: string = Placement.RIGHT;

    private legendItemSize: ContainerSize = {
        width: 10, height: 10
    };

    private legendContainerSize: ContainerSize = {
        width: 0, height: 0
    };

    private legendPadding: number = 5;

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

    getColorBySeriesIndex(index: number): string {
        return this.colors[index];
    }

    chartClick() {
        return this.chartClickSubject.asObservable();
    }

    bootstrap() {
        // initialize size setup
        if (this.config.margin) {
            Object.assign(this.margin, this.config.margin);
            this.isCustomMargin = true;
        } else {
            this.isCustomMargin = false;
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

        if (this.config.colors && this.config.colors.length) {
            this.colors = this.config.colors;
        } else {
            this.colors = schemeCategory10.map((color: string) => color);
        }

        if (this.config.title) {
            this.titlePlacement = this.config.title.placement;
        }

        if (this.config.legend) {
            this.isLegend = true;
            this.legendPlacement = this.config.legend.placement;
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

        if (this.config.title) {
            this.titleContainerSize.width = this.titlePlacement === Placement.TOP || this.titlePlacement === Placement.BOTTOM ? this.width : 20;
            this.titleContainerSize.height = this.titlePlacement === Placement.TOP || this.titlePlacement === Placement.BOTTOM ? 20 : this.height;
            this.width = this.width - (this.titlePlacement === Placement.LEFT || this.titlePlacement === Placement.RIGHT ? 20 : 0);
            this.height = this.height - (this.titlePlacement === Placement.LEFT || this.titlePlacement === Placement.RIGHT ? 0 : 20);
        }

        if (this.config.legend) {
            const padding = 5;
            const targetText = getMaxText(this.seriesList.map((series: ISeries) => series.displayName || series.selector));
            const targetTextWidth = getTextWidth(targetText, this.defaultLegendStyle.font.size, this.defaultLegendStyle.font.family);
            const targetTextHeight = 15;

            this.legendContainerSize.width = this.legendPadding * 2 + this.legendItemSize.width + padding + Math.round(targetTextWidth);
            this.legendContainerSize.height = 
                this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT ? 
                this.height : 
                this.legendPadding * 2 + targetTextHeight;
            
            this.width = this.width - (this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT ? this.legendContainerSize.width : 0);
            this.height = this.height - (this.legendPlacement === Placement.TOP || this.legendPlacement === Placement.BOTTOM ? this.legendContainerSize.height : 0);
            
        }
    }

    protected initContainer() {
        const x = this.margin.left
            + (this.config.title && this.titlePlacement === Placement.LEFT ? this.titleContainerSize.width : 0)
            + (this.config.legend && this.legendPlacement === Placement.LEFT ? this.legendContainerSize.width : 0);
        const y = this.margin.top 
            + (this.config.title && this.titlePlacement === Placement.TOP ? this.titleContainerSize.height : 0)
            + (this.config.legend && this.legendPlacement === Placement.TOP ? this.legendContainerSize.height : 0);

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

        if (this.config.title) {
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
            this.legendGroup.attr('transform', () => {
                let translate = 'translate(0, 0)';
                if (this.legendPlacement === Placement.RIGHT) {
                    translate = `translate(${this.margin.left + width + this.margin.right}, ${y})`;
                } else if (this.legendPlacement === Placement.LEFT) {
                    translate = `translate(${this.titleContainerSize.width}, ${y})`;
                } else if (this.legendPlacement === Placement.TOP) {
                    translate = `translate(${this.margin.left}, ${this.titleContainerSize.height + this.legendPadding})`;
                } else {
                    const isTitle: boolean = this.config.title ? true : false;
                    let y = this.margin.top + this.margin.bottom + height;
                    if (isTitle && this.titlePlacement === Placement.TOP) {
                        y += this.titleContainerSize.height;
                    }
                    translate = `translate(${this.margin.left}, ${y})`;
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
                if (d.placement === Placement.RIGHT) {
                    titleX = this.width + this.margin.left + this.margin.right - 3;
                } else if (d.placement === Placement.BOTTOM) {
                    titleY = this.height + this.margin.top + this.titleContainerSize.height + this.legendContainerSize.height;
                }
                const rotate = 
                    d.placement === Placement.LEFT || d.placement === Placement.RIGHT ? 90 : 0;
                return `translate(${titleX}, ${titleY}) rotate(${rotate})`;
            });

            this.titleGroup.selectAll('.chart-title')
                .data((d: ChartTitle) => [d])
                .join(
                    (enter) => enter.append('text').attr('class', 'chart-title'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .style('font-size', (d: ChartTitle) => {
                    return (d.style && d.style.size ? d.style.size : this.defaultTitleStyle.font.size) + 'px';
                })
                .style('stroke', (d: ChartTitle) => {
                    return (d.style && d.style.color ? d.style.color : this.defaultTitleStyle.font.color)
                })
                .style('stroke-width', 0.5)
                .style('font-family', (d: ChartTitle) => {
                    return (d.style && d.style.font ? d.style.font : this.defaultTitleStyle.font.family)
                })
                .text((d: ChartTitle) => d.content)
                .attr('dy', '.35em')
                .attr('transform', (d: ChartTitle, index: number, nodeList: Array<any>) => {
                    // const textWidth = 
                    //     d.placement === Placement.TOP || d.placement === Placement.BOTTOM ? nodeList[index].getComputedTextLength() : 20;
                    const textNode = nodeList[index].getBoundingClientRect();
                    const textWidth = 
                        d.placement === Placement.TOP || d.placement === Placement.BOTTOM ? textNode.width : 20;
                    const textHeight = textNode.height;
                    
                    let x = 0;
                    let y = 0;
                    if (d.placement === Placement.TOP || d.placement === Placement.BOTTOM) {
                        x = (this.width + this.margin.left + this.margin.right) / 2 - textWidth / 2;
                        y = this.titleContainerSize.height / 2 + textHeight / 2 - 3;
                    } else {
                        x = (this.height + this.margin.top + this.margin.bottom) / 2 - textHeight / 2;
                        y = -(textWidth / 2 + 3);
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

            // axis의 텍스트가 길어지면 margin도 덩달아 늘어나야함. 단, config.margin이 없을 때
            if (!this.isCustomMargin) {
                // 가장 긴 텍스트를 찾아서 사이즈를 저장하고 margin에 더해야함
                if (!maxTextWidth[scale.orinet]) {
                    maxTextWidth[scale.orinet] = 0;
                }
                let textLength = 0;
                let longTextNode: any = null;
                if (scale.orinet === Placement.LEFT || scale.orinet === Placement.RIGHT) {
                    this.axisGroups[scale.orinet].selectAll('.tick').each((d: any, index: number, node: Array<any>) => {
                        if (textLength < d + ''.length) {
                            longTextNode = node[index];
                        }
                    });
                    if (longTextNode) {
                        const textWidth = Math.round(longTextNode.getBoundingClientRect().width);
                        if (maxTextWidth[scale.orinet] < textWidth) {
                            maxTextWidth[scale.orinet] = textWidth;
                        }
                    }
                    
                } else {
                    this.axisGroups[scale.orinet].selectAll('.tick').each((d: any, index: number, node: Array<any>) => {
                        if (textLength < d + ''.length) {
                            longTextNode = node[index];
                        }
                    });
                    if (longTextNode) {
                        const textHeight = Math.round(longTextNode.getBoundingClientRect().height);
                        if (maxTextWidth[scale.orinet] < textHeight) {
                            maxTextWidth[scale.orinet] = textHeight;
                        }
                    }
                }
            }
        });

        if (!this.isCustomMargin) {
            Object.keys(maxTextWidth).map((orient: string) => {
                if (this.margin[orient] < maxTextWidth[orient] + padding) {
                    this.margin[orient] = maxTextWidth[orient] + padding;
                    isAxisUpdate = true;
                    console.log('axis is high ==> ', this.margin);
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

        const keys: string[] = this.seriesList.map((series: ISeries) => series.displayName ? series.displayName : series.selector);
        
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
                if (this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT)
                return this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT ? 
                    `translate(${this.legendPadding}, ${index * 20})` : `translate(${this.legendPadding}, ${this.legendPadding})`;
            });
      
        legendItemGroup.selectAll('.legend-item')
            .data((d: string) => [d])
            .join(
                (enter) => enter.append('rect').attr('class', 'legend-item'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('width', this.legendItemSize.width)
            .attr('height', this.legendItemSize.width)
            .attr('fill', (d: string) => {
                const index = keys.indexOf(d);
                return this.colors[index];
            });
      
        legendItemGroup.selectAll('.legend-label')
            .data((d: string) => [d])
            .join(
                (enter) => enter.append('text').attr('class', 'legend-label'),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('font-size', this.defaultLegendStyle.font.size)
            .attr('transform', (d: any, index: number) => {
                return `translate(${(this.legendPadding + this.legendItemSize.width)}, 5)`;
            })
            .attr('dy', '.35em')
            .text((d: string) => { return d; });

        
        if (this.legendPlacement === Placement.TOP || this.legendPlacement === Placement.BOTTOM) {
            let currentX = 0;
            const xpositions = [0];

            legendItemGroup.selectAll('.legend-label').each((d: string) => {
                const index = keys.indexOf(d);
                const legendItemWidth = this.legendItemSize.width + this.legendPadding * 2 + getTextWidth(d, this.defaultLegendStyle.font.size, this.defaultLegendStyle.font.family);
                currentX = currentX + legendItemWidth;
                xpositions.push(currentX);
            });
            
            legendItemGroup.attr('transform', (d: any) => {
                const addX = this.width - currentX;
                const index = keys.indexOf(d);
                const x = index > 0 ? xpositions[index] : 0;
                return `translate(${addX + x}, ${this.legendPadding})`;
            });
            
        }
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
        if (this.width <= 50 || this.height < 50) {
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
            if (axis.placement === 'bottom' || axis.placement === 'top') {
                range = [0, width];
            } else {
                range = [height, 0];
            }

            let scale = null;
            let minValue = 0;
            let maxValue = 0;
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
                orinet: axis.placement,
                scale,
                type: axis.type,
                visible: axis.visible === false ? false : true,
                tickFormat: axis.tickFormat ? axis.tickFormat : undefined,
                isGridLine: axis.isGridLine === true ? true : false,
                isZoom: axis.isZoom === true ? true : false,
                min: minValue,
                max: maxValue
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

        this.initContainer();

        this.clipPath.attr('width', this.width)
                .attr('height', this.height)
                .attr('x', 0)
                .attr('y', 0);

        this.updateDisplay();

        this.isResize = false;
    }

}