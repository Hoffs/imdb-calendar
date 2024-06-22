import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { auth } from 'lib/client/firebase';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

async function singInUsingEmail(email: string): Promise<string | undefined> {
  const actionCodeSettings = {
    url: `${window.location.origin}${window.location.pathname}`,
    handleCodeInApp: true,
  };
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    return undefined;
  } catch (err) {
    if (err instanceof FirebaseError) {
      return `${err.code}: ${err.message}`;
    }

    return 'Unknown error';
  }
}

async function signInLocally(token: string): Promise<string | undefined> {
  const r = await fetch('/api/signin', {
    headers: {
      'x-firebase-id': token,
    },
  });

  if (r.ok) {
    return undefined;
  } else {
    const json = await r.json();
    if (json.error) {
      throw new Error(json.error);
    }
  }
}

export const useSignInUsingEmail = (): [
  boolean,
  (email: string) => Promise<string | undefined>,
] => {
  const [inProgress, setInProgress] = useState<boolean>(false);
  const router = useRouter();

  // useEffect to wait for client to load
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      window.localStorage.removeItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }

      if (email) {
        setInProgress(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            if (!result.user) {
              throw new Error('failed to get firebase user');
            }

            return result.user.getIdToken();
          })
          .then(signInLocally)
          .then(() => router.push('/home'))
          .catch(() => {
            setInProgress(false);
          })
          .finally(() => {
            window.history.replaceState({}, '', window.location.pathname);
          });
      } else {
        // NOTE: Without timeout it sometimes does not replace.
        setTimeout(
          () => window.history.replaceState({}, '', window.location.pathname),
          10,
        );
      }
    }
  }, []);

  return [inProgress, singInUsingEmail];
};
