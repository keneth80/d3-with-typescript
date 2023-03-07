import {ChartConfiguration} from './component/chart';
import {generatorCommomConfiguration} from './component/chart-generator';
import {BaseConfiguration, PlayChart} from './component/play-chart';
import {BasicTopology} from './component/series';

export const SvgTopology = (configuration: BaseConfiguration) => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);
    chartConfiguration.series = [
        new BasicTopology({
            selector: 'topology'
        })
    ];

    return new PlayChart(chartConfiguration);
};
