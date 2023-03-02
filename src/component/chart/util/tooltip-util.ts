import { Selection, BaseType, select } from 'd3-selection';

import { ContainerSize } from '../chart.interface';
import { textBreak, getTransformByArray } from '.';
import { ChartBase } from '..';

export const setMultiChartTooltipByPosition = (
    tooltipTarget: Selection<BaseType, any, BaseType, any>,
    tooltipText: string,
    chartGeometry: ContainerSize,
    position: number[],
    prevGroup?: Selection<BaseType, any, BaseType, any>,
    index?: number
) => {
    // POINT: max count를 지정해야 할 듯 아니면 많으면 격자로 뿌려주게끔 해야할 것 같음
    // 현재 최대 4개로 지정
    // pointer를 기준으로 왼쪽위 오른쪽위 오른쪽아래 왼쪽아래 4군데 positoin을 셋팅한다.
    const textElement: any = tooltipTarget
        .select('text')
        .attr('dy', '.1em')
        .text(tooltipText);

    textBreak(textElement, '\n');

    const parseTextNode = textElement.node().getBBox();

    const textWidth = Math.floor(parseTextNode.width) + 10;
    const textHeight = Math.floor(parseTextNode.height) + 10;

    const padding = 5;

    let xPosition = 0;
    let yPosition = 0;
    let prevGroupNode = undefined;
    let transform = ['0', '0'];
    if (prevGroup) {
        prevGroupNode = (prevGroup.node() as any).getBBox();
        transform = getTransformByArray(prevGroup.attr('transform'));
    }

    if ((position[0] + textWidth >= chartGeometry.width && position[1] + textHeight >= chartGeometry.height) ||
        position[1] + textHeight >= chartGeometry.height) {
        xPosition = Math.round(position[0]) - textWidth - padding;
        yPosition = Math.round(position[1]) - textHeight - padding;
        if (prevGroup) {
            yPosition = parseInt(transform[1]) - textHeight - padding;
        }
    } else {
        switch (index) {
            case 0:
                xPosition = Math.round(position[0]) + padding;
                yPosition = Math.round(position[1]) - textHeight - padding;
            break;
            case 1:
                xPosition = parseInt(transform[0]);
                yPosition = parseInt(transform[1]) + textHeight + padding;
            break;
            case 2:
                xPosition = parseInt(transform[0]) - textWidth - padding;
                yPosition = parseInt(transform[1]);
            break;
            case 3:
                xPosition = parseInt(transform[0]);
                yPosition = parseInt(transform[1]) - textHeight - padding;
            break;
        }
        if (xPosition + textWidth >= chartGeometry.width) {
            xPosition = chartGeometry.width - textWidth - padding;
        }
    }

    tooltipTarget
        .attr('transform', `translate(${xPosition}, ${yPosition})`)
        .selectAll('rect.tooltip-background') // .tooltip-background
        .attr('width', textWidth)
        .attr('height', textHeight);
}

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
    prevGroup?: Selection<BaseType, any, BaseType, any>,
    index?: number
) => {
    // TODO: max count를 지정해야 할 듯 아니면 많으면 격자로 뿌려주게끔 해야할 것 같음
    // 최대 4개로 하자 우선!
    // pointer를 기준으로 왼쪽위 오른쪽위 오른쪽아래 왼쪽아래 4군데 positoin을 셋팅한다.
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
        console.log('prevGroup : ', index, prevGroup.attr('transform'), prevx, prevy, prevWidth, prevHeight);
    }

    let xPosition = (prevx ? prevx : Math.round(position[0])) + tooltipPointerSize.width + (margin? margin.left : 0) + 2;
    let yPosition = (prevy ? prevy : Math.round(position[1])) - (textHeight) + (margin ? margin.top : 0);
    // TODO: 3개 이상일 경우에 겹침 현상이 나옴. 
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
