import { useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import type { GrowthLog } from '../db/types';
import { parseISODate } from '../lib/date';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Row } from './ui';

type Point = { x: number; value: number };

const HEIGHT = 220;
const PADDING = { top: 16, right: 44, bottom: 28, left: 44 };

function buildPath(points: Point[], scaleX: (x: number) => number, scaleY: (v: number) => number) {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(2)} ${scaleY(p.value).toFixed(2)}`)
    .join(' ');
}

function niceLabel(value: number) {
  return Math.abs(value) >= 1000 ? `${Math.round(value / 100) / 10}k` : `${Math.round(value * 10) / 10}`;
}

/**
 * Grafik garis dua sumbu: berat (kiri, gram) dan panjang (kanan, cm).
 * Digambar manual dengan react-native-svg agar ringan dan bebas dependensi berat.
 */
export function GrowthChart({ data }: { data: GrowthLog[] }) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);

  const series = useMemo(() => {
    // Urut naik berdasarkan tanggal agar garis bergerak dari lama ke baru.
    const sorted = [...data]
      .map(log => ({ log, date: parseISODate(log.date) }))
      .filter(item => item.date !== null)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());

    const times = sorted.map(item => item.date!.getTime());
    const weight: Point[] = [];
    const length: Point[] = [];
    sorted.forEach((item, index) => {
      const x = times.length > 1 ? times[index] : 0;
      if (item.log.weight_g != null) weight.push({ x, value: item.log.weight_g });
      if (item.log.length_cm != null) length.push({ x, value: item.log.length_cm });
    });
    return { weight, length, times };
  }, [data]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  if (series.weight.length + series.length.length === 0) {
    return (
      <Body muted>Belum ada data berat atau panjang untuk digambarkan.</Body>
    );
  }

  const chartW = Math.max(0, width - PADDING.left - PADDING.right);
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;

  const xMin = Math.min(...series.times);
  const xMax = Math.max(...series.times);
  const scaleX = (x: number) =>
    PADDING.left + (xMax === xMin ? chartW / 2 : ((x - xMin) / (xMax - xMin)) * chartW);

  const makeScaleY = (points: Point[]) => {
    const values = points.map(p => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min = min - 1;
      max = max + 1;
    }
    const pad = (max - min) * 0.1;
    min -= pad;
    max += pad;
    return {
      min,
      max,
      scale: (v: number) => PADDING.top + chartH - ((v - min) / (max - min)) * chartH,
    };
  };

  const weightAxis = series.weight.length ? makeScaleY(series.weight) : null;
  const lengthAxis = series.length.length ? makeScaleY(series.length) : null;

  const weightColor = theme.colors.primary;
  const lengthColor = theme.colors.accent;

  return (
    <View style={{ gap: 10 }} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
            const y = PADDING.top + chartH * fraction;
            return (
              <Line
                key={fraction}
                x1={PADDING.left}
                x2={PADDING.left + chartW}
                y1={y}
                y2={y}
                stroke={theme.colors.border}
                strokeWidth={1}
              />
            );
          })}

          {weightAxis
            ? [0, 0.5, 1].map(fraction => (
                <SvgText
                  key={`w${fraction}`}
                  x={PADDING.left - 6}
                  y={PADDING.top + chartH * fraction + 4}
                  fontSize={10}
                  fill={weightColor}
                  textAnchor="end">
                  {niceLabel(weightAxis.max - (weightAxis.max - weightAxis.min) * fraction)}
                </SvgText>
              ))
            : null}

          {lengthAxis
            ? [0, 0.5, 1].map(fraction => (
                <SvgText
                  key={`l${fraction}`}
                  x={PADDING.left + chartW + 6}
                  y={PADDING.top + chartH * fraction + 4}
                  fontSize={10}
                  fill={lengthColor}
                  textAnchor="start">
                  {niceLabel(lengthAxis.max - (lengthAxis.max - lengthAxis.min) * fraction)}
                </SvgText>
              ))
            : null}

          {weightAxis && series.weight.length > 1 ? (
            <Path
              d={buildPath(series.weight, scaleX, weightAxis.scale)}
              stroke={weightColor}
              strokeWidth={2.5}
              fill="none"
            />
          ) : null}
          {lengthAxis && series.length.length > 1 ? (
            <Path
              d={buildPath(series.length, scaleX, lengthAxis.scale)}
              stroke={lengthColor}
              strokeWidth={2.5}
              strokeDasharray="5 4"
              fill="none"
            />
          ) : null}

          {weightAxis
            ? series.weight.map((p, i) => (
                <Circle
                  key={`wp${i}`}
                  cx={scaleX(p.x)}
                  cy={weightAxis.scale(p.value)}
                  r={3.5}
                  fill={weightColor}
                />
              ))
            : null}
          {lengthAxis
            ? series.length.map((p, i) => (
                <Circle
                  key={`lp${i}`}
                  cx={scaleX(p.x)}
                  cy={lengthAxis.scale(p.value)}
                  r={3.5}
                  fill={lengthColor}
                />
              ))
            : null}

          <SvgText
            x={PADDING.left}
            y={HEIGHT - 8}
            fontSize={10}
            fill={theme.colors.textMuted}
            textAnchor="start">
            {new Date(xMin).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
          </SvgText>
          <SvgText
            x={PADDING.left + chartW}
            y={HEIGHT - 8}
            fontSize={10}
            fill={theme.colors.textMuted}
            textAnchor="end">
            {new Date(xMax).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
          </SvgText>
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}

      <Row style={{ gap: 16, justifyContent: 'center' }}>
        <Row>
          <View style={{ width: 14, height: 3, backgroundColor: weightColor, borderRadius: 2 }} />
          <Body muted style={{ fontSize: 12 }}>Berat (gram)</Body>
        </Row>
        <Row>
          <View style={{ width: 14, height: 3, backgroundColor: lengthColor, borderRadius: 2 }} />
          <Body muted style={{ fontSize: 12 }}>Panjang (cm)</Body>
        </Row>
      </Row>
    </View>
  );
}
