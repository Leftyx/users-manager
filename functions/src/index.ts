import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
const corsHandler = cors({ origin: true });

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
});

const firestoreDatabase = admin.firestore();

const deleteUserById = async (id: number): Promise<admin.firestore.WriteResult> => {
  const query = firestoreDatabase.collection('users').where('id', '==', id);
  query.get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
      return doc.ref.delete();
    });
  });

  const result = await firestoreDatabase.collection('users')
    .doc(id.toString())
    .delete();

  return result;
};

export const manageUsers = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    functions.logger.info('Trace:', request, { structuredData: true });
    if (request.method === 'POST') {
      if (request.body?.data?.id) {
        const writeResult = await deleteUserById(request.body.data.id as number);
        functions.logger.info(writeResult);
        response.status(200).send({ data: { success: true } });
        return;
      }
    }

    response.status(400).send({ data: { success: false } });
  });
});
