import {Selection, BaseType} from 'd3-selection';

import {Scale, ContainerSize, DisplayOption} from '../chart/chart.interface';
import {SeriesBase} from '../chart/series-base';
import {SeriesConfiguration} from '../chart/series.interface';

export interface ExampleSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
}

export class ExampleSeries extends SeriesBase {
    private config: ExampleSeriesConfiguration;

    constructor(configuration: ExampleSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
    }

    xField(): any {
        return this.config.xField;
    }

    yField(): any {
        return null;
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, seriesGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {
        this.svg = svg;
        if (!seriesGroup.select('.' + this.selector + '-group').node()) {
            this.mainGroup = seriesGroup.append('g').attr('class', this.selector + '-group');
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, option: DisplayOption) {
        const x: any = scales.find((scale: Scale) => scale.field === this.config.xField).scale;
        const y: any = scales.find((scale: Scale) => scale.field === this.config.yField).scale;
        this.mainGroup
            .selectAll('.' + this.selector)
            .data(chartData)
            .join(
                (enter) => enter.append('rect').attr('class', this.selector),
                (update) => update,
                (exit) => exit.remove
            )
            .style('stroke', '#fff')
            .style('fill', option.color)
            .attr('x', (data: any) => {
                return x(data[this.config.xField]);
            })
            .attr('width', x.bandwidth())
            .attr('y', (data: any) => {
                return data[this.config.yField] < 0 ? y(0) : y(data[this.config.yField]);
            })
            .attr('height', (data: any) => {
                return Math.abs(y(data[this.config.yField]) - y(0));
            });
    }

    select(displayName: string, isSelected: boolean) {
        this.mainGroup.selectAll('.' + this.selector).style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.mainGroup.selectAll('.' + this.selector).style('opacity', !isHide ? null : 0);
        this.mainGroup.lower();
    }
}
