import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';

export interface LabelSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    templete?: any;
}

export class LabelSeries extends SeriesBase {
    private xField: string;

    private yField: string;

    private templete: any;

    constructor(configuration: LabelSeriesConfiguration) {
        super(configuration);
        if (configuration) {
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

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orient === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orient === 'left').scale;
        this.mainGroup.selectAll(`.${this.selector}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('text').attr('class', this.selector)
                        .on('click', (data: any) => {
                            event.preventDefault();
                            event.stopPropagation();
                            this.itemClickSubject.next(data);
                        }),
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
                });
    }
}