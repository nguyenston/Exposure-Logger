import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme/colors';

type CrosshairIconProps = {
  size?: number;
  color?: string;
};

export function CrosshairIcon({
  size = 18,
  color = colors.background.surface,
}: CrosshairIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Circle
        cx="12"
        cy="12"
        r="5"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M12 3v3M12 18v3M3 12h3M18 12h3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}
