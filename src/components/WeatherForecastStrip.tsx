import { memo } from 'react';
import { weatherDescription } from '../hooks/useWeather';
import type { DailyForecast } from '../hooks/useWeather';
import styles from './WeatherForecastStrip.module.css';

interface Props {
  forecast: DailyForecast[];
}

function shortDay(isoDate: string, isToday: boolean): string {
  if (isToday) return 'Today';
  // Parse YYYY-MM-DD as local date (not UTC) so the weekday label matches the user's timezone
  const [y, m, d] = isoDate.split('-').map(n => parseInt(n, 10));
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export const WeatherForecastStrip = memo(function WeatherForecastStrip({ forecast }: Props) {
  if (!forecast || forecast.length < 2) return null;

  const todayIso = new Date().toISOString().slice(0, 10);
  const days = forecast.slice(0, 7);

  return (
    <div className={styles.strip}>
      {days.map(d => {
        const { icon } = weatherDescription(d.weatherCode);
        const isToday = d.date === todayIso;
        return (
          <div key={d.date} className={`${styles.day} ${isToday ? styles.todayCell : ''}`} title={`${d.date} H ${d.high}° L ${d.low}°`}>
            <span className={styles.dayName}>{shortDay(d.date, isToday)}</span>
            <span className={styles.icon}>{icon}</span>
            <span className={styles.temps}>
              <span className={styles.high}>{d.high}°</span>
              <span className={styles.low}>{d.low}°</span>
            </span>
          </div>
        );
      })}
    </div>
  );
});
