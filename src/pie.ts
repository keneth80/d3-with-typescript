import {ChartConfiguration} from './component/chart';
import {generatorCommomConfiguration, generatorFunctions, generatorOptions} from './component/chart-generator';
import {BaseConfiguration, OptionConfiguration, PlayChart} from './component/play-chart';
import {BasicDonutSeries, BasicDonutSeriesConfiguration} from './component/series/svg/basic-donut-series';

export const SvgDonuttChart = (
    configuration: BaseConfiguration,
    series: BasicDonutSeriesConfiguration[] = [],
    options: OptionConfiguration[] = []
): PlayChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((seriesConfiguration: BasicDonutSeriesConfiguration) => {
        return new BasicDonutSeries(seriesConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new PlayChart(chartConfiguration);
};
