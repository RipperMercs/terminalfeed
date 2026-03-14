// Animated weather scene — pure CSS animations, no canvas
// Each weather type has a unique visual effect

interface Props {
  weatherCode: number;
}

type WeatherType = 'clear' | 'cloudy' | 'rain' | 'heavyRain' | 'snow' | 'fog' | 'thunder' | 'drizzle';

function getWeatherType(code: number): WeatherType {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 55) return 'drizzle';
  if (code >= 61 && code <= 63) return 'rain';
  if (code === 65 || code >= 80) return 'heavyRain';
  if (code >= 71 && code <= 75) return 'snow';
  if (code >= 95) return 'thunder';
  return 'cloudy';
}

export function WeatherScene({ weatherCode }: Props) {
  const type = getWeatherType(weatherCode);

  return (
    <div className={`wxScene wxScene--${type}`}>
      {/* Sun (clear/partly cloudy) */}
      {(type === 'clear') && (
        <div className="wxSun">
          <div className="wxSunCore" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="wxSunRay" style={{ transform: `rotate(${i * 45}deg)` }} />
          ))}
        </div>
      )}

      {/* Clouds */}
      {(type !== 'clear' && type !== 'fog') && (
        <div className="wxClouds">
          <div className="wxCloud wxCloud1" />
          <div className="wxCloud wxCloud2" />
          {type !== 'cloudy' && <div className="wxCloud wxCloud3" />}
        </div>
      )}

      {/* Rain drops */}
      {(type === 'rain' || type === 'heavyRain' || type === 'drizzle') && (
        <div className="wxRain">
          {[...Array(type === 'heavyRain' ? 20 : type === 'drizzle' ? 6 : 12)].map((_, i) => (
            <div
              key={i}
              className={`wxDrop ${type === 'drizzle' ? 'wxDropLight' : ''}`}
              style={{
                left: `${(i * 37 + 13) % 100}%`,
                animationDelay: `${(i * 0.17) % 1.2}s`,
                animationDuration: `${type === 'heavyRain' ? 0.4 : 0.7}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Snow */}
      {type === 'snow' && (
        <div className="wxSnow">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="wxFlake"
              style={{
                left: `${(i * 29 + 7) % 100}%`,
                animationDelay: `${(i * 0.3) % 2}s`,
                fontSize: `${6 + (i % 3) * 3}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Fog layers */}
      {type === 'fog' && (
        <div className="wxFog">
          <div className="wxFogLayer wxFogLayer1" />
          <div className="wxFogLayer wxFogLayer2" />
          <div className="wxFogLayer wxFogLayer3" />
        </div>
      )}

      {/* Lightning flash */}
      {type === 'thunder' && (
        <>
          <div className="wxRain">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="wxDrop"
                style={{
                  left: `${(i * 37 + 13) % 100}%`,
                  animationDelay: `${(i * 0.15) % 1}s`,
                  animationDuration: '0.4s',
                }}
              />
            ))}
          </div>
          <div className="wxLightning" />
        </>
      )}
    </div>
  );
}
