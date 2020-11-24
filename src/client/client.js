"use strict";
const path = require('path');
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const grpc_promise = require('grpc-promise');
const PROTO_PATH = path.resolve(__dirname, '../users.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});
const { UserService } = grpc.loadPackageDefinition(packageDefinition);
const client = new UserService("localhost:30043", grpc.credentials.createInsecure());
grpc_promise.promisifyAll(client);
module.exports = client;
