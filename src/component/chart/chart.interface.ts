import { Selection, BaseType } from 'd3-selection';

export interface IChart {
    bootstrap() :void;

    draw(): void;

    showTooltip(): Selection<BaseType, any, HTMLElement, any>;

    hideTooltip(): Selection<BaseType, any, HTMLElement, any>;

    destroy(): void;
}
