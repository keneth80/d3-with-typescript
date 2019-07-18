import { Selection, BaseType } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export interface BasicLineSeriesConfiguration {
    selector?: string;
    dotSelector?: string;
    xField: string;
    yField: string;
    isDot?: boolean;
    style?: {
        stroke?: string;
        fill?: string;
    }
}

export class BasicLineSeries extends SeriesBase {
    protected dotGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private selector: string = 'basic-line';

    private dotClass: string = 'basic-line-dot';

    private xField: string;

    private yField: string;

    private isDot: boolean = true;

    constructor(configuration: BasicLineSeriesConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.selector = configuration.selector;
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

            if (configuration.isDot === false) {
                this.isDot = false;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select(`.${this.dotClass}-group`).node()) {
            this.dotGroup = mainGroup.append('g').attr('class', `${this.dotClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;
        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        this.line = line()
            .defined(data => data[this.yField])
            .x((data: any, i) => {
                return x(data[this.xField]) + padding; 
            }) // set the x values for the line generator
            .y((data: any) => { 
                return y(data[this.yField]); 
            }) // set the y values for the line generator 
            .curve(curveMonotoneX); // apply smoothing to the line

        this.mainGroup.selectAll(`.${this.selector}`)
            .data([chartData])
                .join(
                    (enter) => enter.append('path').attr('class', this.selector),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('fill', 'none')
                .attr('d', this.line);

        if (this.isDot) {
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
}