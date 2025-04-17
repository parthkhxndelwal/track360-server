"use client";

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps {
  data: any;
  className?: string;
}

export function LineChart({ data, className }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsLineChart
        data={data.labels.map((label: string, index: number) => {
          const dataPoint: { [key: string]: any } = { name: label };
          data.datasets.forEach((dataset: any, datasetIndex: number) => {
            dataPoint[dataset.label] = dataset.data[index];
          });
          return dataPoint;
        })}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {data.datasets.map((dataset: any, index: number) => (
          <Line
            key={index}
            type="monotone"
            dataKey={dataset.label}
            stroke={dataset.borderColor || '#8884d8'}
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export function AreaChart({ data, className }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsAreaChart
        data={data.labels.map((label: string, index: number) => {
          const dataPoint: { [key: string]: any } = { name: label };
          data.datasets.forEach((dataset: any, datasetIndex: number) => {
            dataPoint[dataset.label] = dataset.data[index];
          });
          return dataPoint;
        })}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {data.datasets.map((dataset: any, index: number) => (
          <Area
            key={index}
            type="monotone"
            dataKey={dataset.label}
            stroke={dataset.borderColor || '#8884d8'}
            fill={dataset.backgroundColor || '#8884d8'}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ data, className }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsBarChart
        data={data.labels.map((label: string, index: number) => {
          const dataPoint: { [key: string]: any } = { name: label };
          data.datasets.forEach((dataset: any, datasetIndex: number) => {
            dataPoint[dataset.label] = dataset.data[index];
          });
          return dataPoint;
        })}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {data.datasets.map((dataset: any, index: number) => (
          <Bar
            key={index}
            dataKey={dataset.label}
            fill={Array.isArray(dataset.backgroundColor) 
              ? undefined 
              : (dataset.backgroundColor || '#8884d8')}
          >
            {Array.isArray(dataset.backgroundColor) && 
              data.labels.map((_: any, i: number) => (
                <Cell 
                  key={i} 
                  fill={dataset.backgroundColor[i] || '#8884d8'} 
                />
              ))
            }
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function PieChart({ data, className }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsPieChart>
        <Tooltip />
        <Legend />
        {data.datasets.map((dataset: any, index: number) => (
          <Pie
            key={index}
            data={data.labels.map((label: string, i: number) => ({
              name: label,
              value: dataset.data[i],
            }))}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.labels.map((_: any, i: number) => (
              <Cell
                key={i}
                fill={dataset.backgroundColor?.[i] || '#8884d8'}
              />
            ))}
          </Pie>
        ))}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
} 