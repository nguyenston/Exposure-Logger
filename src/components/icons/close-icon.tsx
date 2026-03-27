import Svg, { Line } from 'react-native-svg';

import { colors } from '@/theme/colors';

type CloseIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function CloseIcon({
  size = 10,
  color = colors.text.accent,
  strokeWidth = 1.5,
}: CloseIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
    >
      <Line
        x1="2"
        y1="2"
        x2="8"
        y2="8"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
      <Line
        x1="8"
        y1="2"
        x2="2"
        y2="8"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}
