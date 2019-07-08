import { Selection, BaseType } from 'd3-selection';
import { ISeries } from '../chart/series.interface';
import { Scale, ChartBase } from '../chart/chart-base';
import { Subject, Observable } from 'rxjs';

export interface LabelSeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
    templete?: any;
}

export class LabelSeries implements ISeries {
    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    private itemClass: string = 'label';

    private itemClickSubject: Subject<any> = new Subject();

    private chart: ChartBase;

    private xField: string;

    private yField: string;

    private templete: any;

    constructor(configuration: LabelSeriesConfiguration) {
        if (configuration) {
            if (configuration.selector) {
                this.itemClass = configuration.selector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.templete) {
                this.templete = configuration.templete;
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
        if (!mainGroup.select(`.${this.itemClass}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.itemClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;
        this.mainGroup.selectAll(`.${this.itemClass}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('text').attr('class', this.itemClass),
                    (update) => update,
                    (exit) => exit.remove
                )
                .attr('x', (data: any) => { 
                    return x(data[this.xField]); 
                })
                .attr('y', (data: any) => { 
                    return y(data[this.yField]) - 7;
                })
                .text( (data: any) => {
                    let returnText = `${this.yField}: ${data[this.yField]}`;
                    if (this.templete) {
                        returnText = this.templete(data);
                    }
                    return returnText;
                })
                .on('click', (data: any) => {
                    this.itemClickSubject.next(data);
                });
    }
}