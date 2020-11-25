import path from 'path';
import * as grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import admin from 'firebase-admin';
import { ServiceClientConstructor } from '@grpc/grpc-js/build/src/make-client';
import { firestore } from 'firebase-admin/lib/firestore';
import { promisify } from 'util';

import CollectionReference = firestore.CollectionReference;

type Id = {
  id: string,
};

type UserData = {
  age: number,
  name: string,
  address: string,
}

type User = UserData & Id

admin.initializeApp({
  credential: admin.credential.cert(path.resolve(__dirname, './credentials.json')),
});

const db = admin.firestore();
const usersCollection = db.collection('users') as CollectionReference<UserData>;

const PROTO_PATH = path.resolve(__dirname, '../../proto/users.proto');

const packageDefinition = loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true,
});

const usersProto = grpc.loadPackageDefinition(packageDefinition);
const server = new grpc.Server();
const promisifiedBind = promisify(server.bindAsync).bind(server);

server.addService((usersProto.UserService as ServiceClientConstructor).service, {
  getAll: async (
    _: grpc.ServerUnaryCall<unknown, { users: User[] }>,
    callback: grpc.sendUnaryData<{ users: User[] }>,
  ) => {
    const snapshot = await usersCollection.get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(null, { users });
  },

  get: async (
    call: grpc.ServerUnaryCall<Id, User>,
    callback: grpc.sendUnaryData<User>,
  ) => {
    const userDoc = await usersCollection.doc(call.request.id).get();
    const userData = userDoc.data();

    if (userData) {
      callback(null, {
        id: userDoc.id,
        ...userData,
      });
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: 'Not found',
      });
    }
  },

  insert: async (
    call: grpc.ServerUnaryCall<UserData, User>,
    callback: grpc.sendUnaryData<User>,
  ) => {
    const userReference = await usersCollection.add(call.request);
    const user = await userReference.get();
    const userData = user.data();

    if (userData) {
      callback(null, {
        id: user.id,
        ...userData,
      });
    }
  },

  update: async (
    call: grpc.ServerUnaryCall<User, User>,
    callback: grpc.sendUnaryData<User>,
  ) => {
    await usersCollection.doc(call.request.id).update(call.request);
    const userDoc = await usersCollection.doc(call.request.id).get();
    const userData = userDoc.data();

    if (userData) {
      callback(null, {
        id: userDoc.id,
        ...userData,
      });
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: 'Not found',
      });
    }
  },

  remove: async (
    call: grpc.ServerUnaryCall<Id, Record<string, never>>,
    callback: grpc.sendUnaryData<Record<string, never>>,
  ) => {
    await usersCollection.doc(call.request.id).delete();
    callback(null, {});
  },
});

async function main() {
  await promisifiedBind('127.0.0.1:30043', grpc.ServerCredentials.createInsecure());
  console.log('Server running at http://127.0.0.1:30043');
  server.start();
}

main();
