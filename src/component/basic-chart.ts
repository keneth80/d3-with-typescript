import { ChartBase } from './chart/chart-base';
import { ChartConfiguration } from './chart/chart-configuration';

export class BasicChart<T = any> extends ChartBase {
    protected data: Array<T>;

    constructor(configuration: ChartConfiguration) {
        super(configuration);
    }

    bootstrap() {
        super.bootstrap();
    }
}