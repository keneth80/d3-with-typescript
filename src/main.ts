import './style.css';
import '@babel/polyfill';

import { BaseType, select, Selection } from 'd3-selection';
import { max } from 'd3-array';
import { event } from 'd3';

import { delay, tap } from 'rxjs/operators';
import { Observable, Observer, Subscription } from 'rxjs';

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
import { ChartItemEvent, colorTooltipTemplate, SeriesType, TooltipEvent } from './component/chart';
import {
    CanvasTraceChart,
    SvgGroupedBarChart,
    SvgStackedBarChart,
    SvgTraceChart,
    WebglTraceChart,
    SvgAreaChart,
    SvgMultiSeriesChart,
    SvgTopology
} from './component/chart-generator';
import { sampleMockData, sampleMockTimeData } from './component/mock-data/simple-mock-data';
import { centerPositionForTooltipElement } from './component/chart/util/tooltip-util';
import { topologyData } from './component/mock-data/topology-data';
import { TopologyGroupElement, TopologyData } from './component/series';


let chart: BasicChart;
let currentSubscription: Subscription;
let otherElement: Selection<BaseType, any, BaseType, any>;

const clear = () => {
    if (chart) {
        chart.clear();
    }

    if (currentSubscription) {
        currentSubscription.unsubscribe();
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

        new Observable((observ: Observer<any>) => {
            observ.next(true);
            observ.complete();
        })
        .pipe(
            tap(() => {
                if (seriesId) {
                    showLoader();
                    clear();
                }
            }),
            delay(200),
            tap(() => {
                switch (seriesId) {
                    case 'svg-line-series':
                        simpleSvgLineSeriesExample();
                    break;
                    case 'webgl-line-series':
                        simpleWebglLineSeriesExample();
                    break;
                    case 'webgl-bigdata-line-series':
                        webGLBigDataLineSeriesSample();
                    break;
                    case 'canvas-line-series':
                        simpleCanvasLineSeriesExample();
                    break;
                    case 'canvas-bigdata-line-series':
                        canvasBigDataLineSeriesSample();
                    break;
                    case 'svg-column-series':
                        simpleSvgColumnSeriesExample();
                    break;
                    case 'svg-stacked-column-series':
                        simpleSvgStackedColumnSeriesExample();
                    break;
                    case 'svg-plot-series':
                        simpleSvgPlotSeriesExample();
                    break;
                    case 'svg-area-series':
                        simpleSvgAreaSeriesExample();
                    break;
                    case 'axis-custom-margin':
                        axisCustomMargin();
                    break;
                    case 'svg-multi-series':
                        svgMultiSeriesExample();
                    break;
                    case 'update-series':
                        updateSeriesExample();
                    break;
                    case 'update-data':
                        updateDataExample();
                    break;
                    case 'tooltip-templete-change':
                        changeTooltipTemplete();
                    break;
                    case 'tooltip-custom-templete':
                        customTooltipTemplete();
                    break;
                    case 'svg-topology':
                        topologyExample();
                    break;
                    case 'real-time-series':
                        realTimeLineSeriesSample();
                    break;
                    default:
                    break;
                }
            }),
            delay(300),
            tap(() => {
                hideLoader();
            })
        )
        .subscribe(() => {
            console.log('exec => ', seriesId);
        });
    });
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

const topologyExample = () => {
    const groups = topologyData.result.frameworks.map((item: any) => {
        const currentData = {
            rawID: item.rawID,
            frameworkID: item.frameworkID,
            frameworkSetID: item.frameworkSetID,
            status: item.status,
            previousStatus: item.previousStatus,
            updateDateTime: item.updateDateTime,
            fullName: item.fullName
        };
        return new TopologyGroupElement(item.fullName, 0, 0, 50, 50, 5, 5, currentData, item.members);
    })
    // .filter((item: TopologyGroupElement, index: number) => index === 0);

    const machines = topologyData.result.machines.map((item: any) => {
        return new TopologyGroupElement(item.fullName, 0, 0, 50, 50, 5, 5, item, []);
    });

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        data: [
            new TopologyData(groups, machines)
        ],
        margin: {
            top: 5,
            left: 10,
            right: 10,
            bottom: 5
        },
        isResize: true,
        axes: []
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = SvgTopology(commonConfiguration).draw();
}

const customTooltipTemplete = () => {
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
            tooltipTextParser: (d: any) => {
                return `x: ${d[2].data.x} \ny: ${d[2].data.y}\nz: ${d[2].data.z}`
            },
            visible: false
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'Dynamic Series'
        },
        legend: {
            placement: Placement.TOP
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: Placement.BOTTOM,
                min: 0,
                max: 21,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
                }
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: Placement.LEFT,
                min: -5,
                max: 30,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
                }
            }
        ],
        zoom: {
            direction: Direction.BOTH,
            delayTime: 20
        }
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = SvgTraceChart(commonConfiguration, seriesList).draw();
    // custom tooltip templete select
    otherElement = select('#chart-div').select('.chart-tip');
    currentSubscription = chart.tooltipEvent$.subscribe((tooltipEvent: TooltipEvent) => {
        if (tooltipEvent.type === 'show') {
            otherElement
                .select('strong')
                .text('Data');
            otherElement
                .select('span')
                .text(`${tooltipEvent.data[2].displayName}: ${tooltipEvent.data[2].data[tooltipEvent.data[2].field]}`);
            centerPositionForTooltipElement(chart, otherElement.node(), tooltipEvent.position);
        } else {
            otherElement.style('pointer-events', 'none');
            otherElement.style('opacity', 0);
        }
    });
}

const changeTooltipTemplete = () => {
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
            tooltipTextParser: (d: any) => {
                return `x: ${d[2].data.x} \ny: ${d[2].data.y}\nz: ${d[2].data.z}`
            }
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'Dynamic Series'
        },
        legend: {
            placement: Placement.TOP
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.STRING,
                placement: Placement.BOTTOM,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
                }
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: Placement.LEFT,
                min: -5,
                max: 30,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
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

    chart = SvgTraceChart(commonConfiguration, seriesList);
    chart.toolTipTemplete = colorTooltipTemplate;
    chart.draw();
}

const updateSeriesExample = () => {
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
            tooltipTextParser: (d: any) => {
                return `x: ${d[2].x} \ny: ${d[2].y}\nz: ${d[2].z}`
            }
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'Dynamic Series'
        },
        legend: {
            placement: Placement.TOP
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.STRING,
                placement: Placement.BOTTOM,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
                }
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: Placement.LEFT,
                min: -5,
                max: 30,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
                }
            }
        ],
        mouseGuideLine:{}
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = SvgTraceChart(commonConfiguration, seriesList).draw();

    new Observable((observ: Observer<boolean>) => {
        observ.next(true);
        observ.complete();
    })
    .pipe(
        delay(3000),
        tap(() => {
            const yFieldPlotSeries: BasicLineSeriesConfiguration = {
                type: SeriesType.SVG_LINE,
                selector: 'y-series',
                xField: 'x',
                yField: 'y',
                dot: {
                    selector: 'basic-line-y-series-dot',
                    radius: 3
                },
                displayName: 'y-series'
            };

            const zFieldPlotSeries: BasicLineSeriesConfiguration = {
                type: SeriesType.SVG_LINE,
                selector: 'z-series',
                xField: 'x',
                yField: 'z',
                dot: {
                    selector: 'basic-line-z-series-dot',
                    radius: 3
                },
                displayName: 'z-series'
            }

            const xFieldPlotSeries: BasicLineSeriesConfiguration = {
                type: SeriesType.SVG_LINE,
                selector: 'x-series',
                xField: 'x',
                yField: 'x',
                dot: {
                    radius: 3,
                    selector: 'basic-line-x-series-dot'
                },
                displayName: 'x-series'
            }

            chart.series([
                yFieldPlotSeries,
                // zFieldPlotSeries,
                xFieldPlotSeries
            ]);
        }),
        delay(3000),
        tap(() => {
            const yFieldAreaSeries: BasicAreaSeriesConfiguration = {
                type: SeriesType.SVG_AREA,
                selector: 'y-series',
                xField: 'x',
                yField: 'y',
                displayName: 'y-series',
            };

            const zFieldAreaSeries: BasicAreaSeriesConfiguration = {
                type: SeriesType.SVG_AREA,
                selector: 'z-series',
                xField: 'x',
                yField: 'z',
                displayName: 'z-series'
            };

            const xFieldAreaSeries: BasicAreaSeriesConfiguration = {
                type: SeriesType.SVG_AREA,
                selector: 'x-series',
                xField: 'x',
                yField: 'x',
                displayName: 'x-series'
            };

            chart.series([
                yFieldAreaSeries,
                zFieldAreaSeries,
                xFieldAreaSeries
            ]);
        })
    )
    .subscribe(() => {
        console.log('display complete!');
        chart.title('Update Title');
    });
}

const updateDataExample = () => {
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
        displayName: 'y-series',
        animation: true
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
        displayName: 'z-series',
        animation: true
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
        displayName: 'x-series',
        animation: true
    }

    const seriesList = [
        yFieldSeries,
        zFieldSeries,
        xFieldSeries
    ];

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        tooltip: {
            tooltipTextParser: (d: any) => {
                return `x: ${d[2].x} \ny: ${d[2].y}\nz: ${d[2].z}`
            }
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'Dynamic Data'
        },
        legend: {
            placement: Placement.TOP
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: Placement.BOTTOM,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
                }
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: Placement.LEFT,
                min: -5,
                max: 30,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
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

    new Observable((observ: Observer<boolean>) => {
        observ.next(true);
        observ.complete();
    })
    .pipe(
        delay(3000),
        tap(() => {
            chart.data(sampleMockData(20));
        }),
        delay(3000),
        tap(() => {
            chart.data(sampleMockData(20));
        })
    )
    .subscribe(() => {
        chart.data(sampleMockData(20));
        chart.toolTipTemplete = colorTooltipTemplate;
        console.log('update complete!');
    });
}

const simpleWebglLineSeriesExample = () => {
    const yFieldSeries: BasicCanvasWebglLineSeriesOneConfiguration = {
        selector: 'x-series',
        xField: 'x',
        yField: 'y',
        dot: {
            radius: 6
        },
        line: {
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
        line: {
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
        line: {
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
            tooltipTextParser: (d: any) => {
                return `x: ${d[2].x} \ny: ${d[2].y}\nz: ${d[2].z}`
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
            tooltipTextParser: (d: any) => {
                const currentItem = d[2];
                const currentData = currentItem.data;
                return `${currentItem.displayName} \nx: ${currentData['x']}\nvalue: ${currentData[currentItem.field]}`
            }
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'SVG Line Series'
        },
        legend: {
            placement: Placement.TOP,
            align: Align.RIGHT
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.NUMBER,
                placement: Placement.BOTTOM,
                min: -1,
                max: 21,
                tickFormat: 's',
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
                }
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: Placement.LEFT,
                min: -5,
                max: 30,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
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
    currentSubscription = chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
        console.log(item.type, ' => ' + JSON.stringify(item.data));
        // if (item.type === 'click') {
        //     console.log('click => ' + JSON.stringify(item.data));
        // }
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
        data: sampleMockData(40),
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
                const key = d[7];
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
        // colors: ['#ff0000', '#ff00ff', '#0000ff'],
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
                const key = d[7];
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
    currentSubscription = chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
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
            tooltipTextParser: (d: any) => {
                const currentItem = d[2];
                const currentData = currentItem.data;
                return `${currentItem.displayName} \nx: ${currentData['x']}\nvalue: ${currentData[currentItem.field]}`
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
                min: -5,
                max: 30,
                gridLine: {
                    dasharray: 2,
                },
                zeroLine: {
                    color: '#000'
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
            tooltipTextParser: (d: any) => {
                const currentItem = d[2];
                const currentData = currentItem.data;
                return `${currentItem.displayName} \nx: ${currentData['x']}\nvalue: ${currentData[currentItem.field]}`
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
    currentSubscription = chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
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
            tooltipTextParser: (d: any) => {
                return `x: ${d[2].x} \ny: ${d[2].y}\nz: ${d[2].z}`
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
    currentSubscription = chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
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
            // const tempRow: BasicCanvasWebglLineSeriesOneModel = seriesData[seriesData.length - 1];
            // for (let index = 1; index < 50000; index++) {
            //     const x = tempRow.x + index;
            //     const y = tempRow.y;
            //     if (xmax < x) {
            //         xmax = x;
            //     }
            //     seriesData.push(
            //         new BasicCanvasWebglLineSeriesOneModel(x, y, i, tempRow)
            //     );
            // }
            // type별 컬러 지정.
            const seriesColor = setSeriesColor(tempData);
            const configuration: BasicCanvasWebglLineSeriesOneConfiguration = {
                selector: (seriesColor === '#EA3010' ? 'webgl-trace-alarm' : 'webgl-trace')  + i,
                xField: 'x',
                yField: 'y',
                dot: {
                    radius: 4,
                    fill: seriesColor
                },
                line: {
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
            data: [stepData[2]],
            placement: Placement.BOTTOM
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
        tooltip: {
            tooltipTextParser: (d: BasicCanvasWebglLineSeriesOneModel) => {
                return `x: ${d[2].x} \ny: ${d[2].y}\ni: ${d[2].i}`
            }
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

const realTimeLineSeriesSample = () => {
    const yFieldSeries: BasicLineSeriesConfiguration = {
        selector: 'y-series',
        xField: 'date',
        yField: 'y',
        line: {
            dashArray: 2
        },
        displayName: 'y-series'
    };

    const zFieldSeries: BasicLineSeriesConfiguration = {
        selector: 'z-series',
        xField: 'date',
        yField: 'z',
        line: {},
        displayName: 'z-series'
    }

    const seriesList = [
        yFieldSeries,
        zFieldSeries
    ];

    const data = sampleMockTimeData(100);

    console.log('data : ', data);

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        tooltip: {
            tooltipTextParser: (d: any) => {
                const currentItem = d[2];
                const currentData = currentItem.data;
                return `${currentItem.displayName} \nx: ${currentData['x']}\nvalue: ${currentData[currentItem.field]}`
            }
        },
        data,
        title: {
            placement: Placement.TOP,
            content: 'Real Time SVG Line Series'
        },
        legend: {
            placement: Placement.TOP,
            align: Align.RIGHT
        },
        isResize: true,
        axes: [
            {
                field: 'date',
                type: ScaleType.TIME,
                placement: Placement.BOTTOM,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
                },
                tickSize: 4
            },
            {
                field: 'y',
                type: ScaleType.NUMBER,
                placement: Placement.LEFT,
                min: 0,
                max: 100,
                gridLine: {
                    color: '#ddd'
                },
                zeroLine: {
                    color: '#0000ff'
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
    chart.realTime(true, 100, 2000);
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
                data: [stepData[2]],
                placement: Placement.BOTTOM
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
                selector: (seriesColor === '#EA3010' ? 'canvas-trace-alarm' : 'canvas-trace')  + i,
                xField: 'x',
                yField: 'y',
                // dot: {
                //     radius: 2,
                //     fill: seriesColor
                // },
                line: {
                    strokeColor: seriesColor,
                    strokeWidth: 0.5
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
        legend: {
            placement: Placement.TOP,
            align: Align.CENTER
        },
        title: {
            placement: Placement.TOP,
            content: 'Canvas BigData Line Series'
        },
        tooltip: {
            tooltipTextParser: (d: any) => {
                const currentItem = d[2];
                const currentData = currentItem.data;
                return `${currentItem.displayName} \nx: ${currentData['x']}\nvalue: ${currentData[currentItem.field]}`
            },
            isMultiple: true
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

    
    chart = CanvasTraceChart(commonConfiguration, seriesList.concat(alarmSeriesList), optionList);
    currentSubscription = chart.lifecycle$.subscribe((event: {type: string}) => {
        if (event.type === 'initialize') {
            console.time('canvaslinedraw');
        } else {
            console.timeEnd('canvaslinedraw');
        }
    });
    chart.draw();
};

const svgMultiSeriesExample = () => {
    const yFieldSeries: BasicLineSeriesConfiguration = {
        type: SeriesType.SVG_LINE,
        selector: 'y-series',
        xField: 'x',
        yField: 'y',
        line: {},
        dot: {
            radius: 3,
            selector: 'basic-line-y-series-dot'
        },
        displayName: 'y-series'
    };

    const zFieldSeries: BasicLineSeriesConfiguration = {
        type: SeriesType.SVG_LINE,
        selector: 'z-series',
        xField: 'x',
        yField: 'z',
        line: {},
        dot: {
            radius: 3,
            selector: 'basic-line-z-series-dot'
        },
        displayName: 'z-series'
    }

    const xFieldSeries: BasicLineSeriesConfiguration = {
        type: SeriesType.SVG_LINE,
        selector: 'x-series',
        xField: 'x',
        yField: 'x',
        line: {},
        dot: {
            radius: 3,
            selector: 'basic-line-x-series-dot'
        },
        displayName: 'x-series'
    }

    const columns = ['z'];

    const groupedVerticalColumnSeriesConfiguration: GroupedVerticalBarSeriesConfiguration = {
        type: SeriesType.SVG_VERTICAL_BAR,
        xField: 'x',
        displayNames: columns,
        columns
    };

    const seriesList = [
        groupedVerticalColumnSeriesConfiguration,
        yFieldSeries,
        // zFieldSeries,
        xFieldSeries
    ];

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        tooltip: {
            tooltipTextParser: (d: any) => {
                return `x: ${d[2].x} \ny: ${d[2].y}\nz: ${d[2].z}`
            }
        },
        data: sampleMockData(20),
        title: {
            placement: Placement.TOP,
            content: 'SVG Multi Series'
        },
        legend: {
            placement: Placement.TOP
        },
        isResize: true,
        axes: [
            {
                field: 'x',
                type: ScaleType.STRING,
                placement: Placement.BOTTOM,
                padding: 0.2,
                gridLine: {
                    dasharray: 2
                },
                zeroLine : {
                    color: '#0000ff'
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
                },
                zeroLine : {
                    color: '#0000ff'
                }
            }
        ]
    };

    (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');
    highlightBlock((select('#json-configuration').node() as any));

    chart = SvgMultiSeriesChart(commonConfiguration, seriesList).draw();
    currentSubscription = chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
        if (item.type === 'click') {
            console.log('click =>' + JSON.stringify(item.data));
        }
    });
}

const axisCustomMargin = () => {
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
                data: [stepData[2]],
                placement: Placement.BOTTOM
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

            // type별 컬러 지정.
            const seriesColor = setSeriesColor(tempData);
            const configuration: BasicCanvasTraceConfiguration = {
                selector: (seriesColor === '#EA3010' ? 'canvas-trace-alarm' : 'canvas-trace')  + i,
                xField: 'x',
                yField: 'y',
                dot: {
                    radius: 2,
                    fill: seriesColor
                },
                line: {
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

    const commonConfiguration: MiccBaseConfiguration = {
        selector: '#chart-div',
        data: [],
        title: {
            placement: Placement.TOP,
            content: 'Axis Custom Margin'
        },
        margin: {
            left: 60,
            right: 50
        },
        tooltip: {
            tooltipTextParser: (d: any) => {
                return `x: ${d[2].x} \ny: ${d[2].y}\nz: ${d[2].i}`
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
                max: ymax,
                title: {
                    content: 'y field',
                    align: Align.CENTER
                }
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

    chart = CanvasTraceChart(commonConfiguration, seriesList.concat(alarmSeriesList), optionList).draw();
}

delayExcute(200, () => {
    buttonMapping();
});