export const sampleMockData = (count: number = 10): any[] => {
    const mockData = [];
    for (let i = 0; i < count; i++) {
        const x = (i + 1);
        const y = Math.round(Math.random() * 10);
        const z = Math.round(Math.random() * 10);
        const total = x + y + z;
        mockData.push({
            x,
            y,
            z,
            total,
            data: {
                label: 'number' + (i + 1)
            }
        });
    }

    return mockData;
}
