import {
    BasicAreaSeries,
    BasicAreaSeriesConfiguration,
    BasicLineSeries,
    BasicLineSeriesConfiguration,
    GroupedVerticalBarSeries,
    GroupedVerticalBarSeriesConfiguration
} from '../../../component/series';
import { SeriesBase } from '../series-base';
import { SeriesConfiguration, SeriesType } from '../series.interface';

export const makeSeriesByConfigurationType = (configuration: SeriesConfiguration): SeriesBase => {
    let series: SeriesBase;
    switch(configuration.type) {
        case SeriesType.SVG_VERTICAL_BAR:
            series = new GroupedVerticalBarSeries(configuration as GroupedVerticalBarSeriesConfiguration);
        break;
        case SeriesType.SVG_LINE:
            series = new BasicLineSeries(configuration as BasicLineSeriesConfiguration);
        break;
        case SeriesType.SVG_AREA:
            series = new BasicAreaSeries(configuration as BasicAreaSeriesConfiguration);
        break;
    }
    return series;
}