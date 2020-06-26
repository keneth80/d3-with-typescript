import { select, Selection, BaseType } from 'd3-selection';

import { Scale, ContainerSize, ChartMouseEvent } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { Placement } from '../chart';

export interface BasicStepAreaConfiguration<T = any> extends SeriesConfiguration {
    selector: string;
    startField: string;
    endField: string;
    labelField: string;
    data?: Array<T>;
}

export class BasicStepArea<T = any> extends SeriesBase {
    private startField: string;

    private endField: string;

    private labelField: string;

    private stepData: Array<T>;

    constructor(configuration: BasicStepAreaConfiguration) {
        super(configuration);
        if (configuration) {
            if (configuration.startField) {
                this.startField = configuration.startField;
            }

            if (configuration.endField) {
                this.endField = configuration.endField;
            }

            if (configuration.labelField) {
                this.labelField = configuration.labelField;
            }

            if (configuration.data) {
                this.stepData = configuration.data;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>) {
        const parentElement = select((svg.node() as HTMLElement).parentElement);
        if(!parentElement.select('.step-canvas').node()) {
            this.svg = parentElement.append('svg')
                .attr('class', 'step-canvas')
                .style('z-index', 99)
                .style('position', 'absolute')
                .style('width', '100%')
                .style('height', this.chartBase.chartMargin.top + 'px');
        } else {
            this.svg = parentElement.select('.step-canvas').style('z-index', 99);
        }

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

        this.mainGroup.attr('transform', `translate(${this.chartBase.chartMargin.left}, 0)`);
        
        const elementGroup = this.mainGroup.selectAll('.' + this.selector + '-group')
            .data(this.stepData)
                .join(
                    (enter) => enter.append('g').attr('class', this.selector + '-group'),
                    (update) => update,
                     (exit) => exit.remove
                )
                .attr('transform', (data: T) => {
                    return `translate(${x(data[this.startField])}, 1)`;
                });

        elementGroup.selectAll('.' + this.selector + '-label')
            .data((data: T) => [data])
                .join(
                    (enter) => enter.append('text').attr('class', this.selector + '-label'),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('font-size', '12px')
                .style('font-family', ' Arial, Helvetica, sans-serif')
                .attr('dy', '0.71em')
                .attr('x', 2)
                .attr('y', this.chartBase.chartMargin.top / 2)
                .text((data: T) => data[this.labelField]);

        elementGroup.selectAll('.' + this.selector + '-box')
            .data((data: T) => [data])
                .join(
                    (enter) => enter.append('rect').attr('class', this.selector + '-box'),
                    (update) => update,
                    (exit) => exit.remove
                )
                // .style('stroke', '#000')
                // .style('fill', '#fff')
                .style('fill-opacity', 0)
                .attr('width', (data: T) => { 
                    return x(data[this.endField]) - x(data[this.startField]);
                })
                .attr('height', this.chartBase.chartMargin.top);

        elementGroup
            .on('mouseover', (data: any) => {
                console.log('mouseover : ', data);
            })
            .on('mouseout', (data: any) => {
                console.log('mouseout : ', data);
            });
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