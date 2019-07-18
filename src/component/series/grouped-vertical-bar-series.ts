import { Selection, select, BaseType, mouse, event } from 'd3-selection';
import { scaleOrdinal, scaleBand } from 'd3-scale';
import { zoomTransform } from 'd3-zoom'
import { stack } from 'd3-shape';
import { format } from 'd3-format';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export interface GroupedVerticalBarSeriesConfiguration {
    selector?: string;
    xField: string;
    columns: Array<string>;
}

export class GroupedVerticalBarSeries extends SeriesBase {
    private selector: string = 'grouped-bar';

    private xField: string;

    private yField: string;

    private columns: Array<string>;

    private rootGroup: Selection<BaseType, any, HTMLElement, any>;

    private legendGroup: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private numberFmt: any;

    constructor(configuration: GroupedVerticalBarSeriesConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.selector = configuration.selector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.columns) {
                this.columns = [...configuration.columns];
            }
        }

        this.numberFmt = format(',d');
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        this.rootGroup = mainGroup;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = this.rootGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select('.legend-group').node()) {
            this.legendGroup = this.rootGroup.append('g')
                .attr('class', 'legend-group')
                .attr('font-family', 'sans-serif')
                .attr('font-size', 10)
                .attr('text-anchor', 'end');
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;

        const keys = this.columns.slice(1);
        const barx: any = scaleBand()
            .domain(keys)
            .rangeRound([0, x.bandwidth()]);

        // set the colors
        const z = scaleOrdinal()
            .range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00']);

        z.domain(keys);

        this.mainGroup.selectAll('.grouped-bar-item-group')
            .data(chartData)
            .join(
                (enter) => enter.append('g')
                            .attr('class', 'grouped-bar-item-group'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('transform', (d: any) => {
                return `translate( ${x(d[this.xField])} ,0)`;
            })
            .selectAll('.grouped-bar-item')
                .data((d: any) => { 
                    return keys.map(
                        (key: string) => { return {key: key, value: d[key]}; }
                    ); 
                })
                .join(
                    (enter) => enter.append('rect').attr('class', 'grouped-bar-item'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('x', (d: any) => { return barx(d.key); })
                .attr('y', (d: any) => { return (d.value < 0 ? y(0) : y(d.value)); })
                .attr('height', (d: any) => { return Math.abs(y(d.value) - y(0)); })
                .attr('width', barx.bandwidth())
                .attr('fill', (d: any) => z(d.key) + '')
                .on('mouseover', (d: any, i, nodeList: any) => {
                    select(nodeList[i])
                        .style('stroke', 'f5330c')
                        .style('stroke-width', 2);

                    this.tooltipGroup = this.chartBase.showTooltip();
                })
                .on('mouseout', (d: any, i, nodeList: any) => {
                    select(nodeList[i])
                        .style('stroke', null)
                        .style('stroke-width', null);

                    this.chartBase.hideTooltip();
                })
                .on('mousemove', (d: any, i: number, nodeList: any) => {
                    const textElement: any = this.tooltipGroup.select('text').text(`${d.key}: ${this.numberFmt(d.value)}`);
                    const textWidth = textElement.node().getComputedTextLength() + 10;
                    this.tooltipGroup.selectAll('rect')
                        .attr('width', textWidth);

                    let xPosition = event.offsetX;
                    let yPosition = event.offsetY -20;
                    if (xPosition + textWidth > width) {
                        xPosition = event.offsetX - textWidth;
                    }
                    this.tooltipGroup.attr('transform', `translate(${xPosition}, ${yPosition})`);

                    // const target: any = nodeList[i];
                    // const parent: any = select(target.parentElement);
                    // const position = mouse(target);

                    // console.log('position : ', target, parent.node().getBBox(), position, xPosition, yPosition);
                });
        
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