import { Selection, BaseType } from 'd3-selection';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';

export interface ExampleSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
}

export class ExampleSeries extends SeriesBase {
    private xField: string;

    private yField: string;

    constructor(configuration: ExampleSeriesConfiguration) {
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
                  seriesGroup: Selection<BaseType, any, HTMLElement, any>,
                  index: number) {
        this.svg = svg;
        if (!seriesGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = seriesGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        const x: any = scales.find((scale: Scale) => scale.field === this.xField).scale;
        const y: any = scales.find((scale: Scale) => scale.field === this.yField).scale;
        this.mainGroup.selectAll(`.${this.selector}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('rect').attr('class', this.selector),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('stroke', '#fff')
                .style('fill', color)
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
                });
    }

    select(displayName: string, isSelected: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', !isHide ? null : 0);
        this.mainGroup.lower();
    }
}