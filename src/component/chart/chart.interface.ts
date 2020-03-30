import { Selection, BaseType } from 'd3-selection';
import { ChartConfiguration } from './chart-configuration';

export interface IChart {
    bootstrap(configuration: ChartConfiguration) :void;

    draw(): void;

    showTooltip(): Selection<BaseType, any, HTMLElement, any>;

    hideTooltip(): Selection<BaseType, any, HTMLElement, any>;

    destroy(): void;
}
