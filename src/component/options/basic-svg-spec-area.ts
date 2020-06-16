import { select, Selection, BaseType } from 'd3-selection';

import { Scale, ContainerSize } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';

export interface BasicSpecAreaConfiguration extends SeriesConfiguration {
    selector: string;
    xField: string;
    yField: string;
}

export class BasicSpecArea extends SeriesBase {
    private xField: string;

    private yField: string;

    constructor(configuration: BasicSpecAreaConfiguration) {
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

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>) {
        const parentElement = select((svg.node() as HTMLElement).parentElement);
        if(!parentElement.select('.option-canvas').node()) {
            this.svg = parentElement.append('svg')
                .attr('class', 'option-canvas')
                .style('z-index', 0)
                .style('position', 'absolute');
        } else {
            this.svg = parentElement.select('.option-canvas');
        }

        if (!this.svg.select('.' + this.selector + '-group').node()) {
            this.mainGroup = this.svg.append('g').attr('class', this.selector + '-group');
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        this.mainGroup.attr('transform', `translate(${this.chartBase.chartMargin.left}, ${this.chartBase.chartMargin.top})`);
        // const x: any = scales.find((scale: Scale) => scale.field === this.xField).scale;
        this.mainGroup.selectAll('.' + this.selector)
            .data([{}])
                .join(
                    (enter) => enter.append('rect').attr('class', this.selector),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('stroke', '#fff')
                .style('fill', '#ffcff9')
                .style('fill-opacity', 0.8)
                .attr('x', (data: any) => { 
                    return geometry.width / 3; 
                })
                .attr('width', 400)
                .attr('y', (data: any) => {
                    return 1;
                })
                .attr('height', (data: any) => {
                    return geometry.height;
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