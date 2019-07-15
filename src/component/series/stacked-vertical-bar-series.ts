import { Selection, BaseType } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { axisLeft } from 'd3-axis';
import { max } from 'd3-array';
import { stack } from 'd3-shape';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';
import { callbackify } from 'util';

export interface VerticalBarSeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
    columns: Array<string>;
}

export class StackedVerticalBarSeries extends SeriesBase {
    private barClass: string = 'stacked-bar';

    private xField: string;

    private yField: string;

    private columns: Array<string>;

    private rootGroup: Selection<BaseType, any, HTMLElement, any>;

    private legendGroup: Selection<BaseType, any, HTMLElement, any>;

    constructor(configuration: VerticalBarSeriesConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.barClass = configuration.selector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.columns) {
                this.columns = [...configuration.columns];
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        this.rootGroup = mainGroup;
        if (!mainGroup.select(`.${this.barClass}-group`).node()) {
            this.mainGroup = this.rootGroup.append('g').attr('class', `${this.barClass}-group`);
        }

        if (!mainGroup.select('.legend-group').node()) {
            this.legendGroup = this.rootGroup.append('g')
                .attr('class', 'legend-group')
                .attr('font-family', 'sans-serif')
                .attr('font-size', 10)
                .attr('text-anchor', 'end');
        }
    }

    // https://bl.ocks.org/mjfoster83/7c9bdfd714ab2f2e39dd5c09057a55a0
    // example 참고함.
    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;

        // set the colors
        const z = scaleOrdinal()
        .range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00']);

        const keys = this.columns.slice(1);
        
        chartData.sort((a, b) => { return b[this.yField] - a[this.yField]; });
        x.domain(chartData.map((d) => { return d[this.xField]; }));
        y.domain([0, max(chartData, (d) => { return d[this.yField]; })]).nice();
        z.domain(keys);

        this.mainGroup.selectAll('.stacked-bar-group')
            .data(stack().keys(keys)(chartData))
            .join(
                (enter) => enter.append('g').attr('class', 'stacked-bar-group').attr('fill', (d: any) => { return z(d.key) + ''; }),
                (update) => update,
                (exit) => exit.remove()
            )
            .selectAll('.stacked-bar-item')
                .data((d: any) => { return d; })
                .join(
                    (enter) => enter.append('rect').attr('class', 'stacked-bar-item'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('x', (d: any) => { return x(d.data[this.xField]); })
                .attr('y', (d: any) => { return y(d[1]); })
                .attr('height', (d: any) => { return y(d[0]) - y(d[1]); })
                .attr('width', x.bandwidth());
                // .on('mouseover', () => { tooltip.style('display', null); })
                // .on('mouseout', () => { tooltip.style('display', 'none'); })
                // .on('mousemove', (d: any) => {
                //     console.log(d);
                //     var xPosition = d3.mouse(this)[0] - 5;
                //     var yPosition = d3.mouse(this)[1] - 5;
                //     tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
                //     tooltip.select('text').text(d[1]-d[0]);
                // });
        const legendKey = keys.slice().reverse();
        const legend = this.legendGroup.selectAll('.legend-item-group')
            .data(legendKey)
            .join(
                (enter) => enter.append('g').attr('class', 'legend-item-group'),
                (update) => {
                    update.selectAll('*').remove();
                    return update;
                },
                (exit) => exit.remove()
            )
            .attr('transform', (d: any, i: number) => { return 'translate(0,' + i * 20 + ')'; });
      
        legend.append('rect')
            .attr('x', width - 19)
            .attr('width', 19)
            .attr('height', 19)
            .attr('fill', (d) => {
                return z(d) + '';
            });
      
        legend.append('text')
            .attr('x', width - 24)
            .attr('y', 9.5)
            .attr('dy', '0.32em')
            .text((d) => { return d; });
    }
}