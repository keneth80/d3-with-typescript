// import './style.css';
// import '@babel/polyfill';
// import {select, max, randomNormal, timeFormat, timeParse, randomUniform, scaleOrdinal, schemeCategory10, min, quantile, mean, csv, range} from 'd3';
// import {Observable, Observer} from 'rxjs';
// import {tap, delay} from 'rxjs/operators';
// import {SvgGroupedBarChart, SvgStackedBarChart} from './bar';
// import {Placement, ScaleType, Direction, ChartItemEvent, Align, Shape} from './component/chart';
// import {delayExcute} from './component/chart/util';
// import {BasicCanvasMouseZoomHandler} from './component/functions';
// import {bollingerData} from './component/mock-data/bollinger-band-data';
// import {lineData} from './component/mock-data/line-one-field-data';
// import {sampleMockData} from './component/mock-data/simple-mock-data';
// import {topologyData} from './component/mock-data/topology-data';
// import {stepInfo, tracePoints} from './component/mock-data/trace-data';
// import {BaseConfiguration, OptionConfiguration, PlayChart} from './component/play-chart';
// import {
//     BasicCanvasWebglLineSeriesOneConfiguration,
//     BasicLineSeriesConfiguration,
//     GroupedVerticalBarSeriesConfiguration,
//     StackedVerticalBarSeriesConfiguration,
//     BasicCanvasTraceConfiguration,
//     BasicAreaSeriesConfiguration,
//     BasicCanvasWebglLineSeriesOneModel,
//     BasicCanvasTraceModel,
//     BasicCanvasTrace,
//     BasicCanvasScatterPlotModel,
//     BasicCanvasScatterPlot,
//     BasicCanvasLineSeries,
//     BasicLineSeries,
//     TopologyGroupElement,
//     BasicTopology,
//     TopologyData,
//     StackedVerticalBarSeries,
//     GroupedVerticalBarSeries,
//     BasicAreaSeries
// } from './component/series';
// import {BasicBollingerBandSeries} from './component/series/svg/basic-bollinger-band-series';
// import {BoxplotModel, BasicBoxplotSeries} from './component/series/svg/basic-boxplot-series';
// import {BasicDonutSeries} from './component/series/svg/basic-donut-series';
// import {BasicGaugeSeries} from './component/series/svg/basic-gauge-series';
// import {BasicPieSeries} from './component/series/svg/basic-pie-series';
// import {BasicViolinSeries} from './component/series/svg/basic-violin-series';
// import {WebglTraceChart, SvgTraceChart, CanvasTraceChart, SvgAreaChart} from './line';

// class SalesModel {
//     salesperson: string;
//     sales: number;
//     assets: number;
//     date?: Date;
//     dateStr?: string;

//     constructor(salesperson: string, sales: number, assets: number, dateStr?: string, date?: Date) {
//         Object.assign(this, {
//             salesperson,
//             sales,
//             assets,
//             dateStr,
//             date
//         });
//     }

//     static clone({salesperson, sales, assets, dateStr, date}): SalesModel {
//         return new SalesModel(salesperson, sales, assets, dateStr, date);
//     }
// }

// const data: SalesModel[] = [
//     new SalesModel('Bob', 33, 180, '1-May-12'),
//     new SalesModel('Robin', 12, 140, '29-Apr-12'),
//     new SalesModel('Anne', 41, null, '27-Apr-12'),
//     new SalesModel('Mark', 16, 150, '26-Apr-12'),
//     new SalesModel('Joe', 59, 195, '25-Apr-12'),
//     new SalesModel('Eve', 38, 160, '20-Apr-12'),
//     new SalesModel('Karen', 21, 155, '19-Apr-12'),
//     new SalesModel('Kirsty', 25, 37, '18-Apr-12'),
//     new SalesModel('Chris', 30, 50, '17-Apr-12'),
//     new SalesModel('Lisa', 47, 77, '9-Apr-12'),
//     new SalesModel('Tom', 5, 25, '5-Apr-12'),
//     new SalesModel('Stacy', 20, 40, '4-Apr-12'),
//     new SalesModel('Charles', 13, 35, '3-Apr-12'),
//     new SalesModel('Mary', 29, 67, '26-Mar-12')
// ];

// let chart: PlayChart;

// const clear = () => {
//     if (chart) {
//         chart.clear();
//     }
// };

// const hideLoader = () => {
//     select('.back-drop').classed('show', false);
// };

// const showLoader = () => {
//     select('.back-drop').classed('show', true);
// };

// const buttonMapping = () => {
//     select('.container-button-bar').on('click', (event: PointerEvent) => {
//         const seriesId = (event.target as HTMLElement).id;
//         // if (seriesId) {
//         //     showLoader();
//         //     clear();
//         // }
//         // switch (seriesId) {
//         //     case 'svg-line-series':
//         //         delayExcute(200, simpleSvgLineSeriesExample);
//         //     break;

//         //     case 'webgl-line-series':
//         //         delayExcute(200, simpleWebglLineSeriesExample);
//         //     break;

//         //     case 'webgl-bigdata-line-series':
//         //         delayExcute(200, webGLBigDataLineSeriesSample);
//         //     break;

//         //     case 'canvas-line-series':
//         //         delayExcute(200, simpleCanvasLineSeriesExample);
//         //     break;

//         //     case 'canvas-bigdata-line-series':
//         //         delayExcute(200, canvasBigDataLineSeriesSample);
//         //     break;

//         //     case 'svg-column-series':
//         //         delayExcute(200, simpleSvgColumnSeriesExample);
//         //     break;

//         //     case 'svg-stacked-column-series':
//         //         delayExcute(200, simpleSvgStackedColumnSeriesExample);
//         //     break;

//         //     case 'svg-plot-series':
//         //         delayExcute(200, simpleSvgPlotSeriesExample);
//         //     break;

//         //     case 'svg-area-series':
//         //         delayExcute(200, simpleSvgAreaSeriesExample);
//         //     break;

//         //     default:
//         //     break;
//         // }
//         // delayExcute(300, hideLoader);
//         new Observable((observ: Observer<any>) => {
//             observ.next(true);
//             observ.complete();
//         }).pipe(
//             tap(() => {
//                 if (seriesId) {
//                     showLoader();
//                     clear();
//                 }
//             }),
//             delay(200),
//             tap(() => {
//                 switch (seriesId) {
//                     case 'svg-line-series':
//                         simpleSvgLineSeriesExample();
//                         break;
//                     case 'webgl-line-series':
//                         simpleWebglLineSeriesExample();
//                         break;
//                     case 'webgl-bigdata-line-series':
//                         webGLBigDataLineSeriesSample();
//                         break;
//                     case 'canvas-line-series':
//                         simpleCanvasLineSeriesExample();
//                         break;
//                     case 'canvas-bigdata-line-series':
//                         canvasBigDataLineSeriesSample();
//                         break;
//                     case 'svg-column-series':
//                         simpleSvgColumnSeriesExample();
//                         break;
//                     case 'svg-stacked-column-series':
//                         simpleSvgStackedColumnSeriesExample();
//                         break;
//                     case 'svg-plot-series':
//                         simpleSvgPlotSeriesExample();
//                         break;
//                     case 'svg-area-series':
//                         simpleSvgAreaSeriesExample();
//                         break;
//                     default:
//                         break;
//                 }
//             }),
//             delay(300),
//             tap(() => {
//                 hideLoader();
//             })
//         );
//     });
// };

// const setSeriesColor = (item: any) => {
//     const seriesFaultType = item.referenceYn === 'Y' ? '' : item.segmentStatus;
//     if (item.referenceYn === 'N' && item.fdtaFaultYn === 'Y' && seriesFaultType === 'F' && item.primeYn === 'N') {
//         // selectedAlarm
//         return '#EA3010';
//     } else if (item.referenceYn === 'N' && item.fdtaFaultYn === 'N' && seriesFaultType === 'F' && item.primeYn === 'N') {
//         // Fault
//         return '#f57416';
//     } else if (item.referenceYn === 'N' && item.fdtaFaultYn === 'N' && seriesFaultType === 'W' && item.primeYn === 'N') {
//         // Warning
//         return '#f7ba00';
//     } else if (item.referenceYn === 'N' && item.fdtaFaultYn === 'N' && seriesFaultType === 'S' && item.primeYn === 'N') {
//         // Safe
//         return '#0dac09';
//     } else if (item.referenceYn === 'Y' && item.fdtaFaultYn === 'Y' && seriesFaultType === '' && item.primeYn === 'N') {
//         // referenceAlarm
//         return '#970f94';
//     } else if (item.referenceYn === 'Y' && item.fdtaFaultYn === 'N' && seriesFaultType === '' && item.primeYn === 'N') {
//         // referenceNonAlarm
//         return '#3766c7';
//     } else if (item.referenceYn === 'Y' && item.fdtaFaultYn === 'N' && seriesFaultType === '' && item.primeYn === 'Y') {
//         // primeReference
//         return '#3766c7';
//     } else {
//         return '#EA3010';
//     }
// };

// const simpleWebglLineSeriesExample = () => {
//     const yFieldSeries: BasicCanvasWebglLineSeriesOneConfiguration = {
//         selector: 'x-series',
//         xField: 'x',
//         yField: 'y',
//         dot: {
//             radius: 6
//         },
//         line: {
//             strokeColor: '#4d8700'
//         }
//     };

//     const zFieldSeries: BasicCanvasWebglLineSeriesOneConfiguration = {
//         selector: 'z-series',
//         xField: 'x',
//         yField: 'z',
//         dot: {
//             radius: 6
//         },
//         line: {
//             strokeColor: '#ff9421'
//         }
//     };

//     const xFieldSeries: BasicCanvasWebglLineSeriesOneConfiguration = {
//         selector: 'z-series',
//         xField: 'x',
//         yField: 'x',
//         dot: {
//             radius: 6
//         },
//         line: {
//             strokeColor: '#2137ff'
//         }
//     };

//     const seriesList = [yFieldSeries, zFieldSeries, xFieldSeries];

//     const commonConfiguration: BaseConfiguration = {
//         selector: '#chart-div',
//         data: sampleMockData(20),
//         title: {
//             placement: Placement.TOP,
//             content: 'WebGL Line Series'
//         },
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`;
//             }
//         },
//         isResize: true,
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.NUMBER,
//                 placement: 'bottom',
//                 min: 0,
//                 max: 21
//             },
//             {
//                 field: 'y',
//                 type: ScaleType.NUMBER,
//                 placement: 'left',
//                 min: 0,
//                 max: 30
//             }
//         ],
//         zoom: {
//             direction: Direction.BOTH
//         }
//     };

//     (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');

//     chart = WebglTraceChart(commonConfiguration, seriesList).draw();
// };

// const simpleSvgLineSeriesExample = () => {
//     const yFieldSeries: BasicLineSeriesConfiguration = {
//         selector: 'y-series',
//         xField: 'x',
//         yField: 'y',
//         line: {
//             dashArray: 2
//         },
//         dot: {
//             radius: 3,
//             selector: 'basic-line-y-series-dot'
//         },
//         displayName: 'y-series'
//     };

//     const zFieldSeries: BasicLineSeriesConfiguration = {
//         selector: 'z-series',
//         xField: 'x',
//         yField: 'z',
//         line: {},
//         dot: {
//             radius: 3,
//             selector: 'basic-line-z-series-dot'
//         },
//         displayName: 'z-series'
//     };

//     const xFieldSeries: BasicLineSeriesConfiguration = {
//         selector: 'x-series',
//         xField: 'x',
//         yField: 'x',
//         line: {},
//         dot: {
//             radius: 3,
//             selector: 'basic-line-x-series-dot'
//         },
//         // style: {
//         //     strokeWidth: 5,
//         //     strokeColor: '#ccc'
//         // },
//         displayName: 'x-series'
//     };

//     const seriesList = [yFieldSeries, zFieldSeries, xFieldSeries];

//     const commonConfiguration: BaseConfiguration = {
//         selector: '#chart-div',
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`;
//             }
//         },
//         data: sampleMockData(20),
//         title: {
//             placement: Placement.TOP,
//             content: 'SVG Line Series'
//         },
//         legend: {
//             placement: Placement.TOP
//         },
//         isResize: true,
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.NUMBER,
//                 placement: 'bottom',
//                 min: 0,
//                 max: 21,
//                 gridLine: {
//                     color: '#ddd'
//                 }
//             },
//             {
//                 field: 'y',
//                 type: ScaleType.NUMBER,
//                 placement: 'left',
//                 min: 0,
//                 max: 30,
//                 gridLine: {
//                     color: '#ddd'
//                 }
//             }
//         ],
//         zoom: {
//             direction: Direction.BOTH
//         },
//         mouseGuideLine: {}
//     };

//     (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');

//     chart = SvgTraceChart(commonConfiguration, seriesList).draw();
//     chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
//         if (item.type === 'click') {
//             alert('click =>' + JSON.stringify(item.data));
//         }
//     });
// };

// const simpleSvgColumnSeriesExample = () => {
//     const columns = ['x', 'y', 'z'];

//     const groupedVerticalColumnSeriesConfiguration: GroupedVerticalBarSeriesConfiguration = {
//         xField: 'x',
//         displayNames: columns,
//         columns
//     };

//     const commonConfiguration: BaseConfiguration = {
//         selector: '#chart-div',
//         data: sampleMockData(20),
//         title: {
//             placement: Placement.TOP,
//             content: 'SVG Column Series'
//         },
//         legend: {
//             placement: Placement.TOP
//         },
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 const item: any = d[2];
//                 const key = d[4];
//                 return `${key}: ${item[key]}`;
//             }
//         },
//         isResize: true,
//         axes: [
//             {
//                 type: ScaleType.STRING,
//                 placement: 'bottom',
//                 field: 'x',
//                 padding: 0.2
//             },
//             {
//                 field: 'total',
//                 type: ScaleType.NUMBER,
//                 placement: 'left',
//                 tickFormat: 's',
//                 isRound: true,
//                 min: 0, // 여러개의 field를 참조해야할 경우에는 min, max를 지정해야 정상작동을 한다.
//                 max: 50
//             }
//         ]
//     };

//     (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');

//     chart = SvgGroupedBarChart(commonConfiguration, groupedVerticalColumnSeriesConfiguration).draw();
// };

// const simpleSvgStackedColumnSeriesExample = () => {
//     const stackedVerticalColumnSeries: StackedVerticalBarSeriesConfiguration = {
//         xField: 'x',
//         yField: 'total',
//         columns: ['x', 'y', 'z'],
//         displayNames: ['xField', 'yField', 'zField']
//     };

//     const commonConfiguration = {
//         selector: '#chart-div',
//         data: sampleMockData(20),
//         isResize: true,
//         legend: {
//             placement: Placement.TOP
//         },
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 const item: any = d[2];
//                 const key = d[4];
//                 return `${key}: ${item[key]}`;
//             }
//         },
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.STRING,
//                 placement: Placement.BOTTOM,
//                 padding: 0.2,
//                 title: {
//                     align: Align.CENTER,
//                     content: 'x field'
//                 }
//             },
//             {
//                 field: 'total',
//                 type: ScaleType.NUMBER,
//                 placement: Placement.LEFT,
//                 isRound: true,
//                 tickFormat: ',d',
//                 min: 0,
//                 max: max(sampleMockData(20), (d: any) => d.total),
//                 title: {
//                     align: Align.CENTER,
//                     content: 'y field'
//                 }
//             }
//         ]
//     };

//     (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');

//     chart = SvgStackedBarChart(commonConfiguration, stackedVerticalColumnSeries).draw();
//     chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
//         console.log('selected item : ', item);
//     });
// };

// const simpleCanvasLineSeriesExample = () => {
//     const yFieldSeries: BasicCanvasTraceConfiguration = {
//         selector: 'y-series',
//         xField: 'x',
//         yField: 'y',
//         dot: {
//             radius: 3
//         },
//         displayName: 'y-series'
//     };

//     const zFieldSeries: BasicCanvasTraceConfiguration = {
//         selector: 'z-series',
//         xField: 'x',
//         yField: 'z',
//         dot: {
//             radius: 3
//         },
//         displayName: 'z-series'
//     };

//     const xFieldSeries: BasicCanvasTraceConfiguration = {
//         selector: 'x-series',
//         xField: 'x',
//         yField: 'x',
//         dot: {
//             radius: 3
//         },
//         displayName: 'x-series'
//     };

//     const seriesList = [yFieldSeries, zFieldSeries, xFieldSeries];

//     const commonConfiguration: BaseConfiguration = {
//         selector: '#chart-div',
//         style: {
//             backgroundColor: '#fff'
//         },
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`;
//             }
//         },
//         legend: {
//             placement: Placement.TOP
//         },
//         data: sampleMockData(20),
//         title: {
//             placement: Placement.TOP,
//             content: 'Canvas Line Series'
//         },
//         isResize: true,
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.NUMBER,
//                 placement: 'bottom',
//                 min: 0,
//                 max: 21,
//                 gridLine: {
//                     dasharray: 2
//                 }
//             },
//             {
//                 field: 'y',
//                 type: ScaleType.NUMBER,
//                 placement: 'left',
//                 min: 0,
//                 max: 30,
//                 gridLine: {
//                     dasharray: 2
//                 }
//             }
//         ],
//         zoom: {
//             direction: Direction.BOTH
//         }
//     };

//     (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');

//     chart = CanvasTraceChart(commonConfiguration, seriesList).draw();
// };

// const simpleSvgPlotSeriesExample = () => {
//     const yFieldSeries: BasicLineSeriesConfiguration = {
//         selector: 'y-series',
//         xField: 'x',
//         yField: 'y',
//         dot: {
//             radius: 3,
//             selector: 'basic-line-y-series-dot'
//         },
//         displayName: 'y-series'
//     };

//     const zFieldSeries: BasicLineSeriesConfiguration = {
//         selector: 'z-series',
//         xField: 'x',
//         yField: 'z',
//         dot: {
//             radius: 3,
//             selector: 'basic-line-z-series-dot'
//         },
//         displayName: 'z-series'
//     };

//     const xFieldSeries: BasicLineSeriesConfiguration = {
//         selector: 'x-series',
//         xField: 'x',
//         yField: 'x',
//         dot: {
//             radius: 3,
//             selector: 'basic-line-x-series-dot'
//         },
//         displayName: 'x-series'
//     };

//     const seriesList = [yFieldSeries, zFieldSeries, xFieldSeries];

//     const commonConfiguration: BaseConfiguration = {
//         selector: '#chart-div',
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`;
//             }
//         },
//         data: sampleMockData(20),
//         title: {
//             placement: Placement.TOP,
//             content: 'SVG Plot Series'
//         },
//         legend: {
//             placement: Placement.TOP
//         },
//         isResize: true,
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.NUMBER,
//                 placement: 'bottom',
//                 min: 0,
//                 max: 21,
//                 gridLine: {
//                     dasharray: 2
//                 }
//             },
//             {
//                 field: 'y',
//                 type: ScaleType.NUMBER,
//                 placement: 'left',
//                 min: -5,
//                 max: 30,
//                 gridLine: {
//                     dasharray: 2
//                 }
//             }
//         ],
//         zoom: {
//             direction: Direction.BOTH
//         }
//     };

//     (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');

//     chart = SvgTraceChart(commonConfiguration, seriesList).draw();
//     chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
//         if (item.type === 'click') {
//             alert('click =>' + JSON.stringify(item.data));
//         }
//     });
// };

// const simpleSvgAreaSeriesExample = () => {
//     const yFieldSeries: BasicAreaSeriesConfiguration = {
//         selector: 'y-series',
//         xField: 'x',
//         yField: 'y',
//         displayName: 'y-series'
//     };

//     const zFieldSeries: BasicAreaSeriesConfiguration = {
//         selector: 'z-series',
//         xField: 'x',
//         yField: 'z',
//         displayName: 'z-series'
//     };

//     const xFieldSeries: BasicAreaSeriesConfiguration = {
//         selector: 'x-series',
//         xField: 'x',
//         yField: 'x',
//         displayName: 'x-series'
//     };

//     const seriesList = [yFieldSeries, zFieldSeries, xFieldSeries];

//     const commonConfiguration: BaseConfiguration = {
//         selector: '#chart-div',
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 return `x: ${d.x} \ny: ${d.y}\nz: ${d.z}`;
//             }
//         },
//         data: sampleMockData(20),
//         title: {
//             placement: Placement.TOP,
//             content: 'SVG Area Series'
//         },
//         legend: {
//             placement: Placement.TOP
//         },
//         isResize: true,
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.NUMBER,
//                 placement: 'bottom',
//                 min: 1,
//                 max: 20,
//                 gridLine: {
//                     color: '#ccc'
//                 },
//                 tickFormat: ',.1f'
//             },
//             {
//                 field: 'y',
//                 type: ScaleType.NUMBER,
//                 placement: 'left',
//                 min: 0,
//                 max: 30,
//                 gridLine: {
//                     color: '#ccc'
//                 }
//             }
//         ],
//         zoom: {
//             direction: Direction.BOTH
//         }
//     };

//     (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');

//     chart = SvgAreaChart(commonConfiguration, seriesList).draw();
//     chart.chartItemEvent.subscribe((item: ChartItemEvent) => {
//         if (item.type === 'click') {
//             alert('click =>' + JSON.stringify(item.data));
//         }
//     });
// };

// const webGLBigDataLineSeriesSample = () => {
//     const stepData = stepInfo.map((step: any) => {
//         return {
//             start: step.startCountSlot,
//             end: step.startCountSlot + step.maxCount,
//             label: step.step,
//             data: step
//         };
//     });

//     const seriesList = [];

//     const alarmSeriesList = [];

//     const optionList = [];

//     let xmin = 0;
//     let xmax = 0;
//     let ymin = Infinity;
//     let ymax = 0;

//     const parseData = () => {
//         seriesList.length = 0;
//         alarmSeriesList.length = 0;
//         optionList.length = 0;

//         xmin = 0;
//         xmax = 0;
//         ymin = Infinity;
//         ymax = 0;

//         for (let i = 0; i < tracePoints.length; i++) {
//             const tempData = tracePoints[i];
//             const seriesData = tempData.data.rows.map((row: any[]) => {
//                 const rowData: any = {};
//                 for (let j = 0; j < tempData.data.columns.length; j++) {
//                     const columnName = tempData.data.columns[j];
//                     rowData[columnName] = row[j];
//                 }
//                 const x = rowData['count_slot'];
//                 const y = rowData['VALUE'];
//                 if (xmin > x) {
//                     xmin = x;
//                 }
//                 if (xmax < x) {
//                     xmax = x;
//                 }
//                 if (ymin > y) {
//                     ymin = y;
//                 }
//                 if (ymax < y) {
//                     ymax = y;
//                 }

//                 return new BasicCanvasWebglLineSeriesOneModel(x, y, i, rowData);
//             });
//             // test data 늘리기
//             const tempRow: BasicCanvasWebglLineSeriesOneModel = seriesData[seriesData.length - 1];
//             for (let index = 1; index < 50000; index++) {
//                 const x = tempRow.x + index;
//                 const y = tempRow.y;
//                 if (xmax < x) {
//                     xmax = x;
//                 }
//                 seriesData.push(new BasicCanvasWebglLineSeriesOneModel(x, y, i, tempRow));
//             }
//             // type별 컬러 지정.
//             const seriesColor = setSeriesColor(tempData);
//             const configuration: BasicCanvasWebglLineSeriesOneConfiguration = {
//                 selector: (seriesColor === '#EA3010' ? 'webgl-trace-alarm' : 'webgl-trace') + i,
//                 xField: 'x',
//                 yField: 'y',
//                 dot: {
//                     radius: 4
//                 },
//                 line: {
//                     strokeColor: seriesColor
//                     // opacity: seriesColor === '#EA3010' ? 1 :  0.9
//                 },
//                 data: seriesData
//             };

//             if (seriesColor === '#EA3010') {
//                 alarmSeriesList.push(configuration);
//             } else {
//                 seriesList.push(configuration);
//             }
//         }
//     };

//     parseData();

//     const basicSpecArea: OptionConfiguration = {
//         name: 'BasicSpecArea',
//         configuration: {
//             selector: 'spec-area',
//             startField: 'start',
//             endField: 'end',
//             data: [stepData[2]]
//         }
//     };

//     const basicStepLine: OptionConfiguration = {
//         name: 'BasicStepLine',
//         configuration: {
//             selector: 'step-line',
//             xField: 'start',
//             data: stepData
//         }
//     };

//     const basicStepArea: OptionConfiguration = {
//         name: 'BasicStepArea',
//         configuration: {
//             startField: 'start',
//             labelField: 'label',
//             endField: 'end',
//             data: stepData
//         }
//     };

//     optionList.push(basicSpecArea);
//     optionList.push(basicStepArea);
//     optionList.push(basicStepLine);

//     const commonConfiguration: BaseConfiguration = {
//         selector: '#chart-div',
//         data: [],
//         title: {
//             placement: Placement.TOP,
//             content: 'WebGL Big Data Line Chart'
//         },
//         isResize: true,
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.NUMBER,
//                 placement: Placement.BOTTOM,
//                 min: xmin - xmax * 0.01,
//                 max: xmax + xmax * 0.01
//             },
//             {
//                 field: 'y',
//                 type: ScaleType.NUMBER,
//                 placement: Placement.LEFT,
//                 min: ymin,
//                 max: ymax
//             }
//         ],
//         zoom: {
//             xDirection: Placement.BOTTOM,
//             yDirection: Placement.LEFT,
//             direction: Direction.BOTH
//         }
//     };

//     (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');

//     chart = WebglTraceChart(commonConfiguration, seriesList.concat(alarmSeriesList), optionList).draw();
// };

// const canvasBigDataLineSeriesSample = () => {
//     const stepData = stepInfo.map((step: any) => {
//         return {
//             start: step.startCountSlot,
//             end: step.startCountSlot + step.maxCount,
//             label: step.step,
//             data: step
//         };
//     });

//     const seriesList = [];

//     const alarmSeriesList = [];

//     const optionList = [];

//     let xmin = 0;
//     let xmax = 0;
//     let ymin = Infinity;
//     let ymax = 0;

//     const parseData = () => {
//         seriesList.length = 0;
//         alarmSeriesList.length = 0;
//         optionList.length = 0;

//         const basicSpecArea: OptionConfiguration = {
//             name: 'BasicSpecArea',
//             configuration: {
//                 selector: 'spec-area',
//                 startField: 'start',
//                 endField: 'end',
//                 data: [stepData[2]]
//             }
//         };

//         const basicStepLine: OptionConfiguration = {
//             name: 'BasicStepLine',
//             configuration: {
//                 selector: 'step-line',
//                 xField: 'start',
//                 data: stepData
//             }
//         };

//         const basicStepArea: OptionConfiguration = {
//             name: 'BasicStepArea',
//             configuration: {
//                 startField: 'start',
//                 labelField: 'label',
//                 endField: 'end',
//                 data: stepData
//             }
//         };

//         optionList.push(basicSpecArea);
//         optionList.push(basicStepArea);
//         optionList.push(basicStepLine);

//         xmin = 0;
//         xmax = 0;
//         ymin = Infinity;
//         ymax = 0;

//         for (let i = 0; i < tracePoints.length; i++) {
//             const tempData = tracePoints[i];
//             const seriesData = tempData.data.rows.map((row: any[]) => {
//                 const rowData: any = {};
//                 for (let j = 0; j < tempData.data.columns.length; j++) {
//                     const columnName = tempData.data.columns[j];
//                     rowData[columnName] = row[j];
//                 }

//                 const x = rowData['count_slot'];
//                 const y = rowData['VALUE'];

//                 if (xmin > x) {
//                     xmin = x;
//                 }
//                 if (xmax < x) {
//                     xmax = x;
//                 }
//                 if (ymin > y) {
//                     ymin = y;
//                 }
//                 if (ymax < y) {
//                     ymax = y;
//                 }

//                 return new BasicCanvasTraceModel(x, y, i, rowData);
//             });

//             // test data 늘리기
//             const tempRow: BasicCanvasTraceModel = seriesData[seriesData.length - 1];
//             for (let index = 1; index < 50000; index++) {
//                 const x = tempRow.x + index;
//                 const y = tempRow.y;

//                 if (xmax < x) {
//                     xmax = x;
//                 }

//                 seriesData.push(new BasicCanvasTraceModel(x, y, i, tempRow));
//             }

//             // type별 컬러 지정.
//             const seriesColor = setSeriesColor(tempData);
//             const configuration: BasicCanvasTraceConfiguration = {
//                 selector: (seriesColor === '#EA3010' ? 'canvas-trace-alarm' : 'canvas-trace') + i,
//                 xField: 'x',
//                 yField: 'y',
//                 dot: {
//                     radius: 4
//                 },
//                 line: {
//                     strokeColor: seriesColor
//                     // opacity: seriesColor === '#EA3010' ? 1 :  0.9
//                 },
//                 data: seriesData
//             };

//             if (seriesColor === '#EA3010') {
//                 alarmSeriesList.push(configuration);
//                 // alarmSeriesList.push(new BasicCanvasTrace(configuration));
//             } else {
//                 seriesList.push(configuration);
//                 // seriesList.push(new BasicCanvasTrace(configuration));
//             }
//         }
//     };

//     parseData();

//     const commonConfiguration: BaseConfiguration = {
//         selector: '#chart-div',
//         data: [],
//         title: {
//             placement: Placement.TOP,
//             content: 'Canvas BigData Line Series'
//         },
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 return 'd : ' + d;
//             }
//         },
//         isResize: true,
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.NUMBER,
//                 placement: 'bottom',
//                 min: xmin - xmax * 0.01,
//                 max: xmax + xmax * 0.01
//             },
//             {
//                 field: 'y',
//                 type: ScaleType.NUMBER,
//                 placement: 'left',
//                 min: ymin,
//                 max: ymax
//             }
//         ],
//         zoom: {
//             xDirection: 'bottom',
//             yDirection: 'left',
//             direction: Direction.BOTH
//         }
//     };

//     (select('#json-configuration').node() as any).innerHTML = JSON.stringify(commonConfiguration, null, '\t');

//     console.time('canvaslinedraw');
//     chart = CanvasTraceChart(commonConfiguration, seriesList.concat(alarmSeriesList), optionList).draw();
//     console.timeEnd('canvaslinedraw');
// };

// const canvasTraceChart = () => {
//     const randomX = randomNormal(0, 9);
//     const randomY = randomNormal(0, 9);
//     let xmin = 0;
//     let xmax = 0;
//     let ymin = 0;
//     let ymax = 0;

//     const numberPoints = 100; // 300000

//     const startDt = new Date().getTime();
//     let endDt = 0;
//     const term = 300;
//     const traceData = range(numberPoints).map((d: number) => {
//         const x = startDt + term * d;
//         const y = parseFloat(randomY().toFixed(2));
//         // const i = index;
//         const i = (d % numberPoints) / 3 === 0 ? 0 : parseFloat(randomY().toFixed(2));
//         // const y = i%10 === 0 ? parseFloat(randomX().toFixed(2)) : i;
//         // const y = i * 10;
//         if (xmin > x) {
//             xmin = x;
//         }
//         if (xmax < x) {
//             xmax = x;
//         }
//         if (ymin > y) {
//             ymin = y;
//         }
//         if (ymax < y) {
//             ymax = y;
//         }

//         endDt = x;
//         return new BasicCanvasTraceModel(x, y, i, {});
//     });

//     console.time('timechartdraw');
//     const canvasTrace = new BasicCanvasTrace({
//         selector: 'canvas-trace',
//         xField: 'x',
//         yField: 'y',
//         dot: {
//             radius: 4
//         }
//     });

//     const canvasTrace2 = new BasicCanvasTrace({
//         selector: 'canvas-trace2',
//         xField: 'x',
//         yField: 'i',
//         dot: {
//             radius: 4
//         }
//     });

//     const dtFmt = timeFormat('%m-%d %H:%M:%S');
//     const scatterChart = new PlayChart<BasicCanvasTraceModel>({
//         selector: '#canvastracechart',
//         data: traceData,
//         title: {
//             placement: Placement.TOP,
//             content: 'Canvas Trace Chart'
//         },
//         calcField: 'y',
//         isResize: true,
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.NUMBER,
//                 placement: 'bottom',
//                 tickTextParser: (d: any) => dtFmt(new Date(d)),
//                 min: startDt - term * (numberPoints * 0.005),
//                 max: endDt + term * (numberPoints * 0.005),
//                 tickSize: 5
//             },
//             {
//                 field: 'y',
//                 type: ScaleType.NUMBER,
//                 placement: 'left',
//                 min: ymin - ymax * 0.5,
//                 max: ymax + ymax * 0.5
//             }
//         ],
//         series: [canvasTrace, canvasTrace2],
//         functions: [
//             new BasicCanvasMouseZoomHandler({
//                 xDirection: 'bottom',
//                 yDirection: 'left'
//             })
//         ]
//     }).draw();
//     console.timeEnd('timechartdraw');
// };

// const canvasScatter = (id: string) => {
//     const randomX = randomNormal(0, 9);
//     const randomY = randomNormal(0, 9);
//     let xmin = 0;
//     let xmax = 0;
//     let ymin = 0;
//     let ymax = 0;
//     const numberPoints = 13000;
//     console.time('dataparse');
//     const scatterData = range(numberPoints).map((d: number) => {
//         const x = parseFloat(randomX().toFixed(2));
//         const y = parseFloat(randomX().toFixed(2));
//         const z = parseFloat(randomX().toFixed(2));
//         if (xmin > x) {
//             xmin = x;
//         }
//         if (xmax < x) {
//             xmax = x;
//         }
//         if (ymin > y) {
//             ymin = y;
//         }
//         if (ymax < y) {
//             ymax = y;
//         }
//         return new BasicCanvasScatterPlotModel(x, y, z, d, false, {});
//     });
//     console.timeEnd('dataparse');

//     console.time('chartdraw');
//     const scatterPlot = new BasicCanvasScatterPlot<BasicCanvasScatterPlotModel>({
//         selector: 'scatter',
//         xField: 'x',
//         yField: 'y'
//     });

//     // console.log('min : ', xmin, ymin);
//     // console.log('max : ', ymax, ymax);
//     // const scatterChart = new PlayChart<BasicCanvasScatterPlotModel>({
//     //     selector: id,
//     //     data: scatterData,
//     //     title: {
//     //         placement: Placement.TOP,
//     //         content: 'Canvas Scatter Plot'
//     //     },
//     //     margin: {
//     //         top: 10, right: 10, bottom: 30, left: 40
//     //     },
//     //     calcField: 'y',
//     //     isResize: true,
//     //     axes: [
//     //         {
//     //             field: 'x',
//     //             type: 'number',
//     //             placement: 'bottom',
//     //             min: xmin,
//     //             max: xmax
//     //         },
//     //         {
//     //             field: 'y',
//     //             type: 'number',
//     //             placement: 'left',
//     //             min: ymin,
//     //             max: ymax
//     //         }
//     //     ],
//     //     series: [
//     //         // canvasLineSeries,
//     //         // canvasTrace,
//     //         scatterPlot
//     //     ],
//     //     functions: [
//     //         new BasicCanvasMouseZoomHandler({
//     //             xDirection: 'bottom',
//     //             yDirection: 'left'
//     //         })
//     //     ]
//     // }).draw();
//     console.timeEnd('chartdraw');
// };

// const canvasLineChart = () => {
//     const fields = lineData.map((item: any) => item.member);
//     const members = Array.from(new Set(fields));
//     const series = [];

//     members.map((member: string) => {
//         const filter = (d: any) => {
//             return d.member === member;
//         };
//         const currnetLineSeries = new BasicCanvasLineSeries({
//             selector: 'basic-line-' + member,
//             // animation: true,
//             displayName: member,
//             dotSelector: 'basic-line-' + member + '-dot',
//             yField: 'value',
//             xField: 'date',
//             isCurve: false,
//             dot: {
//                 radius: 3
//             },
//             filter,
//             shape: Shape.LINE
//         });

//         series.push(currnetLineSeries);
//     });

//     const parseTime = timeFormat('%H:%M:%S %m-%d');
//     new PlayChart({
//         selector: '#canvaslinechart',
//         // margin: {
//         //     top: 60,
//         //     left: 40,
//         //     right: 20,
//         //     bottom: 50
//         // },
//         title: {
//             placement: Placement.TOP,
//             content: 'Canvas Line Chart'
//             // style: {
//             //     size: 16,
//             //     color: '#ff0000',
//             //     font: 'monospace'
//             // }
//         },
//         legend: {
//             placement: Placement.TOP,
//             isCheckBox: true,
//             isAll: true
//         },
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 return `${d.member} \n Date: ${parseTime(d.date)} \n Value: ${d.value}`;
//             },
//             eventType: 'mouseover'
//         },
//         data: lineData.map((item: any) => {
//             const newDate = new Date();
//             newDate.setFullYear(item.time.substring(0, 4));
//             newDate.setMonth(parseInt(item.time.substring(5, 7), 16) - 1);
//             newDate.setDate(item.time.substring(8, 10));
//             newDate.setHours(item.time.substring(11, 13));
//             newDate.setMinutes(item.time.substring(14, 16));
//             newDate.setSeconds(item.time.substring(17, 19));
//             newDate.setMilliseconds(item.time.substring(20, 22));
//             item.date = newDate;
//             return item;
//         }),
//         isResize: true,
//         axes: [
//             {
//                 field: 'date',
//                 type: 'time',
//                 placement: Placement.BOTTOM,
//                 tickFormat: '%H:%M %m-%d',
//                 tickSize: 5,
//                 // tickTextParser: (d) => {
//                 //     return parseTime(new Date(d));
//                 // },
//                 isZoom: true,
//                 title: {
//                     content: 'Date',
//                     align: Align.CENTER
//                 }
//             },
//             {
//                 field: 'value',
//                 type: 'number',
//                 placement: Placement.LEFT,
//                 tickSize: 5,
//                 min: 0,
//                 isRound: true,
//                 title: {
//                     content: 'Value',
//                     align: Align.TOP
//                 }
//             }
//         ],
//         displayDelay: {
//             delayTime: 500
//         },
//         series
//     }).draw();
// };

// const svgTraceChart = () => {
//     const randomX = randomNormal(0, 9);
//     const randomY = randomNormal(0, 9);
//     let xmin = 0;
//     let xmax = 0;
//     let ymin = 0;
//     let ymax = 0;
//     const numberPoints = 3000;
//     console.time('svgtimedataparse');
//     const startDt = new Date().getTime();

//     let endDt = 0;
//     const traceData = range(numberPoints).map((d: number, i: number) => {
//         const x = startDt + 300 * i;
//         const y = parseFloat(randomY().toFixed(2));
//         // const y = i%10 === 0 ? parseFloat(randomX().toFixed(2)) : i;
//         // const y = i * 10;
//         if (xmin > x) {
//             xmin = x;
//         }
//         if (xmax < x) {
//             xmax = x;
//         }
//         if (ymin > y) {
//             ymin = y;
//         }
//         if (ymax < y) {
//             ymax = y;
//         }

//         endDt = x;
//         return new BasicCanvasTraceModel(x, y, i, {});
//     });
//     console.timeEnd('svgtimedataparse');

//     console.time('svgtimechartdraw');
//     const svgTrace = new BasicLineSeries({
//         selector: 'svg-trace',
//         xField: 'x',
//         yField: 'y'
//     });

//     const scatterChart = new PlayChart<BasicCanvasTraceModel>({
//         selector: '#svgtrace',
//         data: traceData,
//         calcField: 'y',
//         title: {
//             placement: Placement.TOP,
//             content: 'SVG Line Series'
//         },
//         isResize: true,
//         axes: [
//             {
//                 field: 'x',
//                 type: ScaleType.TIME,
//                 placement: 'bottom',
//                 tickFormat: '%m-%d %H:%M',
//                 min: startDt,
//                 max: endDt,
//                 tickSize: 3
//             },
//             {
//                 field: 'y',
//                 type: 'number',
//                 placement: 'left',
//                 min: ymin,
//                 max: ymax
//             }
//         ],
//         series: [svgTrace],
//         functions: []
//     }).draw();
//     console.timeEnd('svgtimechartdraw');
// };

// const svgLineSeriesExample = () => {
//     const fields = lineData.map((item: any) => item.member);
//     const members = Array.from(new Set(fields));
//     const series = [];

//     members.map((member: string) => {
//         const filter = (d: any) => {
//             return d.member === member;
//         };
//         const currnetLineSeries = new BasicLineSeries({
//             selector: 'basic-line-' + member,
//             // animation: true,
//             displayName: member,
//             yField: 'value',
//             xField: 'date',
//             line: {
//                 isCurve: true
//             },
//             dot: {
//                 radius: 3,
//                 selector: 'basic-line-' + member + '-dot'
//             },
//             filter,
//             shape: Shape.LINE
//         });

//         series.push(currnetLineSeries);
//     });

//     const parseTime = timeFormat('%H:%M:%S %m-%d');
//     new PlayChart({
//         selector: '#chart-div',
//         title: {
//             placement: Placement.TOP,
//             content: 'SVG Line Chart'
//         },
//         legend: {
//             placement: Placement.TOP,
//             isCheckBox: true,
//             isAll: true
//         },
//         tooltip: {
//             tooltipTextParser: (d: any) => {
//                 return `${d.member} \n Date: ${parseTime(d.date)} \n Value: ${d.value}`;
//             },
//             eventType: 'mouseover'
//         },
//         data: lineData.map((item: any) => {
//             const newDate = new Date();
//             newDate.setFullYear(item.time.substring(0, 4));
//             newDate.setMonth(parseInt(item.time.substring(5, 7), 16) - 1);
//             newDate.setDate(item.time.substring(8, 10));
//             newDate.setHours(item.time.substring(11, 13));
//             newDate.setMinutes(item.time.substring(14, 16));
//             newDate.setSeconds(item.time.substring(17, 19));
//             newDate.setMilliseconds(item.time.substring(20, 22));
//             item.date = newDate;
//             return item;
//         }),
//         isResize: true,
//         axes: [
//             {
//                 field: 'date',
//                 type: 'time',
//                 placement: Placement.BOTTOM,
//                 tickFormat: '%H:%M %m-%d',
//                 tickSize: 5,
//                 isZoom: true,
//                 title: {
//                     content: 'Date',
//                     align: Align.CENTER
//                 }
//             },
//             {
//                 field: 'value',
//                 type: 'number',
//                 placement: Placement.LEFT,
//                 tickSize: 5,
//                 min: 0,
//                 isRound: true,
//                 title: {
//                     content: 'Value',
//                     align: Align.TOP
//                 }
//             }
//         ],
//         series
//     }).draw();
// };

// const topologyExcute = () => {
//     const groups = topologyData.result.frameworks.map((item: any) => {
//         const currentData = {
//             rawID: item.rawID,
//             frameworkID: item.frameworkID,
//             frameworkSetID: item.frameworkSetID,
//             status: item.status,
//             previousStatus: item.previousStatus,
//             updateDateTime: item.updateDateTime,
//             fullName: item.fullName
//         };
//         return new TopologyGroupElement(item.fullName, 0, 0, 50, 50, 5, 5, currentData, item.members);
//     });
//     // .filter((item: TopologyGroupElement, index: number) => index === 0);

//     const machines = topologyData.result.machines.map((item: any) => {
//         return new TopologyGroupElement(item.fullName, 0, 0, 50, 50, 5, 5, item, []);
//     });

//     const topology = new BasicTopology({
//         selector: 'topology'
//     });

//     const Chart: PlayChart = new PlayChart({
//         selector: '#basic-topology',
//         data: [new TopologyData(groups, machines)],
//         margin: {
//             top: 5,
//             left: 10,
//             right: 10,
//             bottom: 5
//         },
//         isResize: true,
//         axes: [],
//         series: [topology]
//     }).draw();
// };

// const excute = () => {
//     const parseTime = timeParse('%d-%b-%y');

//     /*
//     // d3 date format
//     d3.time.format("%Y-%m-%d")	1986-01-28
//     d3.time.format("%m/%d/%Y")	01/28/1986
//     d3.time.format("%H:%M")	    11:39
//     d3.time.format("%H:%M %p")	11:39 AM
//     d3.time.format("%B %d")	    January 28
//     d3.time.format("%d %b")	    28 Jan
//     d3.time.format("%d-%b-%y")	28-Jan-86
//     d3.time.format("%S s")	    13 s
//     d3.time.format("%M m")	    39 m
//     d3.time.format("%H h")	    11 h
//     d3.time.format("%a")	    Tue

//     // d3 number format
//     // 참조: http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e
//     // Enter a number: 300
//     d3.format("")	    300
//     d3.format("s")	    1k
//     d3.format(",%")	    100,000%
//     d3.format("+,%")	+100,000%
//     d3.format(",.1%")	100,000.0%
//     d3.format(".4r")	300
//     d3.format(".4f")	300.0000
//     d3.format(".4n")	1,000
//     d3.format(".3n")	1.00e+3
//     d3.format(",d")	    1,000
//     d3.format(",.0f")	1,000
//     d3.format(".0f")	300
//     d3.format(".0e")	1e+3
//     */
// };

// const boxplot = () => {
//     // data setup
//     const groupCounts = {};
//     const globalCounts = [];
//     const meanGenerator = randomUniform(10);

//     for (let i = 0; i < data.length; i++) {
//         const randomMean = meanGenerator();
//         const generator = randomNormal(randomMean);
//         const key = data[i].salesperson;
//         groupCounts[key] = [];

//         for (let j = 0; j < 100; j++) {
//             const entry = generator();
//             groupCounts[key].push(entry);
//             globalCounts.push(entry);
//         }
//     }

//     // Sort group counts so quantile methods work
//     for (const key in groupCounts) {
//         const groupCount = groupCounts[key];
//         groupCounts[key] = groupCount.sort((a: number, b: number) => {
//             return a - b;
//         });
//     }

//     // Setup a color scale for filling each box
//     const colorScale = scaleOrdinal(schemeCategory10).domain(Object.keys(groupCounts));

//     // Prepare the data for the box plots
//     const boxPlotData = [];
//     for (const [key, groupCount] of Object.entries(groupCounts)) {
//         const tempCounts: string[] = (groupCount as number[]).map((num) => num + '');
//         const localMin = min(tempCounts);
//         const localMax = max(tempCounts);

//         const obj: BoxplotModel = {
//             key,
//             counts: groupCount as number[],
//             quartile: boxQuartiles(groupCount),
//             whiskers: [parseFloat(localMin), parseFloat(localMax)],
//             color: colorScale(key)
//         };
//         boxPlotData.push(obj);
//     }

//     const boxplotSeries = new BasicBoxplotSeries({
//         xField: 'key',
//         maxWidth: 20
//     });

//     const boxPlotChart = new PlayChart({
//         selector: '#boxplot',
//         data: boxPlotData,
//         isResize: true,
//         axes: [
//             {
//                 field: 'key',
//                 type: 'string',
//                 placement: 'bottom',
//                 padding: 0.2
//                 // domain: data.map((item: any) => item.salesperson)
//             },
//             {
//                 field: 'sales',
//                 type: 'number',
//                 placement: 'left',
//                 min: min(globalCounts), // 여러개의 field를 참조해야할 경우에는 min, max를 지정해야 정상작동을 한다.
//                 max: max(globalCounts)
//             }
//         ],
//         series: [boxplotSeries]
//     }).draw();
// };

// const boxQuartiles = (d: any) => {
//     return [quantile(d, 0.25), quantile(d, 0.5), quantile(d, 0.75)];
// };

// const bollinger = () => {
//     const parseTime = timeParse('%m/%d/%Y');

//     bollingerData.forEach((item: any) => {
//         item.date = parseTime(item.date);
//         item.close = +item.close;
//     });
//     const bollingerChartData = getBollingerBands(20, 2, bollingerData);

//     const bollingerBandSeries = new BasicBollingerBandSeries({
//         xField: 'key'
//     });

//     const lineSeries = new BasicLineSeries({
//         selector: 'bollinger-line',
//         line: {
//             isCurve: false
//         },
//         xField: 'key',
//         yField: 'close'
//     });

//     const bollingerChart = new PlayChart({
//         selector: '#bollinger',
//         data: bollingerChartData,
//         isResize: true,
//         min: min(bollingerChartData, (d: any) => {
//             return d.low;
//         }),
//         max: max(bollingerChartData, (d: any) => {
//             return d.high;
//         }),
//         axes: [
//             {
//                 field: 'close',
//                 type: 'number',
//                 placement: 'left'
//             },
//             {
//                 field: 'key',
//                 type: 'time',
//                 placement: 'bottom'
//             }
//         ],
//         series: [bollingerBandSeries, lineSeries]
//     }).draw();
// };

// // test 용
// const getBollingerBands = (n: number, k: number, rowData: any[]) => {
//     const bands = []; // { ma: 0, low: 0, high: 0 }
//     for (let i = n - 1, len = rowData.length; i < len; i++) {
//         const slice = rowData.slice(i + 1 - n, i);
//         const meanData = mean(slice, (d: any) => {
//             return d.close;
//         });
//         const stdDev = Math.sqrt(
//             mean(
//                 slice.map((d: any) => {
//                     return Math.pow(d.close - meanData, 2);
//                 })
//             )
//         );
//         bands.push({
//             key: rowData[i].date,
//             ma: meanData,
//             low: meanData - k * stdDev,
//             high: meanData + k * stdDev,
//             close: rowData[i].close
//         });
//     }
//     return bands;
// };

// const violin = () => {
//     // https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/iris.csv
//     // ./component/mock-data/iris.csv
//     csv('./component/mock-data/iris.csv', (rowData: any) => {
//         return rowData;
//     }).then((result: any) => {
//         const violinSeries = new BasicViolinSeries({
//             selector: 'basic-violin',
//             xField: 'Species',
//             yField: 'Sepal_Length'
//         });

//         const violinChart = new PlayChart({
//             selector: '#violin',
//             data: result,
//             isResize: true,
//             min: 0,
//             max: 21,
//             axes: [
//                 {
//                     field: 'Species',
//                     type: 'string',
//                     placement: 'bottom',
//                     padding: 0.2,
//                     domain: ['setosa', 'versicolor', 'virginica']
//                 },
//                 {
//                     field: 'Sepal_Length',
//                     type: 'number',
//                     placement: 'left'
//                 }
//             ],
//             series: [violinSeries]
//         }).draw();
//     });
// };

// const stackedBar = () => {
//     csv('./component/mock-data/age-groups.csv', (d: any, index: number, columns: string[]) => {
//         for (let i = 1, t = 0; i < columns.length; ++i) {
//             t += d[columns[i]] = +d[columns[i]];
//             d.total = t;
//         }
//         return d;
//     })
//         .then((result: any) => {
//             result.sort((a, b) => {
//                 return b.total - a.total;
//             });

//             const stackedVerticalBarSeries = new StackedVerticalBarSeries({
//                 xField: 'State',
//                 yField: 'total',
//                 columns: result.columns
//             });

//             const stackedBarChart = new PlayChart({
//                 selector: '#stackedBar',
//                 data: result,
//                 min: 0,
//                 max: max(result, (d: any) => +d.total),
//                 margin: {
//                     left: 65
//                 },
//                 isResize: true,
//                 axes: [
//                     {
//                         field: 'State',
//                         type: 'string',
//                         placement: 'bottom',
//                         padding: 0.2
//                     },
//                     {
//                         field: 'total',
//                         type: 'number',
//                         placement: 'left',
//                         isRound: true,
//                         tickFormat: ',d'
//                     }
//                 ],
//                 series: [stackedVerticalBarSeries]
//             }).draw();
//         })
//         .catch((error: any) => {
//             console.log('Error : ', error);
//         });
// };

// const groupedBar = () => {
//     csv('./component/mock-data/grouped-bar-data.csv', (d: any, index: number, columns: string[]) => {
//         for (let i = 1, t = 0; i < columns.length; ++i) {
//             t += d[columns[i]] = +d[columns[i]];
//             d.total = t;
//         }
//         return d;
//     })
//         .then((result) => {
//             const groupedVerticalBarSeries = new GroupedVerticalBarSeries({
//                 xField: 'State',
//                 columns: result.columns
//             });

//             const groupedBarChart = new PlayChart({
//                 selector: '#groupedBar',
//                 data: result,
//                 margin: {
//                     left: 65
//                 },
//                 isResize: true,
//                 axes: [
//                     {
//                         field: 'State',
//                         type: 'string',
//                         placement: 'bottom',
//                         padding: 0.1
//                     },
//                     {
//                         field: 'total',
//                         type: 'number',
//                         placement: 'left',
//                         tickFormat: 's',
//                         isRound: true,
//                         min: -2000000, // 여러개의 field를 참조해야할 경우에는 min, max를 지정해야 정상작동을 한다.
//                         max: max(data, (d) => max(result.columns.slice(1), (key) => d[key]))
//                     }
//                 ],
//                 series: [groupedVerticalBarSeries]
//             }).draw();
//         })
//         .catch((error: any) => {
//             console.log('Error : ', error);
//         });
// };

// const pieChart = () => {
//     const pieData = [
//         {name: '<5', value: 19912018},
//         {name: '5-9', value: 20501982},
//         {name: '10-14', value: 20679786},
//         {name: '15-19', value: 21354481},
//         {name: '20-24', value: 22604232},
//         {name: '25-29', value: 21698010},
//         {name: '30-34', value: 21183639},
//         {name: '35-39', value: 19855782},
//         {name: '40-44', value: 20796128},
//         {name: '45-49', value: 21370368},
//         {name: '50-54', value: 22525490},
//         {name: '55-59', value: 21001947},
//         {name: '60-64', value: 18415681},
//         {name: '65-69', value: 14547446},
//         {name: '70-74', value: 10587721},
//         {name: '75-79', value: 7730129},
//         {name: '80-84', value: 5811429},
//         {name: '≥85', value: 5938752}
//     ];

//     const pieSeries = new BasicPieSeries({
//         categoryField: 'name',
//         valueField: 'value'
//     });

//     const basicPieChart = new PlayChart({
//         selector: '#pie',
//         data: pieData,
//         margin: {
//             left: 10,
//             right: 10,
//             top: 10,
//             bottom: 10
//         },
//         min: 0,
//         max: max(pieData, (d: any) => d.value),
//         isResize: true,
//         axes: [],
//         series: [pieSeries]
//     }).draw();
// };

// const donutChart = () => {
//     const labels = ['Lorem ipsum', 'dolor sit', 'amet', 'consectetur', 'adipisicing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt'];
//     const pieData = labels.map((label) => {
//         return {label, value: Math.random()};
//     });

//     const donutSeries = new BasicDonutSeries({
//         categoryField: 'label',
//         valueField: 'value'
//     });

//     const basicPieChart = new PlayChart({
//         selector: '#donut',
//         data: pieData,
//         margin: {
//             left: 10,
//             right: 10,
//             top: 10,
//             bottom: 10
//         },
//         min: 0,
//         max: max(pieData, (d: any) => d.value),
//         isResize: true,
//         axes: [],
//         series: [donutSeries]
//     }).draw();
// };

// const areaChart = () => {
//     const parseTime = timeParse('%d-%b-%y');
//     csv('./component/mock-data/area-data.csv', (d: any, index: number, columns: string[]) => {
//         d.date = parseTime(d.date);
//         d.close = +d.close;
//         return d;
//     })
//         .then((result) => {
//             const basicAreaSeries = new BasicAreaSeries({
//                 xField: 'date',
//                 yField: 'close'
//             });

//             new PlayChart({
//                 selector: '#area',
//                 data: data.map((d: any, i: number) => d),
//                 margin: {
//                     left: 65,
//                     right: 50
//                 },
//                 calcField: 'close',
//                 isResize: true,
//                 axes: [
//                     {
//                         field: 'date',
//                         type: 'time',
//                         placement: 'bottom'
//                     },
//                     {
//                         field: 'close',
//                         type: 'number',
//                         placement: 'left',
//                         tickFormat: 's'
//                     }
//                 ],
//                 series: [basicAreaSeries]
//             }).draw();
//         })
//         .catch((error: any) => {
//             console.log('Error : ', error);
//         });
// };

// const gaugeChart = () => {
//     const basicGaugeSereis = new BasicGaugeSeries({
//         clipWidth: 100,
//         clipHeight: 110,
//         ringWidth: 30,
//         minValue: 0,
//         maxValue: 100,
//         transitionMs: 300
//     });

//     new PlayChart({
//         selector: '#gauge',
//         data: [37],
//         margin: {
//             top: 10,
//             right: 0,
//             bottom: 30,
//             left: 0
//         },
//         isResize: true,
//         axes: [],
//         series: [basicGaugeSereis]
//     }).draw();
// };

// delayExcute(200, () => {
//     buttonMapping();
// });

// // delayExcute(500, () => {
// //     dfdCanvasChartSample();
// // });

// // canvasLineChart();

// // canvasTraceChart();

// // canvasScatter('#scatter');

// // svgTraceChart();

// // lineChart();

// // topologyExcute();

// // excute();

// // boxplot();

// // bollinger();

// // violin();

// // stackedBar();

// // groupedBar();

// // pieChart();

// // donutChart();

// // areaChart();

// // gaugeChart();
