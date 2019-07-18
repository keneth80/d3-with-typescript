import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export interface LabelSeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
    templete?: any;
}

export class LabelSeries extends SeriesBase {
    private selector: string = 'label';

    private xField: string;

    private yField: string;

    private templete: any;

    constructor(configuration: LabelSeriesConfiguration) {
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
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;
        this.mainGroup.selectAll(`.${this.selector}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('text').attr('class', this.selector),
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