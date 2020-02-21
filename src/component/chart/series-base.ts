import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable } from 'rxjs';

import { ChartBase, Scale } from './chart-base';
import { ISeries } from './series.interface';

export class SeriesBase implements ISeries {
    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected itemClickSubject: Subject<any> = new Subject();

    private chart: ChartBase;

    constructor() { }

    set chartBase(value: ChartBase) {
        this.chart = value;
    }

    get chartBase() {
        return this.chart;
    }

    get $currentItem(): Observable<any> {
        return this.itemClickSubject.asObservable();
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
        mainGroup: Selection<BaseType, any, HTMLElement, any>) {

    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {

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
