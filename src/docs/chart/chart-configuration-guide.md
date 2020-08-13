# Chart Configuration
<br/>

* __chart-configuration.ts 파일 참조__

<br/><br/>

### selector (string)
* 차트가 그려지는 svg영역의 id 또는 class 명을 명시한다.
<br/>
ex) selector: '#chart'
<br/><br/>

### isResize (boolean)
* 윈도우 리사이즈 이벤트 감지하여 크기를 container에 맞게 유지해준다. (default: true)
<br/>
ex) isResize: true
<br/><br/>

### data (Array<any>)
* 차트 데이터 설정
<br/>
ex) data: [{id: 'do1', assets: 100}, {id: 'do2', assets: 110}, ...]
<br/><br/>

### colors (Array<string>)
* 차트 series 색상 설정
* 기본 d3에서 제공되는 d3.schemeCategory10 색상이 적용되어 있다.
<br/>
ex) colors: ['#fff', '#fff000', ...]
<br/><br/>

### title (ChartTitle)
* 차트의 명칭을 설정한다.
  #### title.placement (string)
  * 명칭의 위치 설정
  * left, top, right, bottom
  <br/>
  ex) placement: 'top'
  <br/><br/>

  #### title.content (string)
  * 차트 명칭
  <br/>
  ex) content: 'Line Chart'
  <br/><br/>

  #### title.style 
  * 차트 명칭 style
    #### title.style.size (number)
    * 명칭 폰트 크기
    <br/>
    ex) size: 16
    <br/><br/>

    #### title.style.color (string)
    * 명칭 폰트 색상
    <br/>
    ex) color: '#999'
    <br/><br/>

    #### title.style.font (string)
    * 폰트 종류
    <br/>
    ex) font: 'Arial'
    <br/><br/>

### legend (ChartLegend)
* 차트의 범례를 출력한다.
* series 설정을 기반으로 출력된다.
  #### legend.placement (string)
  * 범례의 위치 설정
  * left, top, right, bottom
  <br/>
  ex) placement: 'top'
  <br/><br/>

  #### legend.isCheckBox (boolean)
  * 체크박스 출력 여부 (hide, show 기능을 수행)
  <br/>
  ex) isCheckBox: true
  <br/><br/> 

  #### legend.isAll (boolean)
  * All 체크박스 출력 여부 (전체 hide, show 기능 및 전체 선택, 해제 기능을 수행)
  <br/>
  ex) isAll: true
  <br/><br/> 

### axes (Array<Axis>)
* 차트의 축 설정
  #### Axis.field (string)
  * 축에 반영될 json data의 key
  <br/>
  ex) field: 'assets'
  <br/><br/>

  #### Axis.type (string)
  * 축에 출력되는 data의 type
  * default: number, number: scaleLinear, time: scaleTime, string: scaleBand, point: scalePoint for range
  <br/>
  ex) type: 'number'
  <br/><br/>

  #### Axis.placement (string)
  * 축의 위치 설정
  * left, top, right, bottom
  <br/>
  ex) placement: 'top'
  <br/><br/>

  #### Axis.domain (string)
  * 축에 표현될 데이터 (optional)
  <br/>
  ex) domain: ['Bob', 'Tom', 'Anne']
  <br/><br/>

  #### Axis.padding (number)
  * 축 양 끝 여백
  <br/>
  ex) padding: 2
  <br/><br/>

  #### Axis.visible (boolean)
  * 축 출력여부
  <br/>
  ex) visible: false
  <br/><br/>

  #### Axis.tickFormat (string)
  * 축 라벨 포멧팅 (d3 number formatter, time formatter 참고)
  <br/>
  ex) tickFormat: 's'
  <br/><br/>

  #### Axis.tickSize (number)
  * 축 라벨 length 조절 (d3 tickSize 참고, type: number, time에만 작용가능)
  <br/>
  ex) tickSize: 's'
  <br/><br/>

  #### Axis.isGridLine (boolean)
  * 축 백그라운드 라인 출력여부.
  <br/>
  ex) isGridLine: true
  <br/><br/>

  #### Axis.min (number)
  * 축의 minimum value
  <br/>
  ex) min: 0
  <br/><br/>

  #### Axis.max (number)
  * 축의 maximum value
  <br/>
  ex) max: 100
  <br/><br/>

  #### Axis.title (AxisTitle)
  * Axis 제목 출력
    #### Axis.title.align (string)
    * Axis 제목 위치
    * top, bottom, left, right, center default: center
    <br/>
    ex) align: top
    <br/><br/>

    #### Axis.title.content (string)
    * Axis 제목 <br/>
    ex) content: 'Value'

      #### Axis.title.style.size (number)
      * Axis 제목 폰트 크기
      <br/>
      ex) size: 16
      <br/><br/>

      #### Axis.title.style.color (string)
      * Axis 제목 폰트 색상
      <br/>
      ex) color: '#999'
      <br/><br/>

      #### Axis.title.style.font (string)
      * Axis 제목 폰트 종류
      <br/>
      ex) font: 'Arial'
      <br/><br/>

### series (Array<ISeries>)
* 출력하고자 하는 series 객체 리스트
<br/>
ex) series: [new ExampleSeries(argument)]
<br/><br/>

### functions (Array<IFunctions>)
* 출력하고자 하는 function 객체 리스트
<br/>
ex) functions: [new ExampleFunction(argument)]
<br/><br/>
