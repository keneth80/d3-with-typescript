import { Selection, BaseType } from 'd3-selection';
import { ChartConfiguration } from './chart-configuration';

declare interface IChart {
    bootstrap(configaration: ChartConfiguration) :void;

    draw(): void;

    showTooltip(): Selection<BaseType, any, HTMLElement, any>;

    hideTooltip(): Selection<BaseType, any, HTMLElement, any>;

    destroy(): void;
}

declare class ChartBase<T = any> implements IChart {
    constructor(configaration: ChartConfiguration);

    bootstrap(configaration: ChartConfiguration) :void;

    draw(): void;

    showTooltip(): Selection<BaseType, any, HTMLElement, any>;

    hideTooltip(): Selection<BaseType, any, HTMLElement, any>;

    destroy(): void;
}
