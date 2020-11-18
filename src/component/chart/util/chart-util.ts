import {
    BasicAreaSeries,
    BasicAreaSeriesConfiguration,
    BasicLineSeries,
    BasicLineSeriesConfiguration,
    GroupedVerticalBarSeries,
    GroupedVerticalBarSeriesConfiguration
} from '../../../component/series';
import { SeriesBase } from '../series-base';
import { SeriesConfiguration } from '../series.interface';

export const makeSeriesByConfigurationType = (configuration: SeriesConfiguration): SeriesBase => {
    let series: SeriesBase;
    switch(configuration.type) {
        case 'GroupedVerticalBarSeries':
            series = new GroupedVerticalBarSeries(configuration as GroupedVerticalBarSeriesConfiguration);
        break;
        case 'BasicLineSeries':
            series = new BasicLineSeries(configuration as BasicLineSeriesConfiguration);
        break;
        case 'BasicAreaSeries':
            series = new BasicAreaSeries(configuration as BasicAreaSeriesConfiguration);
        break;
    }
    return series;
}