import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/colors';

type FilmRollIconProps = {
  size?: number;
  color?: string;
};

export function FilmRollIcon({
  size = 32,
  color = colors.text.accent,
}: FilmRollIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 33.33 33.33"
      fill="none"
    >
      <Path
        d="M33.33 9.538V8.797h-2.375h-16.21V4.851h-1.516v1.231H2.438V4.851H.923v24.047h1.515v1.851h10.791v-1.851h1.516v-2.972h16.21h2.375V25.01h-1.575v-1.843h1.575v-1.139h-.775v-9.334h.775v-1.315h-1.611v-1.84h1.611zm-4.882-.035h1.846v1.843h-1.846V9.503zm-3.591 0h1.846v1.843h-1.846V9.503zm-3.747 0h1.846v1.843H21.11V9.503zm-3.902 0h1.845v1.843h-1.845V9.503zm-1.903 0v1.843h-.56V9.503h.56zM2.438 10.861H4.16v14.462H2.438V10.861zm12.867 14.095h-.56v-1.845h.56v1.845zm3.748 0h-1.845v-1.845h1.845v1.845zm1.841-2.952h-6.149v-9.55h6.149v9.55zm2.062 2.952H21.11v-1.845h1.846v1.845zm3.747 0h-1.846v-1.845h1.846v1.845zm3.591 0h-1.846v-1.845h1.846v1.845zm.153-2.952h-7.586v-9.55h7.586v9.55z"
        fill={color}
      />
      <Rect
        x={0}
        y={2.582}
        width={15.667}
        height={2.687}
        fill={color}
      />
    </Svg>
  );
}
