import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/colors';

type MicrophoneIconProps = {
  size?: number;
  color?: string;
};

export function MicrophoneIcon({
  size = 20,
  color = colors.background.surface,
}: MicrophoneIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Rect
        x="9"
        y="3.5"
        width="6"
        height="10"
        rx="3"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M6.5 11.5a5.5 5.5 0 0011 0M12 17v3.5M9 20.5h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
