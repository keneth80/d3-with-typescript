import { select, Selection, BaseType } from 'd3-selection';
import { Subject, Observable, Subscription } from 'rxjs';

import { ChartBase } from './chart-base';
import { ISeries, SeriesConfiguration } from './series.interface';
import { Scale, ContainerSize, ScaleValue, DisplayOption } from './chart.interface';
import { guid } from './util/d3-svg-util';
import { Quadtree } from 'd3-quadtree';

export class SeriesBase implements ISeries {
    type: string = 'series';

    selector: string = 'series-base';

    displayName: string; // legend 출력시 출력 명칭

    displayNames: Array<string>; // legend 출력시 출력 명칭

    shape: string; // legend 출력 시 색상아이템의 type

    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected subscription: Subscription = new Subscription();

    protected itemClickSubject: Subject<{
        data: any,
        target?: any,
        event?: any
    }> = new Subject();

    protected initGeometry: ContainerSize;

    protected geometry: ContainerSize;

    protected scaleValue: ScaleValue;

    protected originQuadTree: Quadtree<Array<any>> = undefined;

    private chart: ChartBase;

    private clipPath: Selection<BaseType, any, HTMLElement, any>;

    private maskId = '';

    constructor(configuration: SeriesConfiguration) {
        if (configuration.type) {
            this.type = configuration.type;
        }

        if (configuration.selector) {
            this.selector = configuration.selector;
        }

        if (configuration.displayName) {
            this.displayName = configuration.displayName;
        }

        if (configuration.shape) {
            this.shape = configuration.shape;
        }
    }

    set chartBase(value: ChartBase) {
        this.chart = value;
    }

    get chartBase() {
        return this.chart;
    }

    get $currentItem(): Observable<any> {
        return this.itemClickSubject.asObservable();
    }

    changeConfiguration(configuration: SeriesConfiguration) {

    }

    select(displayName: string, isSelected: boolean) {

    };

    hide(displayName: string, isHide: boolean) {

    }

    unSelectItem() {

    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
        mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {

    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, displayOption: DisplayOption) {

    }

    setTooltipCanvas(svg: Selection<BaseType, any, HTMLElement, any>) {
        // return this.svg.select('.tooltip-group');
        const parentElement = select((svg.node() as HTMLElement).parentNode as any);
        if(!parentElement.select('.tooltip-canvas').node()) {
            const targetSvg = parentElement.append('svg')
                .attr('class', 'tooltip-canvas')
                .style('z-index', 3)
                .style('position', 'absolute');

            if (!this.clipPath) {
                this.maskId = guid();
                this.clipPath = targetSvg.append('defs')
                    .append('svg:clipPath')
                        .attr('id', this.maskId)
                        .append('rect')
                        .attr('clas', 'option-mask')
                        .attr('x', 0)
                        .attr('y', 0);
            }

            const toolTipGroup = targetSvg.append('g').attr('class', 'tooltip-group');
            this.chartBase.toolTipTarget = toolTipGroup;

            return targetSvg;
        } else {
            return parentElement.select('.tooltip-canvas');
        }
    }

    getSeriesDataByPosition(value: Array<number>) {
        return null;
    }

    showPointAndTooltip(value: Array<number>, selected: Array<any>) {}

    onSelectItem(value: Array<number>, selected: Array<any>) {}

    destroy() {
        this.subscription.unsubscribe();
    }

    drawProgress(
        totalCount: number, 
        currentCount: number, 
        canvas: {width: number, height: number, target: Selection<BaseType, any, BaseType, any>}
    ) {
        const progressWidth = canvas.width / 4;
        const progressHeight = 6;
        if (totalCount > currentCount) {
            canvas.target.selectAll('.progress-background')
                .data(['progress-background'])
                .join(
                    (enter) => enter.append('rect').attr('class', 'progress-background'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .style('fill', '#fff')
                .style('fill-opacity', 0.5)
                .attr('width', canvas.width)
                .attr('height', canvas.height);

            const group = canvas.target.selectAll('.progress-bar-group')
                .data([{
                    totalCount,
                    currentCount
                }])
                .join(
                    (enter) => enter.append('g').attr('class', 'progress-bar-group'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('transform', `translate(${canvas.width / 2 - progressWidth / 2}, ${canvas.height / 2 - progressHeight / 2})`);

            group.selectAll('.progress-bar')
                .data((d: any) => [d])
                .join(
                    (enter) => enter.append('rect').attr('class', 'progress-bar'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .style('stroke', '#fff')
                .style('fill', '#ccc')
                .attr('width', progressWidth)
                .attr('height', progressHeight);

            group.selectAll('.progress-bar-value')
                .data((d: any) => [d])
                .join(
                    (enter) => enter.append('rect').attr('class', 'progress-bar-value'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .style('stroke', '#fff')
                .style('fill', '#0362fc')
                .attr('width', progressWidth * (currentCount / totalCount))
                .attr('height', progressHeight);
        } else {
            canvas.target.selectAll('*').remove();
        }
        return canvas.target;
    }

    protected search(quadtreeObj: Quadtree<Array<any>>, x0: number, y0: number, x3: number, y3: number) {
        const temp = [];
        if (quadtreeObj) {
            quadtreeObj.visit((node: any, x1: number, y1: number, x2: number, y2: number) => {
                if (!node.length) {
                    do {
                        const d = node.data;
                        const selected = d[0] >= x0 && d[0] < x3 && d[1] >= y0 && d[1] < y3;
                        if (selected) {
                            temp.push(d);
                        }
                    } while ((node = node.next));
                }
                return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
            });
        }

        return temp;
    }
}