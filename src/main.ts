import './style.css';
import '@babel/polyfill';

import { select } from 'd3-selection';
import { max } from 'd3-array';
import { event } from 'd3';

import hljs from 'highlight.js/lib/core';
import { highlightBlock } from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
hljs.registerLanguage('json', json);

// import { highlightBlock } from 'highlight.js';

import { BasicChart } from './component/basic-chart';
import { BasicLineSeriesConfiguration } from './component/series/svg/basic-line-series';
import { StackedVerticalBarSeriesConfiguration } from './component/series/svg/stacked-vertical-bar-series';
import { GroupedVerticalBarSeriesConfiguration } from './component/series/svg/grouped-vertical-bar-series';
import { BasicAreaSeriesConfiguration } from './component/series/svg/basic-area-series';
import { tracePoints, stepInfo } from './component/mock-data/trace-data';

import { Placement, Align, ScaleType, Direction } from './component/chart/chart-configuration';

import { BasicCanvasWebglLineSeriesOneConfiguration, BasicCanvasWebglLineSeriesOneModel } from './component/series/webgl/basic-canvas-webgl-line-series-one';
import { BasicCanvasTraceModel, BasicCanvasTraceConfiguration } from './component/series/canvas/basic-canvas-trace';

import { delayExcute } from './component/chart/util/d3-svg-util';
import { OptionConfiguration, MiccBaseConfiguration } from './component/mi-chart';
import { ChartItemEvent } from './component/chart';
import {
    CanvasTraceChart,
    SvgGroupedBarChart,
    SvgStackedBarChart,
    SvgTraceChart,
    WebglTraceChart,
    SvgAreaChart
} from './component/chart-generator';
import { sampleMockData } from './component/mock-data/simple-mock-data';


let chart: BasicChart;

const clear = () => {
    if (chart) {
        chart.clear();
    }
}

const hideLoader = () => {
    select('.back-drop').classed('show', false);
}

const showLoader = () => {
    select('.back-drop').classed('show', true);
}

const buttonMapping = () => {
    select('.container-button-bar').on('click', () => {
        const seriesId = event.target.id;
        if (seriesId) {
            showLoader();
            clear();
        }
        switch (seriesId) {
            case 'svg-line-series':
                delayExcute(200, simpleSvgLineSeriesExample);
            break;

            case 'webgl-line-series':
                delayExcute(200, simpleWebglLineSeriesExample);
            break;

            case 'webgl-bigdata-line-series':
                delayExcute(200, webGLBigDataLineSeriesSample);
            break;

            case 'canvas-line-series':
                delayExcute(200, simpleCanvasLineSeriesExample);
            break;

            case 'canvas-bigdata-line-series':
                delayExcute(200, canvasBigDataLineSeriesSample);
            break;

            case 'svg-column-series':
                delayExcute(200, simpleSvgColumnSeriesExample);
            break;

            case 'svg-stacked-column-series':
                delayExcute(200, simpleSvgStackedColumnSeriesExample);
            break;

            case 'svg-plot-series':
                delayExcute(200, simpleSvgPlotSeriesExample);
            break;

            case 'svg-area-series':
                delayExcute(200, simpleSvgAreaSeriesExample);
            break;

            default:
            break;
        }
        delayExcute(300, hideLoader);
    });
    /*
    Observable.of(true).pipe(
    delay(150),
    tap(() => {
        this.renderer.addClass(this.mainContainer, 'side-container');
    }),
    delay(300),
    tap(() => {
        this.renderer.addClass(this.sideContainer, 'open');
    })
);
    */
}

const setSeriesColor = (item: any) => {
    const seriesFaultType = item.referenceYn === 'Y' ? '' : item.segmentStatus;
    if (item.referenceYn === 'N' && item.fdtaFaultYn === 'Y' && seriesFaultType === 'F' && item.primeYn === 'N') { // selectedAlarm
        return '#EA3010';
    } else if (item.referenceYn === 'N' && item.fdtaFaultYn === 'N' && seriesFaultType === 'F' && item.primeYn === 'N') { // Fault
        return '#f57416';
    } else if (item.referenceYn === 'N' && item.fdtaFaultYn === 'N' && seriesFaultType === 'W' && item.primeYn === 'N') { // Warning
        return '#f7ba00';
    } else if (item.referenceYn === 'N' && item.fdtaFaultYn === 'N' && seriesFaultType === 'S' && item.primeYn === 'N') { // Safe
        return '#0dac09';
    } else if (item.referenceYn === 'Y' && item.fdtaFaultYn === 'Y' && seriesFaultType === '' && item.primeYn === 'N') { // referenceAlarm
        return '#970f94';
    } else if (item.referenceYn === 'Y' && item.fdtaFaultYn === 'N' && seriesFaultType === '' && item.primeYn === 'N') { // referenceNonAlarm
        return '#3766c7';
    } else if (item.referenceYn === 'Y' && item.fdtaFaultYn === 'N' && seriesFaultType === '' && item.primeYn === 'Y') { // primeReference
        return '#3766c7';
    } else {
        return '#EA3010';
    }
};

const simpleWebglLineSeriesExample = () => {
    const yFieldSeries: BasicCanvasWebglLineSeriesOneConfiguration = {
        selector: 'x-series',
        xField: 'x',
        yField: 'y',
        dot: {
            radius: 6
        },
        style: {
            strokeColor: '#4d8700',
        }
    };

    const zFieldSeries: BasicCanvasWebglLineSeriesOneConfiguration = {
        selector: 'z-series',
        xField: 'x',
        yField: 'z',
        dot: {
            radius: 6
        },
        style: {
            strokeColor: '#ff9421',
        }
    }

    const xFieldSeries: BasicCanvasWebglLineSeriesOneConfiguration = {
        selector: 'z-series',
        xField: 'x',
        yField: 'x',
        dot: {
            radius: 6
        },
        style: {
            strokeColor: '#2137ff',
        }
    }

    const seriesList = [
        yFieldSeries,
        zFieldSeries,
        xFieldSeries
    ];

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'WebGL Line Series'
        },
        tooltip: {
            tooltipTextParser: (d:any) => {
                return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`
            }
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: 'bottom',
                min: 0,
                max: 21
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: 'left',
                min: 0,
                max: 30
            }
        ],
        zoom: {
            direction: Direction.BOTH
        }
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = WebglTraceChart(commonConfiguration, seriesList).draw();
}

const simpleSvgLineSeriesExample = () => {
    const yFieldSeries: BasicLineSeriesConfiguration = {
        selector: 'y-series',
        xField: 'x',
        yField: 'y',
        line: {
            dashArray: 2
        },
        dot: {
            selector: 'basic-line-y-series-dot',
            radius: 3
        },
        displayName: 'y-series'
    };

    const zFieldSeries: BasicLineSeriesConfiguration = {
        selector: 'z-series',
        xField: 'x',
        yField: 'z',
        line: {},
        dot: {
            selector: 'basic-line-z-series-dot',
            radius: 3
        },
        displayName: 'z-series'
    }

    const xFieldSeries: BasicLineSeriesConfiguration = {
        selector: 'x-series',
        xField: 'x',
        yField: 'x',
        line: {},
        dot: {
            radius: 3,
            selector: 'basic-line-x-series-dot'
        },
        // style: {
        //     strokeWidth: 5,
        //     strokeColor: '#ccc'
        // },
        displayName: 'x-series'
    }

    const seriesList = [
        yFieldSeries,
        zFieldSeries,
        xFieldSeries
    ];

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        tooltip: {
            tooltipTextParser: (d:any) => {
                return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`
            }
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'SVG Line Series'
        },
        legend: {
            placement: Placement.TOP
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: 'bottom',
                min: 0,
                max: 21,
                gridLine: {
                    color: '#ddd'
                }
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: 'left',
                min: 0,
                max: 30,
                gridLine: {
                    color: '#ddd'
                }
            }
        ],
        zoom: {
            direction: Direction.BOTH
        },
        mouseGuideLine:{}
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = SvgTraceChart(commonConfiguration, seriesList).draw();
    chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
        if (item.type === 'click') {
            alert('click =>' + JSON.stringify(item.data));
        }
    });
}

const simpleSvgColumnSeriesExample = () => {
    const columns = ['x', 'y', 'z'];

    const groupedVerticalColumnSeriesConfiguration: GroupedVerticalBarSeriesConfiguration = {
        xField: 'x',
        displayNames: columns,
        columns
    };

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'SVG Column Series'
        },
        legend: {
            placement: Placement.TOP
        },
        tooltip: {
            tooltipTextParser: (d: any) => {
                const item: any = d[2];
                const key = d[4];
                return `${key}: ${item[key]}`
            }
        },
        isResize: true,
        axes: [
            {
                type: ScaleType.STRING,
                placement: 'bottom',
                field: 'x',
                padding: 0.2
            },
            {
                field: 'total',
                type: ScaleType.NUMBER,
                placement: 'left',
                tickFormat: 's',
                isRound: true,
                min: 0, // 여러개의 field를 참조해야할 경우에는 min, max를 지정해야 정상작동을 한다.
                max: 50,
            }
        ]
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = SvgGroupedBarChart(commonConfiguration, groupedVerticalColumnSeriesConfiguration).draw();
}

const simpleSvgStackedColumnSeriesExample = () => {
    const stackedVerticalColumnSeries: StackedVerticalBarSeriesConfiguration = {
        xField: 'x',
        yField: 'total',
        columns: ['x', 'y', 'z'],
        displayNames: ['xField', 'yField', 'zField']
    };

    const commonConfiguration = {
        selector: '#chart-div',
        data: sampleMockData(20),
        isResize: true,
        legend: {
            placement: Placement.TOP
        },
        tooltip: {
            tooltipTextParser: (d: any) => {
                const item: any = d[2];
                const key = d[4];
                return `${key}: ${item[key]}`
            }
        },
        axes: [
            {
                field: 'x',
                type: ScaleType.STRING,
                placement: Placement.BOTTOM,
                padding: 0.2,
                title: {
                    align: Align.CENTER,
                    content: 'x field'
                }
            },
            {
                field: 'total',
                type: ScaleType.NUMBER,
                placement: Placement.LEFT,
                isRound: true,
                tickFormat: ',d',
                min: 0,
                max: max(sampleMockData(20), (d: any) => d.total),
                title: {
                    align: Align.CENTER,
                    content: 'y field'
                }
            }
        ]
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = SvgStackedBarChart(commonConfiguration, stackedVerticalColumnSeries).draw();
    chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
        console.log('selected item : ', item);
    })
}

const simpleCanvasLineSeriesExample = () => {
    const yFieldSeries: BasicCanvasTraceConfiguration = {
        selector: 'y-series',
        xField: 'x',
        yField: 'y',
        line: {},
        dot: {
            radius: 3
        },
        displayName: 'y-series'
    };

    const zFieldSeries: BasicCanvasTraceConfiguration = {
        selector: 'z-series',
        xField: 'x',
        yField: 'z',
        line: {},
        dot: {
            radius: 3
        },
        displayName: 'z-series'
    }

    const xFieldSeries: BasicCanvasTraceConfiguration = {
        selector: 'x-series',
        xField: 'x',
        yField: 'x',
        line: {
            dashArray: 2
        },
        dot: {
            radius: 3
        },
        displayName: 'x-series'
    }

    const seriesList = [
        yFieldSeries,
        zFieldSeries,
        xFieldSeries
    ];

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        style: {
            backgroundColor: '#fff'
        },
        tooltip: {
            tooltipTextParser: (d:any) => {
                return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`
            }
        },
        legend: {
            placement: Placement.TOP
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'Canvas Line Series'
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: 'bottom',
                min: 0,
                max: 21,
                gridLine: {
                    dasharray: 2,
                }
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: 'left',
                min: 0,
                max: 30,
                gridLine: {
                    dasharray: 2,
                }
            }
        ],
        zoom: {
            direction: Direction.BOTH
        }
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = CanvasTraceChart(commonConfiguration, seriesList).draw();
}

const simpleSvgPlotSeriesExample = () => {
    const yFieldSeries: BasicLineSeriesConfiguration = {
        selector: 'y-series',
        xField: 'x',
        yField: 'y',
        dot: {
            radius: 3,
            selector: 'basic-line-y-series-dot'
        },
        displayName: 'y-series'
    };

    const zFieldSeries: BasicLineSeriesConfiguration = {
        selector: 'z-series',
        xField: 'x',
        yField: 'z',
        dot: {
            radius: 3,
            selector: 'basic-line-z-series-dot'
        },
        displayName: 'z-series'
    }

    const xFieldSeries: BasicLineSeriesConfiguration = {
        selector: 'x-series',
        xField: 'x',
        yField: 'x',
        dot: {
            radius: 3,
            selector: 'basic-line-x-series-dot'
        },
        displayName: 'x-series'
    }

    const seriesList = [
        yFieldSeries,
        zFieldSeries,
        xFieldSeries
    ];

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        tooltip: {
            tooltipTextParser: (d:any) => {
                return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`
            }
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'SVG Plot Series'
        },
        legend: {
            placement: Placement.TOP
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: 'bottom',
                min: 0,
                max: 21,
                gridLine: {
                    dasharray: 2
                }
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: 'left',
                min: -5,
                max: 30,
                gridLine: {
                    dasharray: 2
                }
            }
        ],
        zoom: {
            direction: Direction.BOTH
        }
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = SvgTraceChart(commonConfiguration, seriesList).draw();
    chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
        if (item.type === 'click') {
            alert('click =>' + JSON.stringify(item.data));
        }
    });
}

const simpleSvgAreaSeriesExample = () => {
    const yFieldSeries: BasicAreaSeriesConfiguration = {
        selector: 'y-series',
        xField: 'x',
        yField: 'y',
        displayName: 'y-series',
    };

    const zFieldSeries: BasicAreaSeriesConfiguration = {
        selector: 'z-series',
        xField: 'x',
        yField: 'z',
        displayName: 'z-series'
    }

    const xFieldSeries: BasicAreaSeriesConfiguration = {
        selector: 'x-series',
        xField: 'x',
        yField: 'x',
        displayName: 'x-series'
    }

    const seriesList = [
        yFieldSeries,
        zFieldSeries,
        xFieldSeries
    ];

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        tooltip: {
            tooltipTextParser: (d:any) => {
                return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`
            }
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'SVG Area Series'
        },
        legend: {
            placement: Placement.TOP
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: 'bottom',
                min: 1,
                max: 20,
                gridLine: {
                    color: '#ccc'
                },
                tickFormat: ',.1f'
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: 'left',
                min: 0,
                max: 30,
                gridLine: {
                    color: '#ccc'
                }
            }
        ],
        zoom: {
            direction: Direction.BOTH
        }
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = SvgAreaChart(commonConfiguration, seriesList).draw();
    chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
        if (item.type === 'click') {
            alert('click =>' + JSON.stringify(item.data));
        }
    });
}

const webGLBigDataLineSeriesSample = () => {
    const stepData = stepInfo.map((step: any) => {
        return {
            start: step.startCountSlot,
            end: step.startCountSlot + step.maxCount,
            label: step.step,
            data: step
        };
    });

    const seriesList = [];

    const alarmSeriesList = [];

    const optionList = [];

    let xmin = 0;
    let xmax = 0;
    let ymin = Infinity;
    let ymax = 0;

    const parseData = () => {
        seriesList.length = 0;
        alarmSeriesList.length = 0;
        optionList.length = 0;

        xmin = 0;
        xmax = 0;
        ymin = Infinity;
        ymax = 0;

        for (let i = 0; i < tracePoints.length; i++) {
            const tempData = tracePoints[i];
            const seriesData = tempData.data.rows.map((row: any[]) => {
                const rowData: any = {};
                for (let j = 0; j < tempData.data.columns.length; j++) {
                    const columnName = tempData.data.columns[j];
                    rowData[columnName] = row[j];
                }
                const x = rowData['count_slot'];
                const y = rowData['VALUE'];
                if (xmin > x) {
                    xmin = x;
                }
                if (xmax < x) {
                    xmax = x;
                }
                if (ymin > y) {
                    ymin = y;
                }
                if (ymax < y) {
                    ymax = y;
                }

                return new BasicCanvasWebglLineSeriesOneModel(
                    x,
                    y,
                    i,
                    rowData
                );
            });
            // test data 늘리기
            const tempRow: BasicCanvasWebglLineSeriesOneModel = seriesData[seriesData.length - 1];
            for (let index = 1; index < 50000; index++) {
                const x = tempRow.x + index;
                const y = tempRow.y;
                if (xmax < x) {
                    xmax = x;
                }
                seriesData.push(
                    new BasicCanvasWebglLineSeriesOneModel(x, y, i, tempRow)
                );
            }
            // type별 컬러 지정.
            const seriesColor = setSeriesColor(tempData);
            const configuration: BasicCanvasWebglLineSeriesOneConfiguration = {
                type: 'series',
                selector: (seriesColor === '#EA3010' ? 'webgl-trace-alarm' : 'webgl-trace')  + i,
                xField: 'x',
                yField: 'y',
                dot: {
                    radius: 4
                },
                style: {
                    strokeColor: seriesColor,
                    // opacity: seriesColor === '#EA3010' ? 1 :  0.9
                },
                data: seriesData
            }

            if (seriesColor === '#EA3010') {
                alarmSeriesList.push(configuration);
            } else {
                seriesList.push(configuration);
            }
        }
    }

    parseData();

    const basicSpecArea: OptionConfiguration = {
        name: 'BasicSpecArea',
        configuration: {
            selector: 'spec-area',
            startField: 'start',
            endField: 'end',
            data: [stepData[2]]
        }
    };

    const basicStepLine: OptionConfiguration = {
        name: 'BasicStepLine',
        configuration: {
            selector: 'step-line',
            xField: 'start',
            data: stepData
        }
    };

    const basicStepArea: OptionConfiguration = {
        name: 'BasicStepArea',
        configuration: {
            startField: 'start',
            labelField: 'label',
            endField: 'end',
            data: stepData
        }
    };

    optionList.push(basicSpecArea);
    optionList.push(basicStepArea);
    optionList.push(basicStepLine);

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        data: [],
        title: {
            placement: Placement.TOP,
            content: 'WebGL Big Data Line Chart'
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: Placement.BOTTOM,
                min: xmin - (xmax * 0.01),
                max: xmax + (xmax * 0.01)
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: Placement.LEFT,
                min: ymin,
                max: ymax
            }
        ],
        zoom: {
            xDirection: Placement.BOTTOM,
            yDirection: Placement.LEFT,
            direction: Direction.BOTH
        }
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = WebglTraceChart(commonConfiguration, seriesList.concat(alarmSeriesList), optionList).draw();
}

const canvasBigDataLineSeriesSample = () => {

    const stepData = stepInfo.map((step: any) => {
        return {
            start: step.startCountSlot,
            end: step.startCountSlot + step.maxCount,
            label: step.step,
            data: step
        };
    });

    const seriesList = [];

    const alarmSeriesList = [];

    const optionList = [];

    let xmin = 0;
    let xmax = 0;
    let ymin = Infinity;
    let ymax = 0;

    const parseData = () => {
        seriesList.length = 0;
        alarmSeriesList.length = 0;
        optionList.length = 0;

        const basicSpecArea: OptionConfiguration = {
            name: 'BasicSpecArea',
            configuration: {
                selector: 'spec-area',
                startField: 'start',
                endField: 'end',
                data: [stepData[2]]
            }
        };

        const basicStepLine: OptionConfiguration = {
            name: 'BasicStepLine',
            configuration: {
                selector: 'step-line',
                xField: 'start',
                data: stepData
            }
        };

        const basicStepArea: OptionConfiguration = {
            name: 'BasicStepArea',
            configuration: {
                startField: 'start',
                labelField: 'label',
                endField: 'end',
                data: stepData
            }
        };

        optionList.push(basicSpecArea);
        optionList.push(basicStepArea);
        optionList.push(basicStepLine);

        xmin = 0;
        xmax = 0;
        ymin = Infinity;
        ymax = 0;

        for (let i = 0; i < tracePoints.length; i++) {
            const tempData = tracePoints[i];
            const seriesData = tempData.data.rows.map((row: any[]) => {
                const rowData: any = {};
                for (let j = 0; j < tempData.data.columns.length; j++) {
                    const columnName = tempData.data.columns[j];
                    rowData[columnName] = row[j];
                }

                const x = rowData['count_slot'];
                const y = rowData['VALUE'];

                if (xmin > x) {
                    xmin = x;
                }
                if (xmax < x) {
                    xmax = x;
                }
                if (ymin > y) {
                    ymin = y;
                }
                if (ymax < y) {
                    ymax = y;
                }

                return new BasicCanvasTraceModel(
                    x,
                    y,
                    i,
                    rowData
                );
            });

            // test data 늘리기
            const tempRow: BasicCanvasTraceModel = seriesData[seriesData.length - 1];
            for (let index = 1; index < 50000; index++) {
                const x = tempRow.x + index;
                const y = tempRow.y;

                if (xmax < x) {
                    xmax = x;
                }

                seriesData.push(new BasicCanvasTraceModel(
                    x,
                    y,
                    i,
                    tempRow
                ));
            }

            // type별 컬러 지정.
            const seriesColor = setSeriesColor(tempData);
            const configuration: BasicCanvasTraceConfiguration = {
                type: 'series',
                selector: (seriesColor === '#EA3010' ? 'canvas-trace-alarm' : 'canvas-trace')  + i,
                xField: 'x',
                yField: 'y',
                dot: {
                    radius: 4
                },
                line: {
                    strokeColor: seriesColor,
                    // opacity: seriesColor === '#EA3010' ? 1 :  0.9
                },
                data: seriesData
            }

            if (seriesColor === '#EA3010') {
                alarmSeriesList.push(configuration);
                // alarmSeriesList.push(new BasicCanvasTrace(configuration));
            } else {
                seriesList.push(configuration);
                // seriesList.push(new BasicCanvasTrace(configuration));
            }
        }
    }

    parseData();

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        data: [],
        title: {
            placement: Placement.TOP,
            content: 'Canvas BigData Line Series'
        },
        tooltip: {
            tooltipTextParser: (d: any) => {
                return 'd : ' + d;
            }
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: 'bottom',
                min: xmin - (xmax * 0.01),
                max: xmax + (xmax * 0.01)
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: 'left',
                min: ymin,
                max: ymax
            }
        ],
        zoom: {
            xDirection: 'bottom',
            yDirection: 'left',
            direction: Direction.BOTH
        }
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    console.time('canvaslinedraw');
    chart = CanvasTraceChart(commonConfiguration, seriesList.concat(alarmSeriesList), optionList).draw();
    console.timeEnd('canvaslinedraw');
};

delayExcute(200, () => {
    buttonMapping();
});