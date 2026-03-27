import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme/colors';

type InfoIconProps = {
  size?: number;
  color?: string;
};

export function InfoIcon({
  size = 22,
  color = colors.text.accent,
}: InfoIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M9.5 9.2a2.5 2.5 0 0 1 5 0c0 1.7-1.6 2.2-2.4 3-.6.5-.8 1-.8 1.8"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Circle
        cx={12}
        cy={17.1}
        r={1.1}
        fill={color}
      />
    </Svg>
  );
}
