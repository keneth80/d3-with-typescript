import { select, Selection, BaseType } from 'd3-selection';

import { Scale, ContainerSize, ChartMouseEvent } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { Placement } from '../chart';

export interface BasicSpecAreaConfiguration<T = any> extends SeriesConfiguration {
    selector: string;
    startField: string;
    endField: string;
    placement?: string; // 
    data?: Array<T>;
    style?: {
        color: string;
    }
}

export class BasicSpecArea<T = any> extends SeriesBase {
    private startField: string;

    private endField: string;

    private labelField: string;

    private stepData: Array<T>;

    private placement: string = 'bottom';

    constructor(configuration: BasicSpecAreaConfiguration) {
        super(configuration);
        if (configuration) {
            if (configuration.startField) {
                this.startField = configuration.startField;
            }

            if (configuration.endField) {
                this.endField = configuration.endField;
            }

            if (configuration.data) {
                this.stepData = configuration.data;
            }

            if (configuration.placement) {
                this.placement = configuration.placement;
            }

            if (configuration.style) {
                
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
            this.svg = parentElement.select('.option-canvas').style('z-index', 0);
        }

        if (!this.svg.select('.' + this.selector + '-group').node()) {
            this.mainGroup = this.svg.append('g').attr('class', this.selector + '-group');
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        if (!this.stepData || !this.stepData.length) {
            return;
        }
        
        const compareScale: Scale = scales.find((scale: Scale) => scale.orient === this.placement);
        const axis = compareScale.scale;

        this.mainGroup.attr('transform', `translate(${this.chartBase.chartMargin.left}, ${this.chartBase.chartMargin.top})`);
        
        const elementGroup = this.mainGroup.selectAll('.' + this.selector + '-group')
            .data(this.stepData)
                .join(
                    (enter) => enter.append('g').attr('class', this.selector + '-group'),
                    (update) => update,
                     (exit) => exit.remove
                )
                .attr('transform', (data: T) => {
                    return `translate(${axis(data[this.startField])}, 0)`;
                });

        elementGroup.selectAll('.' + this.selector + '-box')
            .data((data: T) => [data])
                .join(
                    (enter) => enter.append('rect').attr('class', this.selector + '-box'),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('fill', '#f9e1fa')
                .attr('width', (data: T) => { 
                    return axis(data[this.endField]) - axis(data[this.startField]);
                })
                .attr('height', geometry.height);
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