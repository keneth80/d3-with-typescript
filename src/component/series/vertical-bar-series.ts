import { Selection, BaseType } from 'd3-selection';
import { ISeries } from '../chart/series.interface';
import { Scale, ChartBase } from '../chart/chart-base';
import { Subject, Observable } from 'rxjs';

export interface VerticalBarSeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
}

export class VerticalBarSeries implements ISeries {
    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    private barClass: string = 'bar';

    private itemClickSubject: Subject<any> = new Subject();

    private chart: ChartBase;

    private xField: string;

    private yField: string;

    constructor(configuration: VerticalBarSeriesConfiguration) {
        if (configuration) {
            if (configuration.selector) {
                this.barClass = configuration.selector;
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
        if (!mainGroup.select(`.${this.barClass}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.barClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;
        this.mainGroup.selectAll(`.${this.barClass}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('rect').attr('class', this.barClass),
                    (update) => update,
                    (exit) => exit.remove
                )
                .attr('x', (data: any) => { 
                    return x(data[this.xField]); 
                })
                .attr('width', x.bandwidth())
                .attr('y', (data: any) => { 
                    return y(data[this.yField]);
                })
                .attr('height', (data: any) => { 
                    return height - y(data[this.yField]); 
                })
                .on('click', (data: any) => {
                    this.itemClickSubject.next(data);
                });
    }
}