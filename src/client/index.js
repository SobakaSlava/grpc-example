"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const router_1 = __importDefault(require("@koa/router"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const client = require('./client');
const app = new koa_1.default();
app.use(koa_bodyparser_1.default());
const router = new router_1.default();
router
    .post('/users', async (ctx) => {
    const { name, age, address } = ctx.request.body;
    ctx.body = await client.insert().sendMessage({ name, age, address });
})
    .get('/users/:id', async (ctx) => {
    ctx.body = await client.get().sendMessage({ id: ctx.params.id });
})
    .get('/users', async (ctx) => {
    const { users } = await client.getAll().sendMessage();
    ctx.body = users;
})
    .put('/users/:id', async (ctx) => {
    const { name, age, address } = ctx.request.body;
    ctx.body = await client.update().sendMessage({
        id: ctx.params.id,
        name,
        age,
        address,
    });
})
    .delete('/users/:id', async (ctx) => {
    await client.remove().sendMessage({ id: ctx.params.id });
    ctx.body = {};
});
app.use(router.routes());
app.listen(3000);
