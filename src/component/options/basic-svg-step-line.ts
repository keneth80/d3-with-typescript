import { select, Selection, BaseType } from 'd3-selection';

import { Scale, ContainerSize, ChartMouseEvent } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { Placement } from '../chart';

export interface BasicStepLineConfiguration<T = any> extends SeriesConfiguration {
    selector: string;
    xField: string;
    data?: Array<T>;
}

export class BasicStepLine<T = any> extends SeriesBase {
    private xField: string;

    private stepData: Array<T>;

    constructor(configuration: BasicStepLineConfiguration) {
        super(configuration);
        if (configuration) {
            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.data) {
                this.stepData = configuration.data;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = this.setOptionCanvas(svg);

        if (!this.svg.select('.' + this.selector + '-group').node()) {
            this.mainGroup = this.svg.append('g').attr('class', this.selector + '-group');
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        if (!this.stepData || !this.stepData.length) {
            return;
        }
        
        const xScale: Scale = scales.find((scale: Scale) => scale.orient === Placement.BOTTOM);
        const x = xScale.scale;

        this.mainGroup.attr('transform', `translate(${this.chartBase.chartMargin.left}, ${this.chartBase.chartMargin.top})`);
        
        this.mainGroup.selectAll('.' + this.selector + '-line')
            .data(this.stepData)
                .join(
                    (enter) => enter.append('line').attr('class', this.selector + '-line'),
                    (update) => update,
                     (exit) => exit.remove
                )
                .style('stroke', '#ccc')
                .style('stroke-width', 1)
                .attr('x1', (data: T) => {
                    return x(data[this.xField]);
                })
                .attr('y1', 0)
                .attr('x2', (data: T) => {
                    return x(data[this.xField]);
                })
                .attr('y2', geometry.height);
    }

    select(displayName: string, isSelected: boolean) {
        this.mainGroup.selectAll('.' + this.selector).style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.mainGroup.selectAll('.' + this.selector).style('opacity', !isHide ? null : 0);
        this.mainGroup.lower();
    }

    destroy() {
        this.subscription.unsubscribe();
    }
}