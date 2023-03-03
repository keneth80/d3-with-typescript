import {BaseType, Selection} from 'd3-selection';

import {ContainerSize, Scale} from '../chart/chart.interface';
import {OptionsBase} from '../chart/options-base';

export interface BasicSpecAreaConfiguration<T = any> {
    selector: string;
    startField: string;
    endField: string;
    placement?: string;
    data?: any;
    style?: {
        color: string;
    };
}

export class BasicSpecArea<T = any> extends OptionsBase {
    private startField: string;

    private endField: string;

    private labelField: string;

    private stepData: any;

    private placement: string = 'bottom';

    constructor(configuration: BasicSpecAreaConfiguration) {
        super();
        this.selector = configuration.selector ?? 'spec-area';
        this.startField = configuration.startField;
        this.endField = configuration.endField;
        this.stepData = configuration.data ?? [];
        this.placement = configuration.placement;
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

    drawOptions(chartData: T[], scales: Scale[], geometry: ContainerSize) {
        if (!this.stepData || !this.stepData.length) {
            return;
        }

        const compareScale: Scale = scales.find((scale: Scale) => scale.orient === this.placement);
        const axis = compareScale.scale;

        const elementGroup = this.mainGroup
            .selectAll('.' + this.selector + '-group')
            .data(this.stepData)
            .join(
                (enter) => enter.append('g').attr('class', this.selector + '-group'),
                (update) => update,
                (exit) => exit.remove
            )
            .attr('transform', (data: any) => {
                const x = this.placement === 'bottom' ? axis(data[this.startField]) : 0;
                const y = this.placement === 'bottom' ? 0 : axis(data[this.startField]);
                const translate = `translate(${(x < 0 ? 0 : x) + 1}, ${y > geometry.height ? geometry.height : y})`;
                return translate;
            });

        elementGroup
            .selectAll('.' + this.selector + '-box')
            .data((data: any) => [data])
            .join(
                (enter) => enter.append('rect').attr('class', this.selector + '-box'),
                (update) => update,
                (exit) => exit.remove
            )
            .style('fill', '#f9e1fa')
            .attr('width', (data: any) => {
                const targetWidth = this.placement === 'bottom' ? axis(data[this.endField]) - axis(data[this.startField]) : geometry.width;
                return (targetWidth > geometry.width ? geometry.width : targetWidth) - 1;
            })
            .attr('height', (data: any) => {
                const targetHeight = this.placement === 'bottom' ? geometry.height : axis(data[this.endField]) - axis(data[this.startField]);
                return targetHeight > geometry.height ? geometry.height : targetHeight;
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
        this.mainGroup.remove();
    }
}
