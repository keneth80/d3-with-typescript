import {Selection, BaseType} from 'd3-selection';
import {Subject, Observable} from 'rxjs';
import {bin, max, rollup} from 'd3-array';
import {scaleLinear} from 'd3-scale';
import {area, curveCatmullRom} from 'd3-shape';

import {SeriesBase} from '../../chart/series-base';
import {Scale, ContainerSize} from '../../chart/chart.interface';
import {SeriesConfiguration} from '../../chart/series.interface';

export interface BasicViolinSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
}

export class BasicViolinSeries extends SeriesBase {
    private histogram: any;

    private config: BasicViolinSeriesConfiguration;

    constructor(configuration: BasicViolinSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
    }

    xField() {
        return this.config.xField;
    }

    yField() {
        return this.config.yField;
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === this.xDirection).scale;
        const y: any = scales.find((scale: Scale) => scale.orient === this.yDirection).scale;

        this.histogram = bin()
            .domain(y.domain())
            .thresholds(y.ticks(20)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
            .value((d) => d);

        const sumstat: any = rollup(
            chartData,
            (d: any) => {
                // For each key..
                const input = d.map((g: any) => {
                    return g[this.config.yField];
                });
                const bins = this.histogram(input); // And compute the binning on it.
                return bins;
            },
            (d: any) => {
                return d[this.config.xField];
            }
        );

        let maxNum = 0;
        for (const i in sumstat) {
            const allBins: any[] = sumstat[i].value;
            const lengths = allBins.map((a: any[]) => {
                return a.length;
            });
            const longuest = max(lengths);
            if (longuest > maxNum) {
                maxNum = longuest;
            }
        }

        const xNum = scaleLinear().range([0, x.bandwidth()]).domain([-maxNum, maxNum]);

        this.mainGroup
            .selectAll(`.${this.selector}`)
            .data(sumstat)
            .join(
                (enter) => enter.append('g').attr('class', this.selector),
                (update) => update,
                (exit) => exit.remove
            )
            .attr('transform', (d: any) => {
                return 'translate(' + x(d.key) + ' ,0)';
            })
            .selectAll('.violin-area')
            .data((d: any) => {
                return [d.value];
            })
            .join(
                (enter) => enter.append('path').attr('class', 'violin-area'),
                (update) => update,
                (exit) => exit.remove
            )
            .style('stroke', 'none')
            .style('fill', '#69b3a2')
            .attr(
                'd',
                area()
                    .x0((d: any) => {
                        return xNum(-d.length);
                    })
                    .x1((d: any) => {
                        return xNum(d.length);
                    })
                    .y((d: any) => {
                        return y(d.x0);
                    })
                    .curve(curveCatmullRom)
            );
    }
}
