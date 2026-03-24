import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/colors';

type TrashIconProps = {
  size?: number;
  color?: string;
};

export function TrashIcon({ size = 18, color = colors.background.surface }: TrashIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M4 7h16M9 7V5.8c0-.7.6-1.3 1.3-1.3h3.4c.7 0 1.3.6 1.3 1.3V7M7.2 7l.7 11.1c.1 1 .9 1.8 1.9 1.8h4.4c1 0 1.8-.8 1.9-1.8L16.8 7M10 10.5v5.5M14 10.5v5.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
