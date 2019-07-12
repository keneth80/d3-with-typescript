import { Selection, BaseType } from 'd3-selection';
import { ISeries } from '../chart/series.interface';
import { Scale, ChartBase } from '../chart/chart-base';
import { histogram, max } from 'd3-array';
import { nest } from 'd3-collection';
import { scaleLinear } from 'd3-scale';
import { area, curveCatmullRom } from 'd3-shape';

export interface BasicViolinSeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
}

export class BasicViolinSeries implements ISeries {
    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    private itemClass: string = 'basic-violin';

    private chart: ChartBase;

    private xField: string;

    private yField: string;

    private histogram: any;

    constructor(configuration: BasicViolinSeriesConfiguration) {
        if (configuration) {
            if (configuration.selector) {
                this.itemClass = configuration.selector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }
        }
    }

    set chartBase(value: ChartBase) {
        this.chart = value;
    }

    get chartBase() {
        return this.chart;
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.itemClass}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.itemClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;

        this.histogram = histogram()
            .domain(y.domain())
            .thresholds(y.ticks(20))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
            .value(d => d);

        const sumstat = nest()  // nest function allows to group the calculation per level of a factor
            .key((d: any) => { return d.Species;})
            .rollup((d: any) => {   // For each key..
                const input = d.map((g: any) => { return g.Sepal_Length;})    // Keep the variable called Sepal_Length
                const bins = this.histogram(input)   // And compute the binning on it.
                return bins;
            })
            .entries(chartData);
        
        let maxNum = 0
        for ( let i in sumstat ){
            const allBins: Array<any> = sumstat[i][this.yField];
            const lengths = allBins.map((a: Array<any>) => {return a.length;});
            const longuest = max(lengths);
            if (longuest > maxNum) { 
                maxNum = longuest 
            }
        }

        const xNum = scaleLinear()
            .range([0, x.bandwidth()])
            .domain([-maxNum,maxNum]);

        this.mainGroup.selectAll(`.${this.itemClass}`)
            .data(sumstat)
            .join(
                (enter) => enter.append('g').attr('class', this.itemClass),
                (update) => update,
                (exit) => exit.remove
            )
            .attr('transform', (d: any) => { return('translate(' + x(d[this.xField]) +' ,0)') } )
                .selectAll('.violin-area')
                .data((d: any) => {
                    return [(d[this.yField])];
                })
                .join(
                    (enter) => enter.append('path').attr('class', 'violin-area'),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('stroke', 'none')
                .style('fill','#69b3a2')
                .attr('d', area()
                    .x0((d: any) => { return(xNum(-d.length)) } )
                    .x1((d: any) => { return(xNum(d.length)) } )
                    .y((d: any) => { return(y(d.x0)) } )
                    .curve(curveCatmullRom));
    }
}