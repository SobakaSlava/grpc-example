import path from 'path';
import * as grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { ServiceClientConstructor } from '@grpc/grpc-js/build/src/make-client';
import { promisify } from 'util';

const PROTO_PATH = path.resolve(__dirname, '../../proto/users.proto');

const packageDefinition = loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true,
});

const { UserService } : { UserService?: ServiceClientConstructor } = grpc
  .loadPackageDefinition(packageDefinition);

if (!UserService) {
  throw new Error('ServiceClientConstructor is missing');
}

const client = new UserService(
  'localhost:30043',
  grpc.credentials.createInsecure(),
);

Object.keys(Object.getPrototypeOf(client)).forEach((functionName) => {
  client[functionName] = promisify(client[functionName]);
});

export default client;
