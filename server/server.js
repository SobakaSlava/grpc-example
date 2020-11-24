const path = require('path');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const admin = require('firebase-admin');
const serviceAccount = require('./credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const usersCollection = db.collection('users');

const PROTO_PATH = path.resolve(__dirname, '../users.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true
});

const usersProto = grpc.loadPackageDefinition(packageDefinition);
const server = new grpc.Server();

server.addService(usersProto.UserService.service, {
  getAll: (_, callback) => {
    usersCollection.get().then(snapshot => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      callback(null, { users });
    })
  },

  get: (call, callback) => {
    usersCollection.doc(call.request.id).get().then(userDoc => {
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
    });
  },

  insert: (call, callback) => {
    usersCollection.add(call.request)
      .then(userReference => {
        return userReference.get()
      })
      .then(user => {
        callback(null, {
          id: user.id,
          ...user.data(),
        })
      })
  },

  update: (call, callback) => {
    usersCollection.doc(call.request.id).update(call.request)
      .then(() => {
        return usersCollection.doc(call.request.id).get()
      })
      .then(userDoc => {
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
      });
  },

  remove: (call, callback) => {
    usersCollection.doc(call.request.id).delete()
      .then(() => {
        callback(null, {});
      })
  },
});

server.bind('127.0.0.1:30043', grpc.ServerCredentials.createInsecure());
console.log('Server running at http://127.0.0.1:30043');
server.start()
