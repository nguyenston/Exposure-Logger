import Svg, { Circle, Rect } from 'react-native-svg';

import { colors } from '@/theme/colors';

type VoiceControlIconProps = {
  variant: 'record' | 'stop';
  size?: number;
  color?: string;
};

export function VoiceControlIcon({
  variant,
  size = 16,
  color = colors.background.surface,
}: VoiceControlIconProps) {
  if (variant === 'stop') {
    const squareSize = size * 0.58;
    const inset = (size - squareSize) / 2;

    return (
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
      >
        <Rect
          x={inset}
          y={inset}
          width={squareSize}
          height={squareSize}
          rx={2}
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.28}
        fill={color}
      />
    </Svg>
  );
}
