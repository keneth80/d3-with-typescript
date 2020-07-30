import { BasicChart } from './basic-chart';
import { ChartConfiguration, 
         ChartTooltip, ChartTitle, ChartLegend,
         Margin, Axis,  } from './chart/chart-configuration';

export interface MiccConfiguration {
    selector: string;

    tooltip?: ChartTooltip;

    title?: ChartTitle; // chart title

    isResize?: boolean; // default: true

    legend?: ChartLegend; // legend display

    margin?: Margin; // custom margin

    axes?: Array<Axis>; // axis list

    series?: Array<any>; // series list
    
    functions?: Array<any>; // function list

    options?: Array<any>; // function list

    data: Array<any>; // data

    colors?: Array<string>; // custom color (default: d3.schemeCategory10, size: 10)

}

export class Micc {
    static traceChart(configuration: any): BasicChart {
        return new BasicChart(configuration);
    }

    static generalChart(configuration: any): BasicChart {
        return new BasicChart(configuration);
    }
}