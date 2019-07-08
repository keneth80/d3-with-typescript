import { Selection, BaseType } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { Subject, Observable } from 'rxjs';

import { ISeries } from '../chart/series.interface';
import { Scale, ChartBase } from '../chart/chart-base';

export interface BasicLineSeriesConfiguration {
    selector?: string;
    dotSelector?: string;
    xField: string;
    yField: string;
}

export class BasicLineSeries implements ISeries {
    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected dotGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private lineClass: string = 'basic-line';

    private dotClass: string = 'basic-line-dot';

    private itemClickSubject: Subject<any> = new Subject();

    private chart: ChartBase;

    private xField: string;

    private yField: string;

    constructor(configuration: BasicLineSeriesConfiguration) {
        if (configuration) {
            if (configuration.selector) {
                this.lineClass = configuration.selector;
            }

            if (configuration.dotSelector) {
                this.dotClass = configuration.dotSelector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }
        }
    }

    set chartBase(value: ChartBase) {
        this.chart = value;
    }

    get chartBase() {
        return this.chart;
    }

    get currentItem(): Observable<any> {
        return this.itemClickSubject.asObservable();
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.lineClass}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.lineClass}-group`);
        }

        if (!mainGroup.select(`.${this.dotClass}-group`).node()) {
            this.dotGroup = mainGroup.append('g').attr('class', `${this.dotClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;
        const padding = x.bandwidth() / 2;

        this.line = line()
            .x((data: any, i) => { return x(data[this.xField]) + padding; }) // set the x values for the line generator
            .y((data: any) => { return y(data[this.yField]); }) // set the y values for the line generator 
            .curve(curveMonotoneX); // apply smoothing to the line

        this.mainGroup.selectAll(`.${this.lineClass}`)
            .data([chartData])
                .join(
                    (enter) => enter.append('path').attr('class', this.lineClass),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('fill', 'none')
                .attr('d', this.line);

        this.dotGroup.selectAll(`.${this.dotClass}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('circle').attr('class', this.dotClass),
                    (update) => update,
                    (exit) => exit.remove
                )
                .attr('cx', (data: any, i) => { return x(data[this.xField]) + padding; })
                .attr('cy', (data: any) => { return y(data[this.yField]); })
                .attr('r', 5)
                .on('click', (data: any) => {
                    this.itemClickSubject.next(data);
                });
    }
}