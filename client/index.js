const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const client = require('./client');

const app = new Koa();
app.use(bodyParser());
const router = new Router();

router
  .post('/users', async (ctx) => {
    const { name, age, address } = ctx.request.body;

    ctx.body = await client.insert().sendMessage({ name, age, address })
  })
  .get('/users/:id', async (ctx) => {
    ctx.body = await client.get().sendMessage({ id: ctx.params.id })
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
    })
  })
  .delete('/users/:id', async (ctx) => {
    await client.remove().sendMessage({ id: ctx.params.id });
    ctx.body = {};
  })

app.use(router.routes())

app.listen(3000);
