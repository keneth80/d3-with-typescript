import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable } from 'rxjs';
import { histogram, max } from 'd3-array';
import { nest } from 'd3-collection';
import { scaleLinear } from 'd3-scale';
import { area, curveCatmullRom } from 'd3-shape';

import { SeriesBase } from '../chart/series-base';
import { Scale, ContainerSize } from '../chart/chart.interface';
import { SeriesConfiguration } from '../chart/series.interface';

export interface BasicViolinSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
}

export class BasicViolinSeries extends SeriesBase {
    private xField: string;

    private yField: string;

    private histogram: any;

    constructor(configuration: BasicViolinSeriesConfiguration) {
        super(configuration);
        if (configuration) {
            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orient === 'left').scale;

        this.histogram = histogram()
            .domain(y.domain())
            .thresholds(y.ticks(20))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
            .value(d => d);

        const sumstat = nest()  // nest function allows to group the calculation per level of a factor
            .key((d: any) => { return d[this.xField];})
            .rollup((d: any) => {   // For each key..
                const input = d.map((g: any) => { return g[this.yField];})
                const bins = this.histogram(input)   // And compute the binning on it.
                return bins;
            })
            .entries(chartData);
        
        let maxNum = 0
        for ( let i in sumstat ){
            const allBins: Array<any> = sumstat[i].value;
            const lengths = allBins.map((a: Array<any>) => {return a.length;});
            const longuest = max(lengths);
            if (longuest > maxNum) {
                maxNum = longuest;
            }
        }

        const xNum = scaleLinear()
            .range([0, x.bandwidth()])
            .domain([-maxNum, maxNum]);

        this.mainGroup.selectAll(`.${this.selector}`)
            .data(sumstat)
            .join(
                (enter) => enter.append('g').attr('class', this.selector),
                (update) => update,
                (exit) => exit.remove
            )
            .attr('transform', (d: any) => { return('translate(' + x(d.key) +' ,0)') } )
                .selectAll('.violin-area')
                .data((d: any) => {
                    return [(d.value)];
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