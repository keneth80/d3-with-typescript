import { select, Selection, BaseType } from 'd3-selection';

import { Scale, ContainerSize, ChartMouseEvent } from '../chart/chart.interface';
import { Placement, guid } from '../chart';
import { OptionsBase } from '../chart/options-base';

export interface BasicSpecAreaConfiguration<T = any> {
    selector: string;
    startField: string;
    endField: string;
    placement?: string; // 
    data?: Array<T>;
    style?: {
        color: string;
    }
}

export class BasicSpecArea<T = any> extends OptionsBase {
    private startField: string;

    private endField: string;

    private labelField: string;

    private stepData: Array<T>;

    private placement: string = 'bottom';

    constructor(configuration: BasicSpecAreaConfiguration) {
        super();
        this.selector = configuration.selector;
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
        // option canvas 생성
        this.svg = this.setOptionCanvas(svg);

        if (!this.svg.select('.' + this.selector + '-group').node()) {
            this.mainGroup = this.svg.append('g').attr('class', this.selector + '-group');
        }
    }

    drawOptions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {
        if (!this.stepData || !this.stepData.length) {
            return;
        }

        this.mainGroup.selectAll('clipPath').select('rect').attr('width', geometry.width).attr('height', geometry.height);
        
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
                    const x = this.placement === 'bottom' ? axis(data[this.startField]) : 0;
                    const y = this.placement === 'bottom' ? 0 : axis(data[this.startField]);
                    const translate = `translate(${x}, ${y})`;
                    return translate;
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
                    const targetWidth = this.placement === 'bottom' ? axis(data[this.endField]) - axis(data[this.startField]) : geometry.width;
                    return targetWidth;
                })
                .attr('height', (data: T) => {
                    const targetHeight = this.placement === 'bottom' ? geometry.height: axis(data[this.endField]) - axis(data[this.startField]);
                    return targetHeight;
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