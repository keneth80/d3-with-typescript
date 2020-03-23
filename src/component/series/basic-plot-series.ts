import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export interface BasicPlotSeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
    style?: {
        stroke?: string;
        fill?: string;
    }
}

export class BasicPlotSeries extends SeriesBase {
    private selector: string = 'basic-plot';

    private xField: string;

    private yField: string;

    private style: any;

    constructor(configuration: BasicPlotSeriesConfiguration) {
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

            if (configuration.style) {
                this.style = configuration.style;
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
        const x: any = scales.find((scale: Scale) => scale.orinet === 'top').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;
        
        let padding = 0;
        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }
        
        const elements = this.mainGroup.selectAll(`.${this.selector}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('circle').attr('class', this.selector)
                        .on('click', (data: any) => {
                            event.preventDefault();
                            event.stopPropagation();
                            this.itemClickSubject.next(data);
                        }),
                    (update) => update,
                    (exit) => exit.remove
                )
                .attr('cx', (data: any, i) => { return x(data[this.xField]) + padding; })
                .attr('cy', (data: any) => { return y(data[this.yField]); })
                .attr('r', 5);
        if (this.style) {
            elements.style('fill', this.style.fill || '#000')
                .style('stroke', this.style.stroke || '#fff')
        }
    }
}