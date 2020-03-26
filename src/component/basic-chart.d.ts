declare class BasicChart<T = any> extends ChartBase {
    protected data: Array<T>;

    bootstrap(): void;
}