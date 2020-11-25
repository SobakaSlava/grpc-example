import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import client from './client';

const app = new Koa();
app.use(bodyParser());
const router = new Router();

router
  .post('/users', async (ctx) => {
    const { name, age, address } = ctx.request.body;

    ctx.body = await client.insert({ name, age, address });
  })
  .get('/users/:id', async (ctx) => {
    ctx.body = await client.get({ id: ctx.params.id });
  })
  .get('/users', async (ctx) => {
    ctx.body = await client.getAll({});
  })
  .put('/users/:id', async (ctx) => {
    const { name, age, address } = ctx.request.body;

    ctx.body = await client.update({
      id: ctx.params.id,
      name,
      age,
      address,
    });
  })
  .delete('/users/:id', async (ctx) => {
    await client.remove({ id: ctx.params.id });
    ctx.body = {};
  });

app.use(router.routes());

app.listen(3000);
