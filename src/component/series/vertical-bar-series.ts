import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export interface VerticalBarSeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
}

export class VerticalBarSeries extends SeriesBase {
    private selector: string = 'bar';

    private xField: string;

    private yField: string;

    constructor(configuration: VerticalBarSeriesConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.selector = configuration.selector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;
        this.mainGroup.selectAll(`.${this.selector}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('rect').attr('class', this.selector),
                    (update) => update,
                    (exit) => exit.remove
                )
                .attr('x', (data: any) => { 
                    return x(data[this.xField]); 
                })
                .attr('width', x.bandwidth())
                .attr('y', (data: any) => {
                    return (data[this.yField] < 0 ? y(0) : y(data[this.yField]));
                })
                .attr('height', (data: any) => {
                    return Math.abs(y(data[this.yField]) - y(0));
                    // return height - y(data[this.yField]); 
                })
                .on('click', (data: any) => {
                    this.itemClickSubject.next(data);
                });
    }
}