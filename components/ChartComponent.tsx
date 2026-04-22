import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { RTLText } from '../components/RTLText';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  type: 'pie' | 'bar' | 'line' | 'heatmap';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ type, title, labels, datasets }) => {
  // Combine all data from all datasets for charting
  const combinedData = datasets.reduce((acc, dataset) => {
    dataset.data.forEach((value, index) => {
      acc[index] = (acc[index] || 0) + value;
    });
    return acc;
  }, [] as number[]);

  // Use the first dataset's background colors if available
  const backgroundColors = datasets[0]?.backgroundColor || [
    '#36a2eb', '#ff6384', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40'
  ];

  // Chart configuration options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        rtl: true, // Enable RTL for legend
      },
      title: {
        display: false,
      },
      tooltip: {
        rtl: true, // Enable RTL for tooltips
      }
    },
    scales: type === 'bar' || type === 'line' ? {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        }
      }
    } : undefined,
  };

  // Prepare data for charts
  const chartData = {
    labels: labels,
    datasets: [{
      label: datasets[0]?.label || 'Dataset',
      data: combinedData,
      backgroundColor: backgroundColors,
      borderColor: datasets[0]?.borderColor || 'rgba(0, 0, 0, 0.1)',
      borderWidth: datasets[0]?.borderWidth || 1,
    }]
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <div dir="rtl">
            <Bar data={chartData} options={options} />
          </div>
        );
      case 'line':
        return (
          <div dir="rtl">
            <Line data={chartData} options={options} />
          </div>
        );
      case 'pie':
        return (
          <div dir="rtl">
            <Pie data={chartData} options={{ ...options, plugins: { ...options.plugins, legend: { ...options.plugins.legend, position: 'right' } } }} />
          </div>
        );
      case 'heatmap':
        // For heatmap, we'll create a simple grid representation using div elements
        return (
          <div className="heatmap-container" style={{ display: 'flex', flexDirection: 'column', direction: 'rtl' }}>
            {labels.map((label, labelIndex) => (
              <div key={labelIndex} className="heatmap-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <RTLText className="heatmap-label" style={{ flex: 1, textAlign: 'right', marginRight: '10px' }}>{label}</RTLText>
                {datasets.map((dataset, datasetIndex) => (
                  <div
                    key={`${labelIndex}-${datasetIndex}`}
                    className="heatmap-cell"
                    style={{
                      width: '30px',
                      height: '30px',
                      margin: '0 2px',
                      borderRadius: '4px',
                      backgroundColor: backgroundColors[datasetIndex % backgroundColors.length],
                      opacity: (combinedData[labelIndex] || 0) / Math.max(...combinedData, 1)
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        );
      default:
        return <RTLText>نوع المخطط غير مدعوم</RTLText>;
    }
  };

  return (
    <div className="chart-component-container" style={{
      marginBottom: '20px',
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <RTLText className="chart-title" style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '10px',
        textAlign: 'right'
      }}>
        {title}
      </RTLText>
      {renderChart()}
    </div>
  );
};

export default ChartComponent;