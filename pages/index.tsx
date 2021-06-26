import Layout from 'components/Layout';
import Link from 'next/link';

export default function Home(): JSX.Element {
  return (
    <Layout>
      <div tw="text-2xl">IMDB Calendar</div>

      <div tw="shadow flex flex-col gap-2 py-2 px-4 border rounded border-gray-400 max-w-md">
        <span>
          Create iCal-based calendars from your IMDB lists. Never miss upcoming
          movie or tv show release.
        </span>
        <span>
          All you need to do is:
          <ol tw="list-inside list-decimal text-sm">
            <li>Create an IMDB list;</li>
            <li>Add Movies or TV Shows;</li>
            <li>Submit it to the system;</li>
            <li>Submit it to the system;</li>
            <li>Wait for the calendar to be created;</li>
            <li>Add created calendar URL to your calendar.</li>
          </ol>
        </span>
        <span>
          The calendar will continue to be updated with any new movies, shows
          and seasons that are added to the list.
        </span>
      </div>

      <span tw="py-2 px-4 border-2 border-blue-800 rounded uppercase">
        <Link href="/signin">Sign in to continue!</Link>
      </span>
    </Layout>
  );
}
