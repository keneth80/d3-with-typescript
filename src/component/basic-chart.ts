import { ChartBase, ChartConfiguration } from './chart';

export class BasicChart<T = any> extends ChartBase {
    protected data: Array<T>;

    constructor(configuration: ChartConfiguration) {
        super(configuration);
    }

    bootstrap(configuration: ChartConfiguration) {
        super.bootstrap(configuration);
    }
}