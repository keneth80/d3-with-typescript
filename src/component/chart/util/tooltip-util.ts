import { Selection, BaseType, select } from 'd3-selection';

import { ContainerSize } from '../chart.interface';
import { textBreak } from '.';
import { ChartBase } from '..';

export const setChartTooltipByPosition = (
    tooltipTarget: Selection<BaseType, any, HTMLElement, any>,
    tooltipText: string,
    chartGeometry: ContainerSize,
    position: number[],
    tooltipPointerSize: ContainerSize,
    margin?: {
        left: number,
        top: number
    }
) => {
    const textElement: any = tooltipTarget
        .select('text')
        .attr('dy', '.1em')
        .text(tooltipText);

    textBreak(textElement, '\n');

    const parseTextNode = textElement.node().getBBox();

    const textWidth = Math.floor(parseTextNode.width) + 10;
    const textHeight = Math.floor(parseTextNode.height) + 10;

    let xPosition = Math.round(position[0]) + tooltipPointerSize.width + (margin? margin.left : 0) + 5;
    let yPosition = Math.round(position[1]) - (textHeight + 5) + (margin ? margin.top : 0);

    if (xPosition + textWidth >= chartGeometry.width) {
        xPosition = xPosition - (textWidth + tooltipPointerSize.width) - 5;
    }

    if (yPosition <= 0) {
        yPosition = yPosition + (tooltipPointerSize.height);
    }

    tooltipTarget
        .attr('transform', `translate(${xPosition}, ${yPosition})`)
        .selectAll('rect.tooltip-background') // .tooltip-background
        .attr('width', textWidth)
        .attr('height', textHeight);
}

export const centerPositionForTooltipElement = (
    chart: ChartBase, 
    tooltipElement: any, 
    position: any[], 
    padding: {top: number, left: number} = {top: 0, left: 0}) => {
    const tempWidth = tooltipElement.offsetWidth;
    const tempHeight = tooltipElement.offsetHeight;
    const elementTop = (position[1] + chart.chartMargin.top) - (tempHeight + 20) + padding.top;
    const elementLeft = (position[0] - tempWidth / 2) + chart.chartMargin.left + padding.left;
    select(tooltipElement)
        .style('pointer-events', 'all')
        .style('opacity', 1)
        .style('top', elementTop + 'px')
        .style('left', elementLeft + 'px');
    return tooltipElement;
}
