import { Selection, BaseType } from 'd3-selection';
import { area, line, Area, Line } from 'd3-shape';

import { Scale, ContainerSize } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { SeriesConfiguration } from '../../chart/series.interface';

export interface BasicAreaSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
}

export class BasicAreaSeries extends SeriesBase {
    private area: Area<[number, number]>;

    private line: Line<[number, number]>;

    private xField: string;

    private yField: string;

    constructor(configuration: BasicAreaSeriesConfiguration) {
        super(configuration);
        if (configuration) {
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

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orient === 'left').scale;

        this.area = area()
            .x((d: any) => {
                return x(d[this.xField]) + 1;
            })
            .y0(geometry.height)
            .y1((d: any) => {
                return y(d[this.yField]);
            });

        this.line = line()
            .x((d: any) => { return x(d[this.xField]); })
            .y((d: any) => { return y(d[this.yField]); });

        this.mainGroup.selectAll(`.${this.selector}-path`)
            .data([chartData])
                .join(
                    (enter) => enter.append('path').attr('class', `${this.selector}-path`),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('fill', 'lightsteelblue')
                .attr('d', this.area);

        this.mainGroup.selectAll(`.${this.selector}-line`)
            .data([chartData])
                .join(
                    (enter) => enter.append('path').attr('class', `${this.selector}-line`),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('fill', 'none')
                .style('stroke', 'steelblue')
                .style('stroke-width', 2)
                .attr('d', this.line);
    }
}