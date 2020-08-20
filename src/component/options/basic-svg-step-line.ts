import { select, Selection, BaseType } from 'd3-selection';

import { Scale, ContainerSize, ChartMouseEvent } from '../chart/chart.interface';
import { Placement } from '../chart/chart-configuration';
import { OptionsBase } from '../chart/options-base';

export interface BasicStepLineConfiguration<T = any> {
    selector: string;
    xField: string;
    data?: Array<T>;
}

export class BasicStepLine<T = any> extends OptionsBase {
    private xField: string;

    private stepData: Array<T>;

    constructor(configuration: BasicStepLineConfiguration) {
        super();
        this.selector = configuration.selector || 'step-line';
        if (configuration) {
            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.data) {
                this.stepData = configuration.data;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        // option canvas 생성
        // this.svg = this.setOptionCanvas(svg);

        // option 을 제일 뒤로 보내기 위함.
        svg.style('z-index', 1);
        this.svg = mainGroup;
        if (!this.svg.select('.' + this.selector + '-group').node()) {
            this.mainGroup = this.svg.append('g').attr('class', this.selector + '-group');
        }
    }

    drawOptions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {
        if (!this.stepData || !this.stepData.length) {
            return;
        }
        
        const xScale: Scale = scales.find((scale: Scale) => scale.orient === Placement.BOTTOM);
        const x = xScale.scale;

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
        this.mainGroup.remove();
    }
}