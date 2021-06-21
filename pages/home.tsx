import { useUser } from 'context/userContext';
import Layout from 'components/Layout';

export default function Home(): JSX.Element {
  const user = useUser();

  if (user.loadingUser) {
    return (
      <Layout>
        <div tw="py-2 px-4 border-2 border-blue-800 rounded animate-pulse">
          Loading
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main>
        <div>{user.user?.email}</div>

        <p>
          Get started by editing <code>pages/index.js</code>
        </p>
      </main>
    </Layout>
  );
}
