import { ChartConfiguration } from './chart/chart-configuration';
import { ChartBase } from './chart/chart-base';

export class BasicChart<T = any> extends ChartBase {
    protected data: T[];

    constructor(configuration: ChartConfiguration) {
        super(configuration);
    }

    bootstrap(configuration: ChartConfiguration) {
        super.bootstrap(configuration);
    }
}