import Svg, { Circle, Rect } from 'react-native-svg';

import { colors } from '@/theme/colors';

type DeviceIconProps = {
  size?: number;
  color?: string;
};

export function DeviceIcon({
  size = 18,
  color = colors.background.surface,
}: DeviceIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Rect
        x="7"
        y="3"
        width="10"
        height="18"
        rx="2.5"
        stroke={color}
        strokeWidth="1.8"
      />
      <Circle
        cx="12"
        cy="17.5"
        r="0.9"
        fill={color}
      />
    </Svg>
  );
}
