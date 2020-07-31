import { BasicChart } from './basic-chart';
import { ChartConfiguration, 
         ChartTooltip, ChartTitle, ChartLegend,
         Margin, Axis,  } from './chart/chart-configuration';

import { BasicCanvasTraceConfiguration, BasicCanvasTrace } from './series/basic-canvas-trace';


export interface MiccBaseConfiguration {
    selector: string;

    tooltip?: ChartTooltip;

    title?: ChartTitle; // chart title

    isResize?: boolean; // default: true

    legend?: ChartLegend; // legend display

    margin?: Margin; // custom margin

    axes?: Array<Axis>; // axis list
    
    functions?: Array<any>; // function list

    options?: Array<any>; // function list

    data: Array<any>; // data

    colors?: Array<string>; // custom color (default: d3.schemeCategory10, size: 10)
}

export interface CanvasTraceChartConfiguration extends MiccBaseConfiguration {
    series: Array<BasicCanvasTraceConfiguration>
}

export interface CanvasTraceChartConfiguration extends MiccBaseConfiguration {
    series: Array<BasicCanvasTraceConfiguration>
}

export class MiChart {
    static traceChartByCanvas(configuration: CanvasTraceChartConfiguration): BasicChart {
        const chartConfiguration: ChartConfiguration = {
            selector: configuration.selector,
            tooltip: configuration.tooltip,
            title: configuration.title,
            isResize: configuration.isResize,
            legend: configuration.legend,
            margin: configuration.margin,
            axes: configuration.axes,
            data: configuration.data,
            series: configuration.series.map((traceConfiguration: BasicCanvasTraceConfiguration) => {
                return new BasicCanvasTrace(traceConfiguration);
            }),
            functions: configuration.functions,
            options: configuration.options
        }
        return new BasicChart(chartConfiguration);
    }

    static generalChart(configuration: MiccBaseConfiguration): BasicChart {
        return new BasicChart(configuration);
    }
}