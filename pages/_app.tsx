import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { GlobalStyles } from 'twin.macro';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <>
      <GlobalStyles />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
