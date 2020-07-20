const keys  = require('./keys');

//Express APP Setup
const express  = require('express');
const bodyParser = require('body-parser')
const cors  = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

//Postgres client setup

const {Pool} = require('pg');

const pgClient  = new Pool({
    user: keys.pgUser,
    port: keys.pgPort,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    host: keys.pgHost
});

pgClient.on('error', ()=>{console.log("Lost connection to PG");})

pgClient
.query('CREATE TABLE IF NOT EXISTS VALUES(NUMBER INT)')
.catch(err => console.log(err));

//Redis setup
const redis = require('redis');
const redisClient  = redis.createClient({
    host : keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

//Express route handlers

app.get('/', (req,res)=>{
    res.send('Hi');
});

app.get('/values/all', async (req,res) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

app.get('/values/current', async (req,res) => {
    redisClient.hgetall('values',(err, values)=>{
    res.send(values);
    });
});

app.post('/values', (req, res) =>  {
    const index  = req.body.index;

    if(parseInt(index) > 40){
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('Inset into values(number) values($1)',[index]);
    res.send({working: true})
});

app.listen(5000, err => {
    console.log("Listening on port 5000");
});



























