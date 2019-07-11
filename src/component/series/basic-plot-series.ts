import { Selection, BaseType } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { Subject, Observable, config } from 'rxjs';

import { ISeries } from '../chart/series.interface';
import { Scale, ChartBase } from '../chart/chart-base';

export interface BasicPlotSeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
    style?: {
        stroke?: string;
        fill?: string;
    }
}

export class BasicPlotSeries implements ISeries {
    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    private seriesClass: string = 'basic-plot';

    private itemClickSubject: Subject<any> = new Subject();

    private chart: ChartBase;

    private xField: string;

    private yField: string;

    private style: any;

    constructor(configuration: BasicPlotSeriesConfiguration) {
        if (configuration) {
            if (configuration.selector) {
                this.seriesClass = configuration.selector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.style) {
                this.style = configuration.style;
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
        if (!mainGroup.select(`.${this.seriesClass}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.seriesClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'top').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;
        
        let padding = 0;
        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }
        
        const elements = this.mainGroup.selectAll(`.${this.seriesClass}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('circle').attr('class', this.seriesClass),
                    (update) => update,
                    (exit) => exit.remove
                )
                .attr('cx', (data: any, i) => { return x(data[this.xField]) + padding; })
                .attr('cy', (data: any) => { return y(data[this.yField]); })
                .attr('r', 5)
                .on('click', (data: any) => {
                    this.itemClickSubject.next(data);
                });
        if (this.style) {
            elements.style('fill', this.style.fill || '#000')
                .style('stroke', this.style.stroke || '#fff')
        }
    }
}