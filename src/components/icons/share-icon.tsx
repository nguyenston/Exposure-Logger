import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/colors';

type ShareIconProps = {
  size?: number;
  color?: string;
};

export function ShareIcon({
  size = 18,
  color = colors.text.primary,
}: ShareIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M12 16V4m0 0l-4 4m4-4l4 4M6 14v3.5A1.5 1.5 0 007.5 19h9a1.5 1.5 0 001.5-1.5V14"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
