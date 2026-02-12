
interface ChartData {
    label: string;
    value: number;
}

interface ChartProps {
    data: ChartData[];
    title?: string;
}

export function Chart({ data, title }: ChartProps) {
    return (
        <div className="card">
            {title && <div className="card-title">{title}</div>}
            <div className="chart-container">
                {data.map((item, i) => (
                    <div key={i} className="chart-bar-wrapper">
                        <div
                            className="chart-bar"
                            style={{ height: `${item.value}%` }}
                            title={`${item.label}: ${item.value}`}
                        />
                        <div className="chart-label">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
