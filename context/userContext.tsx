import {
  useState,
  useEffect,
  createContext,
  useContext,
  PropsWithChildren,
} from 'react';
import firebase from 'utils/client/firebase';
import Router from 'next/router';

export const UserContext = createContext<Context>({});

type Context = {
  user?: firebase.User;
  loadingUser?: boolean;
};

export default function UserContextComp({
  children,
}: PropsWithChildren<Record<string, unknown>>): JSX.Element {
  const [user, setUser] = useState<firebase.User | undefined>();
  const [loadingUser, setLoadingUser] = useState(true); // Helpful, to update the UI accordingly.

  useEffect(() => {
    // Listen authenticated user
    const unsubscriber = firebase.auth().onAuthStateChanged(async (user) => {
      try {
        if (user) {
          // User is signed in.
          // const { uid, displayName, email, photoURL } = user;
          // You could also look for the user doc in your Firestore (if you have one):
          // const userDoc = await firebase.firestore().doc(`users/${uid}`).get()
          setUser(user);
        } else {
          setUser(undefined);
          Router.push('/');
        }
      } catch (error) {
        // Most probably a connection error. Handle appropriately.
      } finally {
        setLoadingUser(false);
      }
    });

    // Unsubscribe auth listener on unmount
    return () => unsubscriber();
  }, []);

  return (
    <UserContext.Provider value={{ user, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = (): Context => useContext(UserContext);
