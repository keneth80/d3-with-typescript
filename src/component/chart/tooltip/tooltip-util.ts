import { Selection, BaseType } from 'd3-selection';

import { ContainerSize } from '../chart.interface';
import { textBreak } from '../util';

export const setChartTooltipByPosition = (
    tooltipTarget: Selection<BaseType, any, HTMLElement, any>,
    tooltipText: string,
    chartGeometry: ContainerSize,
    position: number[],
    tooltipPointerSize: ContainerSize
) => {
    const textElement: any = tooltipTarget
        .select('text')
        .attr('dy', '.1em')
        .text(tooltipText);

    textBreak(textElement, '\n');

    const parseTextNode = textElement.node().getBBox();

    const textWidth = Math.floor(parseTextNode.width) + 7;
    const textHeight = Math.floor(parseTextNode.height) + 5;

    let xPosition = Math.round(position[0]) + tooltipPointerSize.width;
    let yPosition = Math.round(position[1]) - (textHeight + 5);

    if (xPosition + textWidth >= chartGeometry.width) {
        xPosition = xPosition - (textWidth + tooltipPointerSize.width);
    }

    if (yPosition <= 0) {
        yPosition = yPosition + (tooltipPointerSize.height);
    }

    tooltipTarget
        .attr('transform', `translate(${xPosition}, ${yPosition})`)
        .selectAll('rect')
        .attr('width', textWidth)
        .attr('height', textHeight);
}