import { Selection, BaseType } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';

export interface BasicLineSeriesConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    dot?: {
        radius?: number,
        isCurve: boolean // default : false
    }
    colors?: string[];
    style?: {
        stroke?: string;
        fill?: string;
    }
}

export class BasicLineSeries extends SeriesBase {
    protected dotGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private dotClass: string = 'basic-line-dot';

    private xField: string;

    private yField: string;

    private isDot: boolean = false;

    private colors: string[] = [];

    private radius: number = 4;

    private isCurve: boolean = false;

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

            if (configuration.dot) {
                this.isDot = true;
                this.radius = configuration.dot.radius || 4;
                this.isCurve = configuration.dot.isCurve === true ? true : false;
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

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number, index: number, color: string) {
        // TODO : 스케일 정보 가져올 때 필드를 참조해서 가져오도록 한다.
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
            }); // set the y values for the line generator

        if (this.isCurve) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }

        this.mainGroup.selectAll(`.${this.selector}`)
            .data([chartData])
                .join(
                    (enter) => enter.append('path').attr('class', this.selector),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('stroke', color)
                .style('fill', 'none')
                .attr('d', this.line);

        if (this.isDot) {
            this.dotGroup.selectAll(`.${this.dotClass}`)
                .data(chartData)
                    .join(
                        (enter) => enter.append('circle').attr('class', this.dotClass)
                            .on('click', (data: any) => {
                                event.preventDefault();
                                event.stopPropagation();
                                this.itemClickSubject.next(data);
                            }),
                        (update) => update,
                        (exit) => exit.remove
                    )
                    .style('stroke', '#fff')
                    .style('fill', (d: any) => color)
                    .attr('cx', (data: any, i) => { return x(data[this.xField]) + padding; })
                    .attr('cy', (data: any) => { return y(data[this.yField]); })
                    .attr('r', this.radius);
        }
    }

    select(displayName: string, isSelected: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', isSelected ? null : 0.4);
        if (this.isDot) {
            this.dotGroup.selectAll(`.${this.dotClass}`).style('opacity', isSelected ? null : 0.4);
        }
    }

    hide(displayName: string, isHide: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', !isHide ? null : 0);
        if (this.isDot) {
            this.dotGroup.selectAll(`.${this.dotClass}`).style('opacity', !isHide ? null : 0);
        }
    }
}