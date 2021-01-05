import { Selection, BaseType, select } from 'd3-selection';

import { ContainerSize } from '../chart.interface';
import { textBreak, getTransformByArray } from '.';
import { ChartBase } from '..';

export const setIndexChartTooltipByPosition = (
    tooltipTarget: Selection<BaseType, any, BaseType, any>,
    tooltipText: string,
    chartGeometry: ContainerSize,
    position: number[],
    tooltipPointerSize: ContainerSize,
    margin?: {
        left: number,
        top: number
    },
    prevGroup?: Selection<BaseType, any, BaseType, any>
) => {
    const textElement: any = tooltipTarget
        .select('text')
        .attr('dy', '.1em')
        .text(tooltipText);

    textBreak(textElement, '\n');

    const parseTextNode = textElement.node().getBBox();

    const textWidth = Math.floor(parseTextNode.width) + 10;
    const textHeight = Math.floor(parseTextNode.height) + 10;

    let prevx, prevy = 0;
    let prevWidth, prevHeight = 0;
    let transform = ['0', '0'];
    if (prevGroup) {
        const prevGroupNode = (prevGroup.node() as any).getBBox();
        transform = getTransformByArray(prevGroup.attr('transform'));
        prevWidth = Math.floor(prevGroupNode.width);
        prevHeight = Math.floor(prevGroupNode.height);
        prevx = parseInt(transform[0]) + prevWidth;
        prevy = parseInt(transform[1]) + prevHeight;
    }

    let xPosition = (prevx ? prevx : Math.round(position[0])) + tooltipPointerSize.width + (margin? margin.left : 0) + 2;
    let yPosition = (prevy ? prevy : Math.round(position[1])) - (textHeight) + (margin ? margin.top : 0);
    if (xPosition + textWidth >= chartGeometry.width) {
        xPosition = (prevx ? prevx - prevWidth : xPosition) - (textWidth + tooltipPointerSize.width) - 2;
    }

    if (yPosition <= 0) {
        yPosition = (prevy ? prevy + prevHeight : yPosition) + (tooltipPointerSize.height);
    }

    tooltipTarget
        .attr('transform', `translate(${xPosition}, ${yPosition})`)
        .selectAll('rect.tooltip-background') // .tooltip-background
        .attr('width', textWidth)
        .attr('height', textHeight);
}

export const setChartTooltipByPosition = (
    tooltipTarget: Selection<BaseType, any, BaseType, any>,
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
