// import './chart.css';

import { min, max } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import { scaleBand, scaleLinear, scaleTime, scalePoint } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { select, Selection, BaseType, event } from 'd3-selection';
import { axisBottom, axisLeft, axisTop, axisRight } from 'd3-axis';
import { brushX, brushY } from 'd3-brush';
import { format } from 'd3-format';

import { fromEvent, Subscription, Subject, of, Observable, from, timer } from 'rxjs';
import { debounceTime, switchMap, map, concatMap, mapTo } from 'rxjs/operators';

import { IChart, Scale, ContainerSize, LegendItem, ChartMouseEvent, ChartZoomEvent, DisplayType } from './chart.interface';
import { ChartConfiguration, Axis, Margin, Placement, ChartTitle, ScaleType, 
         Align, AxisTitle, ChartTooltip, Shape, PlacementByElement 
} from './chart-configuration';
import { ISeries } from './series.interface';
import { IFunctions } from './functions.interface';
import { IOptions } from './options.interface';

import { baseTooltipTemplate } from '../chart/util/tooltip-template';
import { guid, delayExcute, textWrapping, 
         drawSvgCheckBox, drawLegendColorItemByRect, drawLegendColorItemByCircle, drawLegendColorItemByLine,
         getAxisByPlacement, getTransformByArray, getTextWidth, getMaxText
} from './util/d3-svg-util';


// TODO: 모든 참조되는 함수들은 subject로 바꾼다.
export class ChartBase<T = any> implements IChart {
    static ZOOM_SVG = 'zoom-svg';

    static POINTER_CANVAS = 'pointer-canvas';

    static ZOOM_CANVAS = 'zoom-canvas';

    static SELECTION_CANVAS = 'selection-canvas';

    static DRAWING_CANVAS = 'drawing-canvas';

    isResize = false;

    mouseEventSubject: Subject<ChartMouseEvent> = new Subject();

    zoomEventSubject: Subject<ChartZoomEvent> = new Subject();

    isTooltipDisplay = false;

    protected data: Array<T> = [];

    protected svgWidth = 0;

    protected svgHeight = 0;

    protected scales: Array<Scale> = [];
    
    protected width = Infinity;

    protected height = Infinity;

    protected originalData: Array<any> = [];

    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected zoomGroup: Selection<BaseType, any, HTMLElement, any>; // svg용 zoom handler group

    protected optionGroup: Selection<BaseType, any, HTMLElement, any>;

    protected seriesGroup: Selection<BaseType, any, HTMLElement, any>;

    protected titleGroup: Selection<BaseType, any, BaseType, any>;

    protected legendGroup: Selection<BaseType, any, BaseType, any>;

    protected seriesList: Array<ISeries> = [];

    protected functionList: Array<IFunctions> = [];

    protected optionList: Array<IOptions> = [];

    protected subscription: Subscription;

    protected chartClickSubject: Subject<any> = new Subject();

    protected updateSeriesSubject: Subject<any> = new Subject();

    protected tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    protected margin: Margin = {
        top: 25, left: 20, bottom: 30, right: 20
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

    private isTooltip = false;

    private isTooltipMultiple = false;

    private clipPath: Selection<BaseType, any, HTMLElement, any>;

    private originDomains: any = {};

    private idleTimeout: any;

    private maskId = '';

    private colors: Array<string>;

    private isCustomMargin = false;

    // ===================== axis configuration start ===================== //
    private axisGroups: PlacementByElement = {
        top: null, left: null, bottom: null, right: null
    };

    private gridLineGroups: PlacementByElement = {
        top: null, left: null, bottom: null, right: null
    };

    private tickSize = 6;

    private tickPadding = 2;

    private axisTitleMargin: Margin = {
        top: 0, left: 0, bottom: 0, right: 0
    }; // axis title margin
    // ===================== axis configuration end ===================== //

    // ===================== Title configuration start ===================== //
    private isTitle = false;

    private titleContainerSize: ContainerSize = {
        width: 0, height: 0
    };

    private titlePlacement = 'top';
    // ===================== Title configuration end ===================== //

    // ===================== Legend configuration start ===================== //
    private isLegend = false;

    private legendPlacement = 'right';

    private legendItemSize: ContainerSize = {
        width: 10, height: 10
    };

    private legendContainerSize: ContainerSize = {
        width: 0, height: 0
    };

    private legendRowCount = 1;

    private legendPadding = 5;

    private currentLegend = null;

    private currentLegendNode: any = null;

    private isCheckBox = true;

    private checkBoxWidth = 15;

    private legendItemTextHeight = 15;

    private isAll = true;

    private allWidth = 30;

    private totalLegendWidth = 0;

    private legendRowBreakCount: Array<number> = [];

    private legendTextWidthList: Array<number> = [];
    // ===================== Legend configuration end ===================== //

    // ===================== current min max start ===================== //
    private currentScale: Array<{field:string, min: number, max: number}> = [];
    // ===================== current min max start ===================== //

    // multi tooltip 및 series 별 tooltip을 구분할 수 있는 저장소.
    private tooltipItems: Array<{selector: string}> = [];

    // series delay display observable
    private eachElementAsObservableSubscription: Subscription = new Subscription();

    private reScale$: Subject<Array<any>> = new Subject(); 

    private move$: Subject<any> = new Subject();

    private webglCanvas: Selection<BaseType, any, HTMLElement, any>;

    private webglContext: any;

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

    // 이 함수는 보류 (미구현)
    get webglElementContext() {
        if (!this.webglCanvas) {
            this.webglCanvas = select(document.createElement('CANVAS'));
            this.webglCanvas
                .attr('width', this.width)
                .attr('height', this.height);

            if (!this.webglContext) {
                const webglOption = {
                    alpha: true, // 캔버스에 알파 버퍼가 포함되어 있는지 를 나타내는 부울입니다.
                    antialias: true, // 항별칭을 수행할지 여부를 나타내는 부울
                    // preserveDrawingBuffer: true, // 값이 true인 경우 버퍼가 지워지지 않으며 작성자가 지우거나 덮어쓸 때까지 해당 값을 보존합니다.
                    powerPreference: 'high-performance',
                    // depth: false, // 도면 버퍼에 최소 16비트의 깊이 버퍼가 있음을 나타내는 부울입니다.
                    // /**
                    //  * 웹GL 컨텍스트에 적합한 GPU 구성을 나타내는 사용자 에이전트에 대한 힌트입니다. 가능한 값은 다음과 같습니다.
                    // "default": 사용자 에이전트가 가장 적합한 GPU 구성을 결정하도록 합니다. 기본 값입니다.
                    // "high-performance": 전력 소비보다 렌더링 성능의 우선 순위를 지정합니다.
                    // "low-power": 렌더링 성능보다 절전의 우선 순위를 지정합니다.
                    //  */
                    premultipliedAlpha: true, // 페이지 작성자가 드로잉 버퍼에 미리 곱한 알파가 있는 색상이 포함되어 있다고 가정한다는 것을 나타내는 부울입니다.
                    stencil: true, // 도면 버퍼에 최소 8비트의 스텐실 버퍼가 있음을 나타내는 부울입니다.
                    // desynchronized: true, // 이벤트 루프에서 캔버스 페인트 주기의 비동기화를 해제하여 사용자 에이전트가 대기 시간을 줄이도록 힌트하는 부울
                    failIfMajorPerformanceCaveat: true // 시스템 성능이 낮거나 하드웨어 GPU를 사용할 수 없는 경우 컨텍스트가 생성될지 를 나타내는 부울수입니다.
                };
                this.webglContext = (this.webglCanvas.node() as any).getContext('webgl', webglOption) || (this.webglCanvas.node() as any).getContext('experimental-webgl', webglOption);
            }
        }
        this.webglContext.imageSmoothingQuality = 'high'; // "low|medium|high"
        this.webglContext.imageSmoothingEnabled = true;
        this.webglContext.viewportWidth = this.width;
        this.webglContext.viewportHeight = this.height;
        return this.webglContext;
    }

    // 이 함수는 보류 (미구현)
    get webglCanvasElement() {
        return this.webglCanvas;
    }

    get chartMargin(): any {
        const transform: Array<string> = getTransformByArray(this.mainGroup.attr('transform'));
        const left = +transform[0];
        const top = +transform[1];
        const right = this.svgWidth - (left + this.width);
        const bottom = this.svgHeight - (top + this.height);
        
        return {
            left, top, right, bottom
        };
    }

    set toolTipTarget(value: Selection<BaseType, any, HTMLElement, any>) {
        this.tooltipGroup = value;
    }

    get tooltip(): ChartTooltip {
        return this.config.tooltip;
    }

    get series(): Array<ISeries> {
        return this.seriesList;
    }

    get functions(): Array<IFunctions> {
        return this.functions;
    }

    get clipPathSelector(): any {
        return this.clipPath;
    }

    // get crossFilter(): any{
    //     return crossfilter;
    // }

    get updateSeries$(): Observable<any> {
        return this.updateSeriesSubject.asObservable();
    }

    get mouseEvent$(): Observable<any> {
        return this.mouseEventSubject.asObservable();
    }

    get zoomEvent$(): Observable<any> {
        return this.zoomEventSubject.asObservable();
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
            this.config.axes.map((axis: Axis) => {
                // 최초 axis padding을 조정해줌.
                if (axis.placement === Placement.TOP || axis.placement === Placement.BOTTOM) {
                    this.margin[axis.placement] = 30;
                }
            })
        }

        this.svg = select(configuration.selector);

        if (!this.svg.node()) {
            if (console && console.log) {
                console.log('is not svg!');
            }
        }

        if (configuration.style) {
            this.svg.style('background-color', configuration.style.backgroundColor || '#fff')
        } else {
            this.svg.style('background-color', '#fff')
        }

        // data setup origin data 와 분리.
        this.data = this.setupData(configuration.data);

        if (configuration.series && configuration.series.length) {
            this.seriesList = configuration.series;
        }

        if (configuration.functions && configuration.functions.length) {
            this.functionList = configuration.functions;
        }

        if (configuration.options && configuration.options.length) {
            this.optionList = configuration.options;
        }

        if (configuration.colors && configuration.colors.length) {
            this.colors = this.config.colors;
        } else {
            this.colors = schemeCategory10.map((color: string) => color);
        }

        if (configuration.title) {
            this.isTitle = true;
            this.titlePlacement = configuration.title.placement;
        } else {
            this.isTitle = false;
        }

        if (configuration.legend) {
            this.isLegend = true;
            this.legendPlacement = configuration.legend.placement;
            this.isCheckBox = configuration.legend.isCheckBox === false ? configuration.legend.isCheckBox : true;
            this.isAll = configuration.legend.isAll === false ? configuration.legend.isAll : true;
        }

        if (configuration.tooltip) {
            this.isTooltipMultiple = configuration.tooltip.isMultiple === true ? true : false;
        }

        this.maskId = guid();

        this.setRootSize();
        
        this.initContainer();
        this.addEventListner();
    }

    getColorByIndex(index: number): string {
        return this.colors[index];
    }

    draw() {
        this.updateDisplay();

        return this;
    }

    // TODO: clear 로직 구현.
    clear() {
        this.svg.selectAll('*').remove();

        this.seriesList.forEach((series: ISeries) => {
            series.destroy();
        });

        this.functionList.forEach((functions: IFunctions) => {
            functions.destroy();
        });

        this.functionList.forEach((functions: IFunctions) => {
            functions.destroy();
        });
    }

    showTooltip(): Selection<BaseType, any, HTMLElement, any> {
        if (!this.isTooltipDisplay) {
            this.isTooltipDisplay = true;
            this.seriesList.forEach((series: ISeries) => {
                series.unSelectItem();
            });
            this.tooltipGroup.style('display', null);
            this.drawTooltip();
        }
        return this.tooltipGroup;
    }

    hideTooltip(): Selection<BaseType, any, HTMLElement, any> {
        if (this.isTooltipDisplay) {
            this.isTooltipDisplay = false;
            this.seriesList.forEach((series: ISeries) => {
                series.unSelectItem();
            });
            this.tooltipGroup.style('display', 'none');
            // TODO: tooltip hide event 발생.
        }
        return this.tooltipGroup;
    }

    drawTooltip() {
        if (this.isTooltip) {
            return;
        }

        this.isTooltip = true;

        baseTooltipTemplate(this.tooltipGroup);
    }

    showTooltipBySeriesSelector(selector: string): Selection<BaseType, any, HTMLElement, any> {
        const series: ISeries = this.seriesList.find((item: ISeries) => item.selector === selector);
        if (series) {
            this.tooltipItems.push({
                selector
            });
            series.unSelectItem();
            delayExcute(100, () => {
                this.tooltipGroup.select('#' + selector).style('display', null);
                this.drawTooltipBySeriesSelector(selector);
            });
        }
        return this.tooltipGroup;
    }

    hideTooltipBySeriesSelector(selector: string): Selection<BaseType, any, HTMLElement, any> {
        const targetIndex = this.seriesList.findIndex((item: ISeries) => item.selector === selector);
        if (targetIndex > -1) {
            const delIndex = this.tooltipItems.findIndex((item: any) => item.selector === selector);
            if (delIndex > -1) {
                this.tooltipItems.slice(delIndex, 1);
            }
            const series: ISeries = this.seriesList[targetIndex];
            series.unSelectItem();
        }
        
        delayExcute(100, () => {
            if (!this.tooltipItems.length) {
                this.tooltipGroup.select('#' + selector).style('display', 'none');
            }
            // TODO: 지우거나 this.tooltipItems로 다시 그리거나 할 것.

        });
        return this.tooltipGroup;
    }

    drawTooltipBySeriesSelector(selector: string) {
        // TODO: tooltip을 시리즈 별로 생성한다.
        // select item을 큐에 저장하고 약간의 딜레이 타임을 줘서 툴팁을 생성하는 로직을 고민해볼 것.
        this.tooltipGroup.selectAll('.tooltip-background')
            .data(['background'])
            .join(
                (enter) => enter.append('rect').attr('class', '.tooltip-background'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 60)
            .attr('height', 20)
            .attr('fill', '#111')
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
            .style('fill', '#fff')
            .attr('font-size', '14px')
            .attr('font-weight', '100');
    }

    destroy() {
        this.subscription.unsubscribe();
        if (this.svg) {
            this.svg.on('click', null);
            this.svg.selectAll('*').remove();
        }
        this.seriesList.forEach((series: ISeries) => series.destroy());
        this.functionList.forEach((functions: IFunctions) => functions.destroy());
        this.originDomains = null;
        this.originalData.length = 0;
        this.data.length = 0;
    }

    updateOptions() {
        if (this.optionList && this.optionList.length) {
            this.optionList.map((option: IOptions, index: number) => {
                option.chartBase = this;
                option.setSvgElement(this.svg, this.optionGroup, index);
                option.drawOptions(this.data, this.scales, {width: this.width, height: this.height});
            });
        }
    }

    targetSeriesUpdate(series: ISeries, index: number) {
        return new Promise(resolve => {
            series.chartBase = this;
            series.setSvgElement(this.svg, this.seriesGroup, index);
            series.drawSeries(
                this.data, 
                this.scales,
                {
                    width: this.width, 
                    height: this.height
                }, 
                {
                    index, 
                    color: this.colors[index], 
                    displayType: DisplayType.NORMAL
                }
            );
            resolve();
        });
    }

    async execute() {
        let index = -1;
        for (const series of this.seriesList) {
            index++;
            await this.targetSeriesUpdate(series, index);
        }
        console.log('series update Done!');
    }

    updateSeries(displayType: DisplayType = DisplayType.NORMAL) {
        try {
            // TODO: subject next 로 변경할 것
            if (this.seriesList && this.seriesList.length) {
                if (!this.config.displayDelay) {
                    // this.execute();
                    this.seriesList.map((series: ISeries, index: number) => {
                        series.chartBase = this;
                        series.setSvgElement(this.svg, this.seriesGroup, index);
                        series.drawSeries(
                            this.data, 
                            this.scales, 
                            {
                                width: this.width, 
                                height: this.height
                            },
                            {
                                index, 
                                color: this.colors[index], 
                                displayType
                            }
                        );
                    });

                    return;
                } else {
                    if (this.currentScale.length) {
                        this.seriesList.map((series: ISeries, index: number) => {
                            series.chartBase = this;
                            series.setSvgElement(this.svg, this.seriesGroup, index);
                            series.drawSeries(
                                this.data, 
                                this.scales, 
                                {
                                    width: this.width, 
                                    height: this.height
                                }, 
                                {
                                    index, 
                                    color: this.colors[index], 
                                    displayType: DisplayType.NORMAL
                                }
                            );
                        });

                        return;
                    }
                }
                
                // 시간차로 그리기.
                const arrayAsObservable = of(null).pipe(
                    // delay(this.config.displayDelay.delayTime),
                    switchMap(() => this.getObjectWithArrayInPromise(this.seriesList)),
                    map((val: any) => {
                        return (val.data);
                    }),
                    switchMap(val => from(val))
                );
        
                const eachElementAsObservable = arrayAsObservable.pipe(
                    concatMap(value => timer(this.config.displayDelay.delayTime).pipe(mapTo(value))), // Not working : we want to wait 500ms for each value
                    map(val => {
                        return val;
                    })
                );

                this.eachElementAsObservableSubscription.unsubscribe();
                this.eachElementAsObservableSubscription = new Subscription();
            
                this.eachElementAsObservableSubscription.add(
                    eachElementAsObservable.subscribe(index => {
                        const currentIndex = parseInt(index + '');
                        this.seriesList[currentIndex].chartBase = this;
                        this.seriesList[currentIndex].setSvgElement(this.svg, this.seriesGroup, currentIndex);
                        this.seriesList[currentIndex].drawSeries(
                            this.data, 
                            this.scales, 
                            {
                                width: this.width, 
                                height: this.height
                            }, 
                            {
                                index: currentIndex, 
                                color: this.colors[currentIndex], 
                                displayType: DisplayType.NORMAL
                            }
                        );
                    },
                    error => {
                        if (console && console.log) {
                            console.log(error);
                        }
                    },
                    () => {
                        if (console && console.log) {
                            console.log('complete series display');
                        }
                    })
                );
            }
        } catch(error) {
            if (console && console.log) {
                console.log(error);
            }
        }
    }

    getObjectWithArrayInPromise(list: Array<ISeries>) {
		const data = list.map((series: ISeries, index: number) => index);
        return new Promise(resolve => {
            delayExcute(20, () => resolve({
                data
            }));
        });
    }

    updateRescaleAxis(isZoom: boolean = true) {
        let index = 0;
        for (index = 0; index < this.scales.length; index++) {
            const scale = this.scales[index];
            const orientedAxis: any = this.axisSetupByScale(scale);
            
            if (scale.visible) {
                this.axisGroups[scale.orient].call(
                    orientedAxis
                )
                .selectAll('text')
                .style('font-size', this.defaultAxisLabelStyle.font.size + 'px')
                .style('font-family', this.defaultAxisLabelStyle.font.family);

                if (scale.tickTextParser) {
                    delayExcute(50, () => {
                        this.axisGroups[scale.orient]
                            .selectAll('text')
                            .text((d: string) => {
                                return scale.tickTextParser(d);
                            })
                    })
                }
            }

            if (isZoom && scale.isZoom === true) {
                this.setupBrush(scale);
            }
        }
    }

    protected updateFunctions() {
        try {
            if (this.functionList && this.functionList.length) {
                this.functionList.forEach((functionItem: IFunctions, index: number) => {
                    functionItem.chartBase = this;
                    functionItem.setSvgElement(this.svg, this.seriesGroup, index);
                    functionItem.drawFunctions(this.data, this.scales, {width: this.width, height: this.height});
                });
            }
        } catch(error) {
            if (console && console.log) {
                console.log(error);
            }
        }
    }

    protected setRootSize() {
        const titleTextHeight = 16;
        this.svgWidth = parseFloat(this.svg.style('width'));
        this.svgHeight = parseFloat(this.svg.style('height'));

        // axis title check
        if (this.config.axes && this.config.axes.length) {
            this.config.axes.forEach((axis: Axis) => {
                if (axis.title) {
                    this.axisTitleMargin[axis.placement] = titleTextHeight;
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
            const targetText = getMaxText(this.seriesList.map((series: ISeries) => series.displayName || series.selector));
            const targetTextWidth = getTextWidth(targetText, this.defaultLegendStyle.font.size, this.defaultLegendStyle.font.family);
            // legend row 한개의 길이
            const checkWidth = this.margin.left + this.margin.right + this.width - this.legendPadding * 4;
            
            this.legendTextWidthList = [];
            this.legendRowBreakCount = [];
            this.totalLegendWidth = 0;

            if (this.isAll) {
                this.totalLegendWidth = this.allWidth - (this.isCheckBox ? 0 : 10);
                this.legendTextWidthList.push(this.totalLegendWidth);
            }
            this.totalLegendWidth += this.legendPadding;
            
            let compareWidth = this.totalLegendWidth;
            let pointWidth = 0;

            for (let i = 0; i < this.seriesList.length; i++) {
                const currentText = this.seriesList[i].displayName || this.seriesList[i].selector;
                const currentTextWidth = ((this.isCheckBox ? this.checkBoxWidth : 0) + getTextWidth(currentText, this.defaultLegendStyle.font.size, this.defaultLegendStyle.font.family));
                const currentItemWidth = currentTextWidth + this.legendItemSize.width + this.legendPadding;
                this.legendTextWidthList.push(currentItemWidth);
                this.totalLegendWidth += currentItemWidth;
                compareWidth += currentItemWidth;
                if (compareWidth > checkWidth) {
                    compareWidth = currentItemWidth;
                    this.legendRowBreakCount.push(i + (this.isAll ? 1 : 0));
                }
            }

            this.totalLegendWidth += (this.legendPadding * (this.seriesList.length - 1)) + ((this.legendItemSize.width + this.legendPadding) * this.seriesList.length);

            this.legendRowCount = Math.ceil(this.totalLegendWidth / this.width);

            this.legendContainerSize.width = 
            this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT ? 
                this.legendPadding * 2 + this.legendItemSize.width + this.legendPadding + Math.round(targetTextWidth) + (this.isCheckBox ? this.checkBoxWidth : 0) : 
                (this.legendRowCount > 1 ? this.width : this.totalLegendWidth);
            this.legendContainerSize.height = 
                this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT ? 
                this.height : 
                (this.legendPadding + titleTextHeight) * this.legendRowCount;
            
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
                    .attr('clas', 'series-mask')
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
            let legendX = 0;
            let legendY = 0;
            this.legendGroup.attr('transform', () => {
                let translate = 'translate(0, 0)';
                if (this.legendPlacement === Placement.RIGHT) {
                    legendX = width + (this.margin.left + this.margin.right + this.axisTitleMargin.left + this.axisTitleMargin.right);
                    translate = `translate(${legendX}, ${legendY})`;
                } else if (this.legendPlacement === Placement.LEFT) {
                    legendX = (this.isTitle && this.titlePlacement === Placement.LEFT ? this.titleContainerSize.width : 0);
                    translate = `translate(${legendX}, ${legendY})`;
                } else if (this.legendPlacement === Placement.TOP) {
                    // legendX = this.legendRowCount > 1 ? this.legendPadding * 2 : this.totalLegendWidth - this.width + this.margin.left + this.margin.right;
                    legendX = this.legendPadding * 2;
                    legendY = (this.isTitle && this.titlePlacement === Placement.TOP ? this.titleContainerSize.height : 0) + this.legendPadding * 2;
                    translate = `translate(${legendX}, ${legendY})`;
                } else if (this.legendPlacement === Placement.BOTTOM) {
                    // legendX = this.legendRowCount > 1 ? this.legendPadding * 2 : this.totalLegendWidth - this.width + this.margin.left + this.margin.right;
                    legendX = this.legendPadding * 2;
                    legendY = (this.margin.top + this.margin.bottom) + (this.axisTitleMargin.top + this.axisTitleMargin.bottom) + height;
                    if (this.isTitle && this.titlePlacement === Placement.TOP) {
                        legendY += this.titleContainerSize.height + this.legendPadding;
                    }
                    translate = `translate(${legendX}, ${legendY})`;
                }
                return translate;
            });
        }

        if (!this.zoomGroup) {
            this.zoomGroup = this.svg.append('g')
                .attr('class', ChartBase.ZOOM_SVG)
            this.zoomGroup.append('rect')
                .attr('class', ChartBase.ZOOM_SVG + '-background')
                .style('fill', 'none')
                .style('pointer-events', 'all');
        }
        this.zoomGroup
            .attr('transform', `translate(${x}, ${y})`);

        this.zoomGroup.select('.' + ChartBase.ZOOM_SVG + '-background')
            .attr('width', this.width)
            .attr('height', this.height);

        if (!this.optionGroup) {
            this.optionGroup = this.svg.append('g')
                .attr('class', 'option-group')
        }
        this.optionGroup
            .attr('transform', `translate(${x}, ${y})`)
            .attr('clip-path', `url(#${this.maskId})`);

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

    // 모든 외부에서 들어오는 이벤트는 여기서 처리한다.
    protected addEventListner() {
        this.svg.on('click', this.chartCanvasClick);
        this.subscription = new Subscription();
        if (this.config.isResize && this.config.isResize === true) {
            const resizeEvent = fromEvent(window, 'resize').pipe(debounceTime(500));
            this.subscription.add(
                resizeEvent.subscribe(this.resizeEventHandler)
            );
        }

        let isDragStart = false;

        let isMouseLeave = false;

        this.subscription.add(
            this.mouseEvent$.subscribe((event: ChartMouseEvent) => {
                if (event.type === 'mousemove') {
                    isMouseLeave = false;
                    this.pointerClear();
                    if (!isDragStart) {
                        this.move$.next(event.position);
                    }
                } else if (event.type === 'mouseleave') {
                    isMouseLeave = true;
                    this.pointerClear();
                } else if (event.type === 'mouseup') {
                    isDragStart = false;
                    let max = this.seriesList.length;
                    while(max--) {
                        const positionData = this.seriesList[max].getSeriesDataByPosition(event.position);
                        if (positionData.length) {
                            this.seriesList[max].onSelectItem(positionData, event);
                            break;
                        }
                    }

                } else if (event.type === 'mousedown') {
                    
                } else {
                    isDragStart = false;
                    let max = this.seriesList.length;
                    while(max--) {
                        const positionData = this.seriesList[max].getSeriesDataByPosition(event.position);
                        if (positionData.length) {
                            this.seriesList[max].onSelectItem(positionData, event);
                            break;
                        }
                    }
                }
            })
        );

        this.subscription.add(
            this.move$.pipe(debounceTime(200)).subscribe((value: any) => {
                if (!isDragStart && !isMouseLeave) {
                    let max = this.seriesList.length;
                    while(max--) {
                        const positionData = this.seriesList[max].getSeriesDataByPosition(value);
                        // TODO: 시리즈 루프 돌면서 해당 포지션에 데이터가 있는지 찾되
                        // 툴팁을 보여줄 때면 멀티인지 싱글인지 체크 해서 break 여부를 판단하고 해당 시리즈의 메서드 실행.
                        // multi tooltip이면 break 걸지 않는다.
                        if (positionData.length) {
                            this.seriesList[max].showPointAndTooltip(value, positionData);
                            // TODO: tooltip show event 발생.
                            break;
                        }
                    }   
                }
            })
        );

        this.subscription.add(
            this.zoomEvent$.subscribe((event: ChartZoomEvent) => {
                if (event.type === 'dragstart') {
                    isDragStart = true;
                    this.pointerClear();
                } else if (event.type === 'zoomin') {
                    isDragStart = false;
                    
                    // this.viewClear();
                    const reScale = [
                        {
                            field: event.zoom.field.x,
                            min: event.zoom.start.x,
                            max: event.zoom.end.x
                        },
                        {
                            field: event.zoom.field.y,
                            min: event.zoom.start.y,
                            max: event.zoom.end.y
                        }
                    ];
                    this.scales = this.setupScale(this.config.axes, this.width, this.height, reScale);
                    this.updateRescaleAxis(false);
                    this.updateFunctions();
                    this.updateSeries(DisplayType.ZOOMIN);
                    this.updateOptions();
                } else if (event.type === 'zoomout') {
                    isDragStart = false;
                    // this.viewClear();
                    this.scales = this.setupScale(this.config.axes, this.width, this.height, []);
                    this.updateRescaleAxis(false);
                    this.updateFunctions();
                    this.updateSeries(DisplayType.ZOOMOUT);
                    this.updateOptions()
                } else {
                    isDragStart = false;
                }
            })
        );
    }

    protected chartCanvasClick = () => {
        this.chartClickSubject.next();
        this.hideTooltip();
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
                .attr('transform', (d: ChartTitle, index: number, nodeList: Array<any>) => {
                    const textNode = nodeList[index].getBoundingClientRect();
                    const textHeight = textNode.height;
                    
                    let x = 0;
                    let y = 0;
                    if (d.placement === Placement.TOP || d.placement === Placement.BOTTOM) {
                        x = (this.width + this.margin.left + this.margin.right) / 2 - 
                            (this.isLegend && (this.legendPlacement === Placement.LEFT)? this.legendContainerSize.width : 0);
                        y = textHeight / 2 + 3;
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

        this.scales = this.setupScale(this.config.axes, this.width, this.height, this.currentScale);

        this.scales.forEach((scale: Scale) => {
            const orientedAxis: any = this.axisSetupByScale(scale);
            
            let bandWidth: number = -1;

            if (scale.type === ScaleType.STRING) {
                bandWidth = scale.scale.bandwidth();
            }
            
            if (scale.visible) {
                this.axisGroups[scale.orient].call(
                    orientedAxis
                )
                .selectAll('text')
                .style('font-size', this.defaultAxisLabelStyle.font.size + 'px')
                .style('font-family', this.defaultAxisLabelStyle.font.family);
                // .style('font-weight', 100)
                // .style('stroke-width', 0.5)
                // .style('stroke', this.defaultAxisLabelStyle.font.color);
            }

            if (scale.tickTextParser) {
                delayExcute(50, () => {
                    this.axisGroups[scale.orient].selectAll('text')
                    .text((d: string) => {
                        return scale.tickTextParser(d);
                    })
                })
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
                    .style('text-anchor', (d: AxisTitle) => {
                        let anchor = '';
                        if (d.align === Align.TOP) {
                            anchor = 'end';
                        } else if (d.align === Align.BOTTOM) {
                            anchor = 'start';
                        } else {
                            anchor = 'middle';
                        }
                        return anchor;
                    })
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
                            if (d.align === Align.TOP) {
                                x = 0;
                            } else if (d.align === Align.BOTTOM) {
                                x = 0 - this.height;
                            } else {
                                x = 0 - (this.height / 2);
                            }
                        } else if (scale.orient === Placement.BOTTOM || scale.orient === Placement.TOP) {
                            if (d.align === Align.LEFT) {
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
            Object.keys(maxTextWidth).forEach((orient: string) => {
                if (this.margin[orient] < maxTextWidth[orient] + padding) {
                    this.margin[orient] = maxTextWidth[orient] + padding;
                    isAxisUpdate = true;
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

        const checkboxPadding = this.isCheckBox ? this.legendItemSize.width + this.legendPadding : 0;
        let addTitleWidth = 0;
        if (this.isTitle && this.titlePlacement === Placement.LEFT) {
            addTitleWidth = this.titleContainerSize.width;
        }
        let addAllWidth = 0;
        if (this.isAll) {
            addAllWidth = this.allWidth;
        }

        let currentRow = 0;
        let currentX = 0;

        const keys: Array<LegendItem> = this.seriesList.map((series: ISeries) => {
            const label: string = series.displayName ? series.displayName : series.selector;
            const shape: string = series.shape ? series.shape : Shape.RECT;
            return {
                label,
                shape,
                selected: true,
                isHide: false
            }
        });

        if (this.isAll) {
            keys.unshift({
                label: 'All',
                selected: true,
                isHide: false,
                shape: Shape.NONE
            });
        }
        
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
            .attr('id', (d: LegendItem) => {
                return d.label === 'All' ? 'legend-all-group' : null;
            })
            .attr('transform', (d: any, index: number) => {
                let x = 0;
                let y = this.legendPadding;
                if (this.legendPlacement === Placement.LEFT || this.legendPlacement === Placement.RIGHT) {
                    if (this.legendPlacement === Placement.LEFT) {
                        x = this.legendPadding;
                    }
                    x = x + addTitleWidth;
                    y = index * 20 + addAllWidth;
                }
                if (this.legendPlacement === Placement.TOP || this.legendPlacement === Placement.BOTTOM) {
                    if (index > 0) {
                        currentX += this.legendTextWidthList[index - 1] + this.legendPadding;
                    }

                    if (this.legendRowBreakCount.indexOf(index) > -1) {
                        currentRow = this.legendRowBreakCount.indexOf(index) + 1;
                        currentX = 0;
                    }
                    
                    x = currentX;
                    y = (this.legendItemTextHeight + this.legendPadding) * currentRow;
                }
                return `translate(${x}, ${y})`;
            });

        if (this.isCheckBox) {
            legendItemGroup.each((d: LegendItem, index: number, nodeList: any) => {
                drawSvgCheckBox(select(nodeList[index]), this.onLegendCheckBoxClick);
            });
        }

        const legendLabelGroup: Selection<BaseType, any, BaseType, any> = legendItemGroup.selectAll('.legend-label-group')
            .data((d: any) =>[d])
            .join(
                (enter) => enter.append('g').attr('class', 'legend-label-group'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('id', (d: LegendItem) => {
                return d.label === 'All' ? 'legend-all-label' : null;
            })
            .attr('transform', `translate(${checkboxPadding}, 0)`)
            .on('click', this.onLegendLabelItemClick);

        legendLabelGroup.each((d: LegendItem, i: number, nodeList: any) => {
            const distictKeys = this.isAll ? keys.filter((key: LegendItem) => key.label !== 'All') : keys;
            if (d.shape === Shape.LINE) {
                drawLegendColorItemByLine(select(nodeList[i]), this.legendItemSize, distictKeys, this.colors);
            } else if (d.shape === Shape.CIRCLE) {
                drawLegendColorItemByCircle(select(nodeList[i]), this.legendItemSize, distictKeys, this.colors);
            } else if (d.shape === Shape.RECT) {
                drawLegendColorItemByRect(select(nodeList[i]), this.legendItemSize, distictKeys, this.colors);
            }
        });
      
        legendLabelGroup.selectAll('.legend-label')
            .data((d: LegendItem) => [d])
            .join(
                (enter) => enter.append('text').attr('class', 'legend-label'),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('font-family', this.defaultLegendStyle.font.family)
            .style('font-size', this.defaultLegendStyle.font.size)
            .attr('dy', '.35em')
            .attr('transform', (d: LegendItem, index: number) => {
                const x = (d.shape === Shape.NONE ? 0 : this.legendPadding + this.legendItemSize.width);
                return `translate(${x}, 5)`;
            })
            .text((d: LegendItem) => { return d.label; });
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

    protected updateDisplay(displayType: DisplayType = DisplayType.NORMAL) {
        if (this.width <= 50 || this.height <= 50) {
            if (console && console.log) {
                console.log('It is too small to draw.');
            }
            return;
        }
        this.clearOption();
        // 기준이되는 axis가 완료된 후에 나머지를 그린다.
        this.updateAxis()
            .then(() => {
                this.updateLegend();
                // POINT: 해당 기능이 series에 의존함으로 series를 먼저 그린뒤에 function을 설정 하도록 한다.
                this.updateFunctions();
                this.updateTitle();
                this.updateSeries(displayType);
                this.updateOptions();
            });
    }

    protected setupData(data: Array<T>) {
        // this.originalData = [...data];
        return data;
    }

    protected setupScale(
        axes: Array<Axis> = [],
        width: number = 0,
        height: number = 0,
        reScaleAxes?: Array<any>
    ): Array<Scale> {
        // zoom out 했을 경우에 초기화.
        if (!reScaleAxes || (reScaleAxes && !reScaleAxes.length)) {
            this.currentScale.length = 0;
        }

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
            } else if (axis.type === ScaleType.POINT) {
                scale = scalePoint().range(range).padding(axis.padding ? +axis.padding : 0.1);
                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    scale.domain(
                        this.data.map((item: T) => item[axis.field])
                    );
                }
            } else { 
                if (axis.type === ScaleType.TIME) {
                    // TODO: interval option 추가
                    // 참고 http://jsfiddle.net/sarathsaleem/8tmLrb9t/7/
                    scale = scaleTime().range(range);
                } else {
                    // ScaleType.NUMBER => numeric type
                    // TODO: interval option 추가 (interval 일 경우에는 argument가 3개: start, end, step)
                    scale = scaleLinear().range(range);
                }
                
                // POINT: zoom 시 현재 scale을 유지하기 위함.
                // min max setup
                if (this.currentScale.length) {
                    const tempScale = this.currentScale.find((scale: any) => scale.field === axis.field);
                    minValue = tempScale ? tempScale.min : 0;
                    maxValue = tempScale ? tempScale.max : 0;
                } else {
                    if (!axis.hasOwnProperty('max')) {
                        if (axis.type === ScaleType.TIME) {
                            axis.max = max(this.data.map((item: T) => new Date(item[axis.field]).getTime()));
                        } else {
                            axis.max = max(this.data.map((item: T) => parseFloat(item[axis.field])));
                            axis.max += Math.round(axis.max * 0.05);
                        }
                    }
    
                    if (!axis.hasOwnProperty('min')) {
                        if (axis.type === ScaleType.TIME) {
                            axis.min = min(this.data.map((item: T) => new Date(item[axis.field]).getTime()));
                        } else {
                            axis.min = min(this.data.map((item: T) => parseFloat(item[axis.field])));
                            axis.min -= Math.round(axis.min * 0.05);
                        }
                    }
    
                    minValue = axis.min;
                    maxValue = axis.max;
                }

                // axis domain label setup
                if (axis.domain) {
                    scale.domain(axis.domain);
                } else {
                    // POINT: zoom 시 적용될 scale
                    if (reScaleAxes && reScaleAxes.length) {
                        this.currentScale = [...reScaleAxes];
                        const reScale = this.currentScale.find((d: any) => d.field === axis.field);
                        minValue = reScale.min;
                        maxValue = reScale.max;
                    } else {
                        // POINT: zoom 시 현재 scale을 유지하기 위함.
                        if (this.currentScale.length) {
                            const reScale = this.currentScale.find((d: any) => d.field === axis.field);
                            minValue = reScale.min;
                            maxValue = reScale.max;
                        }
                    }

                    if (axis.type === ScaleType.NUMBER) {
                        // TODO : index string domain 지정.
                        scale.domain(
                            [minValue, maxValue]
                        );

                        if (axis.isRound === true) {
                            scale.nice();
                        }
                    } else {
                        scale.domain([new Date(minValue), new Date(maxValue)]);
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
                tickTextParser: axis.tickTextParser ? axis.tickTextParser : undefined,
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
        const scale: Scale = this.scales.find((scale: Scale) => scale.orient === orient);
        const currentScale: any = scale.scale;

        if (!extent) {
            if (!this.idleTimeout) return this.idleTimeout = setTimeout(this.idled, 350);
            if (this.originDomains[orient]) {
                currentScale.domain([this.originDomains[orient][0], this.originDomains[orient][1]]);
            }
        } else {
            if (!this.originDomains[orient]) {
                this.originDomains[orient] = currentScale.domain();
            }

            let domainStart = 0;
            let domainEnd = 0;

            if (orient === Placement.TOP || orient === Placement.BOTTOM) {
                domainStart = currentScale.invert(extent[0]);
                domainEnd = currentScale.invert(extent[1]);
            } else { // left, right 는 아래에서 위로 정렬이기 때문.
                domainStart = currentScale.invert(extent[1]);
                domainEnd = currentScale.invert(extent[0]);
            }

            currentScale.domain([ domainStart, domainEnd ]);
            this.axisGroups[orient].select('.brush' + orient).call(
                brush.move, null
            );
        }

        let currnetAxis: any = this.axisSetupByScale(scale);

        this.axisGroups[orient]
        .call(currnetAxis)
        .selectAll('text')
            .style('font-size', this.defaultAxisLabelStyle.font.size + 'px')
            .style('font-family', this.defaultAxisLabelStyle.font.family);
            // .style('font-weight', 100)
            // .style('stroke-width', 0.5)
            // .style('stroke', this.defaultAxisLabelStyle.font.color);

        if (scale.tickTextParser) {
            delayExcute(50, () => {
                this.axisGroups[orient]
                .text((d: string) => {
                    return scale.tickTextParser(d);
                });
            });
        }
        
        if (scale.isGridLine) {
            const targetScale = getAxisByPlacement(scale.orient, currentScale);
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

        // this.axisGroups[orient].transition().duration(1000).call(currnetAxis);

        this.updateSeries();
        this.updateOptions();
    }

    // TODO: 해상도에 최적화중입니다. 팝업 표시 추가.
    protected resizeEventHandler = () => {
        
        if (!this.svg) return;

        this.isResize = true;

        this.setRootSize();

        this.initContainer();

        this.clipPath.attr('width', this.width)
                .attr('height', this.height)
                .attr('x', 0)
                .attr('y', 0);

        this.updateDisplay(DisplayType.RESIZE);

        this.isResize = false;
    }

    private axisSetupByScale(scale: Scale) {
        let orientedAxis: any = null;

        if (scale.orient === Placement.RIGHT) {
            orientedAxis = axisRight(scale.scale);
        } else if (scale.orient === Placement.LEFT) {
            orientedAxis = axisLeft(scale.scale);
        } else if (scale.orient === Placement.TOP) {
            orientedAxis = axisTop(scale.scale);
        } else {
            orientedAxis = axisBottom(scale.scale);
        }

        if (scale.type === ScaleType.NUMBER) {
            if (scale.tickFormat) {
                orientedAxis.ticks(null, scale.tickFormat);
            } else {
                orientedAxis.tickFormat(format(',.0f'));
            }
        } else if (scale.type === ScaleType.TIME) {
            if (scale.tickFormat) {
                orientedAxis.tickFormat(timeFormat(scale.tickFormat));
            }
        }

        if (scale.tickSize) {
            orientedAxis.ticks(scale.tickSize);
        }

        return orientedAxis;
    }

    private pointerClear() {
        const selectionCanvas = select((this.svg.node() as HTMLElement).parentElement).select('.' + ChartBase.SELECTION_CANVAS);
        if (selectionCanvas && selectionCanvas.node()) {
            const context = (selectionCanvas.node() as any).getContext('2d');
            context.clearRect(0, 0, this.width, this.height);
        }
        this.hideTooltip();
    }

    private clearOption() {
        this.hideTooltip();
    }

    private idled = () => { 
        this.idleTimeout = null; 
    }

    // 범례 아이템 체크박스 클릭 이벤트
    private onLegendCheckBoxClick = (d: LegendItem, index: number, nodeList: any) => {
        if (d.label === 'All') {
            this.onLegendAllCheckBoxItemClick(d, index, nodeList)
        } else {
            this.onLegendCheckBoxItemClick(d, index, nodeList);
        }
    }

    // 범례 전체 선택 체크박스 클릭 이벤트
    private onLegendAllCheckBoxItemClick(d: LegendItem, index: number, nodeList: any) {
        this.hideTooltip();
        this.currentLegend = null;
        d.isHide = !d.isHide;
        this.seriesList.forEach((series: ISeries) => {
            series.hide((series.displayName ? series.displayName : series.selector), d.isHide);
        });
        this.legendGroup.selectAll('.legend-label-group').filter((item: LegendItem) => item.label !== 'All').each((item: LegendItem, i: number, node: any) => {
            item.isHide = d.isHide;
        });

        this.legendGroup.selectAll('.legend-item-group').filter((item: LegendItem) => item.label !== 'All').selectAll('.checkbox-mark').each((item: any, i: number, node: any) => {
            item.checked = !d.isHide;
            select(node[i]).style('opacity', item.checked? 1 : 0)
        });
    }

    // 범례 체크박스 클릭 이벤트
    private onLegendCheckBoxItemClick(d: LegendItem, index: number, nodeList: any) {
        this.hideTooltip();
        d.isHide = !d.isHide;
        const target: ISeries = this.seriesList.find((series: ISeries) => (series.displayName ? series.displayName : series.selector) === d.label);
        if (target) {
            target.hide(d.label, d.isHide);
            if (!d.isHide && !d.selected) {
                target.select(d.label, d.selected);
            }

            if (this.isAll) {
                let isCheckedAll = (this.legendGroup.selectAll('#legend-all-group').selectAll('.checkbox-mark').data()[0] as any).checked;
                
                let checkCount = 0;
                let uncheckCount = 0;
                let allCount = 0;
                this.legendGroup.selectAll('.legend-item-group').filter((item: LegendItem) => item.label !== 'All').selectAll('.checkbox-mark').each((item: any, i: number, node: any) => {
                    if (item.checked) {
                        checkCount++;
                    } else {
                        uncheckCount++;
                    }
                    allCount++;
                });

                if (isCheckedAll && uncheckCount > 0) {
                    // all check 해제
                    this.legendGroup.selectAll('#legend-all-group').selectAll('.checkbox-mark').each((item: any, i: number, node: any) => {
                        item.checked = false;
                        item.data.isHide = true;
                        select(node[i]).style('opacity', item.checked? 1 : 0);
                    });
                } else {
                    if (checkCount === allCount) {
                        // all check 설정.
                        this.legendGroup.selectAll('#legend-all-group').selectAll('.checkbox-mark').each((item: any, i: number, node: any) => {
                            item.checked = true;
                            item.data.isHide = false;
                            select(node[i]).style('opacity', item.checked? 1 : 0);
                        });
                    }
                }
            }
        }
    }

    // 범례 라벨 아이템 클릭 이벤트
    private onLegendLabelItemClick = (d: LegendItem, index: number, nodeList: any) => {
        if (d.label === 'All') {
            this.onLegendAllLabelItemSelect(d, index, nodeList)
        } else {
            this.onLegendLabelItemSelect(d, index, nodeList);
        }
    }

    // 범례 라벨 아이템 선택 효과
    private onLegendLabelItemSelect(d: LegendItem, index: number, nodeList: any) {
        this.currentLegend = d.label;
        d.selected = !d.selected;

        select(nodeList[index]).style('opacity', d.selected === false ? 0.5 : null);

        const target: ISeries = this.seriesList.find((series: ISeries) => (series.displayName ? series.displayName : series.selector) === d.label);
        if (target) {
            target.select(d.label, d.selected);
        }
    }

    // 범례 전체선택 라벨 효과
    private onLegendAllLabelItemSelect = (d: LegendItem, index: number, nodeList: any) => {
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
}
