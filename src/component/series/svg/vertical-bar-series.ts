import { Selection, BaseType, select } from 'd3-selection';
import { transition } from 'd3-transition';

import { colorDarker } from '../../chart/util/d3-svg-util';
import { Scale, ContainerSize } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { SeriesConfiguration } from '../../chart/series.interface';

export interface VerticalBarSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    style?: {
        fill: string,
        stroke: string,
    }
}

export class VerticalBarSeries extends SeriesBase {
    private xField: string;

    private yField: string;

    private transition: any;

    private style: any = {};

    private isSelected: boolean = true;

    private isHide: boolean = false;

    constructor(configuration: VerticalBarSeriesConfiguration) {
        super(configuration);
        if (configuration) {
            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.style) {
                this.style = {...configuration.style};
            } else {
                this.style = {
                    fill: 'steelblue',
                    stroke: '#2803fc'
                };
            }
        }

        this.transition = transition().duration(750);
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>,
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === this.xDirection).scale;
        const y: any = scales.find((scale: Scale) => scale.orient === this.yDirection).scale;

        const fill = this.style.fill;
        const stroke = this.style.stroke;

        this.mainGroup.selectAll(`.${this.selector}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('rect').attr('class', this.selector),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('stroke', stroke)
                .style('fill', fill)
                .attr('x', (data: any) => {
                    return x(data[this.xField]);
                })
                .attr('width', x.bandwidth())
                .attr('y', geometry.height)
                .attr('height', 0)
                .transition(this.transition) // animation
                .attr('y', (data: any) => {
                    return (data[this.yField] < 0 ? y(0) : y(data[this.yField]));
                })
                .attr('height', (data: any) => {
                    return Math.abs(y(data[this.yField]) - y(0));
                    // return height - y(data[this.yField]);
                });
    }

    select(displayName: string, isSelected: boolean) {
        this.isSelected = isSelected;
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.isHide = isHide;
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', !isHide ? null : 0);
    }
}