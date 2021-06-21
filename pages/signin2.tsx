import tw, { styled } from 'twin.macro';
import firebase from 'utils/client/firebase';
import Layout from 'components/Layout';
import { useState } from 'react';
import { useSignInUsingEmail } from 'utils/client/auth';

export default function SignIn(): JSX.Element {
  const [err, setErr] = useState<string | undefined>();
  const [msg, setMsg] = useState<string | undefined>();
  const [email, setEmail] = useState<string>('');
  const [requesting, setRequesting] = useState<boolean>();
  const [inProgress, signInUsingEmail] = useSignInUsingEmail();

  const handleSignIn = () => {
    setErr(undefined);
    if (email.length > 0) {
      setRequesting(true);
      signInUsingEmail(email).then((err) => {
        if (err) {
          setErr(err);
          setRequesting(false);
        } else {
          setMsg('Email with the sign in link has been sent!');
        }
      });
    } else {
      setErr('Email cannot be empty!');
    }
  };

  return (
    <Layout>
      <div tw="text-2xl">Sign In using Email</div>
      <div tw="font-mono text-sm">
        Powered by password-less email link sign in
      </div>

      <div tw="w-full max-w-xs flex flex-col flex-grow gap-2">
        <span
          css={[tw`text-base text-center text-red-500`, !err && tw`hidden`]}
        >
          {err}
        </span>
        <span
          css={[tw`text-base text-center text-green-500`, !msg && tw`hidden`]}
        >
          {msg}
        </span>
        <input
          tw="text-center border rounded border-gray-400"
          disabled={requesting || inProgress}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
        ></input>
        <button
          tw="disabled:opacity-50 disabled:cursor-default py-2 px-4 border-2 border-blue-800 rounded uppercase"
          disabled={requesting || inProgress}
          onClick={handleSignIn}
        >
          Sign In
        </button>
      </div>
    </Layout>
  );
}

//TODO: Check if already signed-in server side.
