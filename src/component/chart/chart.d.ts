import { Selection, BaseType } from 'd3-selection';

declare interface IChart {
    bootstrap() :void;

    draw(): void;

    showTooltip(): Selection<BaseType, any, HTMLElement, any>;

    hideTooltip(): Selection<BaseType, any, HTMLElement, any>;

    destroy(): void;
}

declare class ChartBase<T = any> implements IChart {
    bootstrap() :void;

    draw(): void;

    showTooltip(): Selection<BaseType, any, HTMLElement, any>;

    hideTooltip(): Selection<BaseType, any, HTMLElement, any>;

    destroy(): void;
}
