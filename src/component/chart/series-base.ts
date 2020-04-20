import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable, Subscription } from 'rxjs';

import { ChartBase } from './chart-base';
import { ISeries, SeriesConfiguration } from './series.interface';
import { Scale, ContainerSize } from './chart.interface';

export class SeriesBase implements ISeries {
    selector: string;

    displayName: string; // legend 출력시 출력 명칭

    shape: string; // legend 출력 시 색상아이템의 type

    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected subscription: Subscription = new Subscription();

    protected itemClickSubject: Subject<{
        data: any,
        target?: any,
        event?: any
    }> = new Subject();

    private chart: ChartBase;

    constructor(configuration: SeriesConfiguration) {
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

    select(displayName: string, isSelected: boolean) {

    };

    hide(displayName: string, isHide: boolean) {

    }

    unSelectItem() {

    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
        mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {

    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {

    }

    destroy() {
        this.subscription.unsubscribe();
    }

    drawProgress(
        totalCount: number, 
        currentCount: number, 
        canvas: {width: number, height: number, target: Selection<BaseType, any, SVGAElement, any>}
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
}