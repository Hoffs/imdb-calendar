import Head from 'next/head';

export default function DefaultHead(): JSX.Element {
  return (
    <Head>
      <title>IMDB Calendar</title>
      <meta
        name="description"
        content="Generate iCal for IMDB playlist releases"
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
