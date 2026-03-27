import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/colors';

type PencilIconProps = {
  size?: number;
  color?: string;
};

export function PencilIcon({ size = 16, color = colors.text.secondary }: PencilIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M4 20l3.5-.8L18.4 8.3a1.6 1.6 0 000-2.2l-.5-.5a1.6 1.6 0 00-2.2 0L4.8 16.5 4 20z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.8 7.5l2.7 2.7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
