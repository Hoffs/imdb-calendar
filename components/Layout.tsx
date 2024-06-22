import tw from 'twin.macro';
import DefaultHead from 'components/DefaultHead';

import { PropsWithChildren } from 'react';

const LayoutEl = tw.div`flex flex-col items-center gap-4 mt-12 font-sans`;
export default function Layout(
  e: PropsWithChildren<Record<string, unknown>>,
): JSX.Element {
  return (
    <LayoutEl>
      <DefaultHead />
      {e.children}
    </LayoutEl>
  );
}
