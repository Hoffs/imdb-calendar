// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import firestore, { users } from 'utils/server/firestore';
import firebase from 'utils/server/firestore';

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // let data1 = await firestore.firestore().doc('users/admin').get();
  // let data2 = await users.doc('admin').get();
  // let data2data = data2.data();
  // console.log(data1, data2, data2data);
  res.status(200).json({ name: 'John Doe' });
}
