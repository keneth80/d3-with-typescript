import {Selection} from 'd3-selection';
import {Subscription} from 'rxjs';

import {Quadtree} from 'd3-quadtree';
import {ChartBase} from './chart-base';
import {Placement} from './chart-configuration';
import {ChartSelector} from './chart-selector-variable';
import {ContainerSize, DisplayOption, Scale} from './chart.interface';
import {ISeries, SeriesConfiguration} from './series.interface';
import {guid} from './util/d3-svg-util';

export class SeriesBase implements ISeries {
    type: string = 'series';

    selector: string = 'series-base';

    displayName: string; // legend 출력시 출력 명칭

    displayNames: string[]; // legend 출력시 출력 명칭

    shape: string; // legend 출력 시 색상아이템의 type

    color: string;

    colors: string[];

    protected svg: Selection<any, any, HTMLElement, any>;

    protected mainGroup: Selection<any, any, HTMLElement, any>;

    protected subscription: Subscription = new Subscription();

    // protected itemClickSubject: Subject<{
    //     data: any,
    //     target?: any,
    //     event?: any
    // }> = new Subject();

    protected initGeometry: ContainerSize;

    protected geometry: ContainerSize;

    protected originQuadTree: any = undefined;

    protected xDirection: string = Placement.BOTTOM;

    protected yDirection: string = Placement.LEFT;

    private chart: ChartBase;

    private clipPath: any;

    private maskId = '';

    constructor(configuration: SeriesConfiguration) {
        this.type = configuration.type ?? this.type;

        this.selector = configuration.selector ?? this.selector;

        this.displayName = configuration.displayName ?? this.displayName;

        this.shape = configuration.shape ?? this.shape;

        this.xDirection = configuration.xDirection ?? this.xDirection;

        this.yDirection = configuration.yDirection ?? this.yDirection;
    }

    set chartBase(value: ChartBase) {
        this.chart = value;
    }

    get chartBase() {
        return this.chart;
    }

    // get $currentItem(): Observable<any> {
    //     return this.itemClickSubject.asObservable();
    // }

    xField() {
        return null;
    }

    yField() {
        return null;
    }

    changeConfiguration(configuration: SeriesConfiguration) {}

    select(displayName: string, isSelected: boolean) {}

    hide(displayName: string, isHide: boolean) {}

    unSelectItem() {}

    setSvgElement(svg: Selection<any, any, HTMLElement, any>, mainGroup: Selection<any, any, HTMLElement, any>, index: number) {}

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize, displayOption: DisplayOption) {}

    setTooltipCanvas(svg: Selection<any, any, HTMLElement, any>) {
        // return this.svg.select('.tooltip-group');
        if (!this.chartBase.chartContainer.select('.' + ChartSelector.TOOLTIP_CANVAS).node()) {
            const targetSvg = this.chartBase.chartContainer
                .append('svg')
                .attr('class', ChartSelector.TOOLTIP_CANVAS)
                .style('z-index', 3)
                .style('position', 'absolute')
                .style('width', '100%')
                .style('height', '100%');

            if (!this.clipPath) {
                this.maskId = guid();
                this.clipPath = targetSvg
                    .append('defs')
                    .append('svg:clipPath')
                    .attr('id', this.maskId)
                    .append('rect')
                    .attr('clas', 'option-mask')
                    .attr('x', 0)
                    .attr('y', 0);
            }

            const toolTipGroup = targetSvg
                .append('g')
                .attr('class', 'tooltip-group')
                .attr('transform', `translate(${this.chartBase.chartMargin.left}, ${this.chartBase.chartMargin.top})`);
            this.chartBase.toolTipTarget = toolTipGroup;

            // tooltip 용 svg가 겹치므로 legend group을 상위에 있는 svg로 옮긴다.
            if (this.svg.select('g.legend-group').node()) {
                (targetSvg.node() as any).appendChild(this.svg.select('g.legend-group').node());
            }

            return targetSvg;
        } else {
            return this.chartBase.chartContainer.select('.' + ChartSelector.TOOLTIP_CANVAS);
        }
    }

    getSeriesDataByPosition(value: number[]) {
        return [];
    }

    showPointAndTooltip(value: number[], selected: any[]): number {
        return 0;
    }

    drawPointer(value: number[], selected: any[]): number {
        return 0;
    }

    pointerSize(selected: any[]): ContainerSize {
        return {
            width: 2,
            height: 2
        };
    }

    tooltipText(selected: any[]): string {
        return 'Tooltip Text';
    }

    tooltipStyle(selected: any[]): {fill: string; opacity: number; stroke: string} {
        return null;
    }

    onSelectItem(value: number[], selected: any[]) {}

    destroy() {
        this.subscription.unsubscribe();
    }

    drawProgress(totalCount: number, currentCount: number, canvas: {width: number; height: number; target: Selection<any, any, any, any>}) {
        const progressWidth = canvas.width / 4;
        const progressHeight = 6;
        if (totalCount > currentCount) {
            canvas.target
                .selectAll('.progress-background')
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

            const group = canvas.target
                .selectAll('.progress-bar-group')
                .data([
                    {
                        totalCount,
                        currentCount
                    }
                ])
                .join(
                    (enter) => enter.append('g').attr('class', 'progress-bar-group'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('transform', `translate(${canvas.width / 2 - progressWidth / 2}, ${canvas.height / 2 - progressHeight / 2})`);

            group
                .selectAll('.progress-bar')
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

            group
                .selectAll('.progress-bar-value')
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

    protected search(quadtreeObj: Quadtree<any[]>, x0: number, y0: number, x3: number, y3: number) {
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
