import path from 'path';
import grpc, { ServerUnaryCall } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import admin from 'firebase-admin';
import { ServiceClientConstructor } from '@grpc/grpc-js/build/src/make-client';
import { sendUnaryData } from "@grpc/grpc-js/src/server-call";
import {firestore} from "firebase-admin/lib/firestore";
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
  credential: admin.credential.cert('./credentials.json')
});

const db = admin.firestore();
const usersCollection = db.collection('users') as CollectionReference<UserData>;

const PROTO_PATH = path.resolve(__dirname, '../users.proto');

const packageDefinition = loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true
});

const usersProto = grpc.loadPackageDefinition(packageDefinition);
const server = new grpc.Server();

server.addService((usersProto.UserService as ServiceClientConstructor).service, {
  getAll: async (_: ServerUnaryCall<any, User[]>, callback: sendUnaryData<User[]>) => {
    const snapshot = await usersCollection.get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(null, users);
  },

  get: async (call: ServerUnaryCall<Id, User>, callback: sendUnaryData<User>) => {
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

  insert: async (call: ServerUnaryCall<UserData, User>, callback: sendUnaryData<User>) => {
    const userReference = await usersCollection.add(call.request);
    const user = await userReference.get();
    const userData = user.data();

    if (userData) {
      callback(null, {
        id: user.id,
        ...userData,
      })
    }
  },

  update: async (call: ServerUnaryCall<User, User>, callback: sendUnaryData<User>) => {
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
        details: 'Not found'
      });
    }
  },

  remove: async (call: ServerUnaryCall<Id, {}>, callback: sendUnaryData<{}>) => {
    await usersCollection.doc(call.request.id).delete()
    callback(null, {});
  },
});

server.bind('127.0.0.1:30043', grpc.ServerCredentials.createInsecure());
console.log('Server running at http://127.0.0.1:30043');
server.start()
